import os
import uuid
import secrets
import sqlite3
import logging
from datetime import datetime, timedelta
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

from auth import hash_password, verify_password
from rbac import UserRole, validate_role

logger = logging.getLogger(__name__)

# Check Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase_client = None
if SUPABASE_URL and SUPABASE_KEY and "your_" not in SUPABASE_KEY:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("user_service: Successfully connected to Supabase")
    except Exception as e:
        logger.warning(f"user_service: Could not connect to Supabase: {e}. Using offline local storage.")

SQLITE_DB_PATH = os.path.join(os.path.dirname(__file__), "docvault.db")

def init_user_db():
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'document_owner',
            created_at TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            last_login TEXT,
            reset_token TEXT,
            reset_token_expiry TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS role_requests (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            current_role TEXT NOT NULL,
            requested_role TEXT NOT NULL,
            reason TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL,
            reviewed_at TEXT,
            reviewed_by TEXT
        )
    """)
    conn.commit()
    conn.close()

init_user_db()




def create_user(username: str, password: str, role: str = "document_owner", email: str = None):
    """Create a new user with specified role."""
    if not validate_role(role):
        raise ValueError(f"Invalid role: {role}. Valid roles: {[r.value for r in UserRole]}")
    
    user_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()
    pwd_hash = hash_password(password)
    user_email = email or f"{username}@docvault.local"

    user = {
        "id": user_id,
        "username": username,
        "email": user_email,
        "password_hash": pwd_hash,
        "role": role,
        "created_at": created_at,
        "is_active": True,
        "last_login": None
    }

    # 1. Try Supabase
    if supabase_client:
        try:
            supabase_client.table("users").insert(user).execute()
            # Also keep local in sync
            _save_local_user(user)
            return user
        except Exception as e:
            logger.warning(f"Supabase create_user error: {e}. Saving to local SQLite.")

    # 2. SQLite
    _save_local_user(user)
    return user


def _save_local_user(user: dict):
    """Persist user to local offline SQLite database"""
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash FROM users WHERE username = ?", (user.get("username"),))
    existing = cursor.fetchone()
    pwd_hash = user.get("password_hash") or (existing[0] if existing else "")

    cursor.execute("""
        INSERT OR REPLACE INTO users (id, username, email, password_hash, role, created_at, is_active, last_login, reset_token, reset_token_expiry)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user.get("id") or str(uuid.uuid4()),
        user.get("username"),
        user.get("email"),
        pwd_hash,
        user.get("role", "document_owner"),
        user.get("created_at") or datetime.utcnow().isoformat(),
        1 if user.get("is_active", True) else 0,
        user.get("last_login"),
        user.get("reset_token"),
        user.get("reset_token_expiry")
    ))
    conn.commit()
    conn.close()


def _save_local_role_request(req: dict):
    """Persist role request to local offline SQLite database"""
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO role_requests (id, username, current_role, requested_role, reason, status, created_at, reviewed_at, reviewed_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        req.get("id"),
        req.get("username"),
        req.get("current_role"),
        req.get("requested_role"),
        req.get("reason"),
        req.get("status", "pending"),
        req.get("created_at") or datetime.utcnow().isoformat(),
        req.get("reviewed_at"),
        req.get("reviewed_by")
    ))
    conn.commit()
    conn.close()


def get_user_by_username(username: str) -> Optional[dict]:
    """Retrieve user - Supabase first, SQLite offline fallback"""
    # 1. Try Supabase
    if supabase_client:
        try:
            res = supabase_client.table("users").select("*").eq("username", username).execute()
            if res.data and len(res.data) > 0:
                user = res.data[0]
                user["is_active"] = bool(user.get("is_active", True))
                # Sync to local offline cache
                _save_local_user(user)
                return user
        except Exception as e:
            logger.warning(f"Supabase get_user_by_username error: {e}. Falling back to offline local storage.")

    # 2. SQLite Fallback
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, password_hash, role, created_at, is_active, last_login, reset_token, reset_token_expiry FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "id": row[0],
            "username": row[1],
            "email": row[2],
            "password_hash": row[3],
            "role": row[4],
            "created_at": row[5],
            "is_active": bool(row[6]),
            "last_login": row[7],
            "reset_token": row[8],
            "reset_token_expiry": row[9]
        }
    return None


def seed_default_admin():
    """Ensure default admin user exists"""
    try:
        existing = get_user_by_username("admin")
        if not existing:
            create_user(
                username="admin",
                password="adminpassword123",
                role="admin",
                email="admin@docvault.local"
            )
            logger.info("Created default admin user (admin / adminpassword123)")
    except Exception as e:
        logger.warning(f"Could not seed admin user: {e}")

try:
    seed_default_admin()
except Exception:
    pass


def get_all_users() -> List[dict]:
    """Get all users (admin only) - Supabase first, SQLite offline fallback"""
    # 1. Try Supabase
    if supabase_client:
        try:
            res = supabase_client.table("users").select("id, username, email, role, created_at, is_active, last_login").execute()
            if res.data:
                for u in res.data:
                    u["is_active"] = bool(u.get("is_active", True))
                    # Sync to local offline cache
                    _save_local_user(u)
                return res.data
        except Exception as e:
            logger.warning(f"Supabase get_all_users error: {e}. Falling back to offline local storage.")

    # 2. SQLite Fallback
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, role, created_at, is_active, last_login FROM users")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "username": r[1],
            "email": r[2],
            "role": r[3],
            "created_at": r[4],
            "is_active": bool(r[5]),
            "last_login": r[6]
        }
        for r in rows
    ]


def update_user_role(username: str, new_role: str) -> dict:
    """Update user role (admin only)"""
    if not validate_role(new_role):
        raise ValueError(f"Invalid role: {new_role}")
    
    user = get_user_by_username(username)
    if not user:
        raise ValueError(f"User not found: {username}")
    
    user["role"] = new_role

    if supabase_client:
        try:
            supabase_client.table("users").update({"role": new_role}).eq("username", username).execute()
        except Exception as e:
            logger.warning(f"Supabase update_user_role error: {e}")

    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET role = ? WHERE username = ?", (new_role, username))
    conn.commit()
    conn.close()
    return user


def deactivate_user(username: str) -> dict:
    """Deactivate user account (admin only)"""
    user = get_user_by_username(username)
    if not user:
        raise ValueError(f"User not found: {username}")
    
    user["is_active"] = False

    if supabase_client:
        try:
            supabase_client.table("users").update({"is_active": False}).eq("username", username).execute()
        except Exception as e:
            logger.warning(f"Supabase deactivate_user error: {e}")

    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET is_active = 0 WHERE username = ?", (username,))
    conn.commit()
    conn.close()
    return user


def update_last_login(username: str):
    """Update user's last login timestamp"""
    now = datetime.utcnow().isoformat()
    if supabase_client:
        try:
            supabase_client.table("users").update({"last_login": now}).eq("username", username).execute()
        except Exception:
            pass

    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET last_login = ? WHERE username = ?", (now, username))
    conn.commit()
    conn.close()


def change_user_password(username: str, current_password: str, new_password: str) -> dict:
    """Change user password after verifying current password"""
    user = get_user_by_username(username)
    if not user:
        raise ValueError("User not found")
    
    if not verify_password(current_password, user["password_hash"]):
        raise ValueError("Current password is incorrect")
    
    if len(new_password) < 6:
        raise ValueError("New password must be at least 6 characters")
    
    new_hash = hash_password(new_password)

    if supabase_client:
        try:
            supabase_client.table("users").update({"password_hash": new_hash}).eq("username", username).execute()
        except Exception as e:
            logger.warning(f"Supabase change_user_password error: {e}")

    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password_hash = ? WHERE username = ?", (new_hash, username))
    conn.commit()
    conn.close()
    return {"message": "Password changed successfully"}


def initiate_password_reset(username: str) -> str:
    """Generate a reset token and save it to the user record."""
    user = get_user_by_username(username)
    if not user:
        raise ValueError("User not found")
    
    token = secrets.token_urlsafe(32)
    expiry = (datetime.utcnow() + timedelta(minutes=15)).isoformat()

    if supabase_client:
        try:
            supabase_client.table("users").update({
                "reset_token": token,
                "reset_token_expiry": expiry
            }).eq("username", username).execute()
        except Exception as e:
            logger.warning(f"Supabase initiate_password_reset error: {e}")

    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE username = ?", (token, expiry, username))
    conn.commit()
    conn.close()
    return token


def complete_password_reset(username: str, token: str, new_password: str):
    """Verify token and update password."""
    user = get_user_by_username(username)
    if not user:
        raise ValueError("User not found")
        
    stored_token = user.get("reset_token")
    stored_expiry = user.get("reset_token_expiry")
    
    if not stored_token or not stored_expiry:
         raise ValueError("Invalid reset request")
         
    if stored_token != token:
        raise ValueError("Invalid reset token")
        
    if datetime.utcnow().isoformat() > stored_expiry:
        raise ValueError("Reset token has expired")
        
    if len(new_password) < 6:
        raise ValueError("Password must be at least 6 characters")
        
    new_hash = hash_password(new_password)

    if supabase_client:
        try:
            supabase_client.table("users").update({
                "password_hash": new_hash,
                "reset_token": None,
                "reset_token_expiry": None
            }).eq("username", username).execute()
        except Exception as e:
            logger.warning(f"Supabase complete_password_reset error: {e}")

    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE username = ?", (new_hash, username))
    conn.commit()
    conn.close()
    return True


def create_role_request(username: str, current_role: str, requested_role: str, reason: str = "") -> dict:
    """Create a role elevation request - Supabase first, SQLite offline fallback"""
    if not validate_role(requested_role):
        raise ValueError(f"Invalid role requested: {requested_role}")
    
    if current_role == requested_role:
        raise ValueError("You already possess this role.")

    req_id = f"req_{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat()

    req_data = {
        "id": req_id,
        "username": username,
        "current_role": current_role,
        "requested_role": requested_role,
        "reason": reason,
        "status": "pending",
        "created_at": now,
        "reviewed_at": None,
        "reviewed_by": None
    }

    # 1. Try Supabase first
    if supabase_client:
        try:
            supabase_client.table("role_requests").insert(req_data).execute()
            _save_local_role_request(req_data)
            return req_data
        except Exception as e:
            logger.warning(f"Supabase create_role_request error: {e}. Saving to offline local storage.")

    # 2. SQLite Fallback
    _save_local_role_request(req_data)
    return req_data


def get_user_role_requests(username: str) -> list:
    """Get all requests for a user - Supabase first, SQLite offline fallback"""
    # 1. Try Supabase first
    if supabase_client:
        try:
            res = (
                supabase_client.table("role_requests")
                .select("*")
                .eq("username", username)
                .order("created_at", desc=True)
                .execute()
            )
            if res.data is not None:
                for r in res.data:
                    _save_local_role_request(r)
                return res.data
        except Exception as e:
            logger.warning(f"Supabase get_user_role_requests error: {e}. Falling back to offline local storage.")

    # 2. SQLite Fallback
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, username, current_role, requested_role, reason, status, created_at, reviewed_at, reviewed_by
        FROM role_requests
        WHERE username = ?
        ORDER BY created_at DESC
    """, (username,))
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": r[0],
            "username": r[1],
            "current_role": r[2],
            "requested_role": r[3],
            "reason": r[4],
            "status": r[5],
            "created_at": r[6],
            "reviewed_at": r[7],
            "reviewed_by": r[8]
        }
        for r in rows
    ]


def get_all_role_requests(status_filter: str = None) -> list:
    """Get all role requests - Supabase first, SQLite offline fallback"""
    # 1. Try Supabase first
    if supabase_client:
        try:
            query = supabase_client.table("role_requests").select("*").order("created_at", desc=True)
            if status_filter and status_filter != "all":
                query = query.eq("status", status_filter)
            res = query.execute()
            if res.data is not None:
                for r in res.data:
                    _save_local_role_request(r)
                return res.data
        except Exception as e:
            logger.warning(f"Supabase get_all_role_requests error: {e}. Falling back to offline local storage.")

    # 2. SQLite Fallback
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    if status_filter and status_filter != "all":
        cursor.execute("""
            SELECT id, username, current_role, requested_role, reason, status, created_at, reviewed_at, reviewed_by
            FROM role_requests
            WHERE status = ?
            ORDER BY created_at DESC
        """, (status_filter,))
    else:
        cursor.execute("""
            SELECT id, username, current_role, requested_role, reason, status, created_at, reviewed_at, reviewed_by
            FROM role_requests
            ORDER BY created_at DESC
        """)
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": r[0],
            "username": r[1],
            "current_role": r[2],
            "requested_role": r[3],
            "reason": r[4],
            "status": r[5],
            "created_at": r[6],
            "reviewed_at": r[7],
            "reviewed_by": r[8]
        }
        for r in rows
    ]


def review_role_request(request_id: str, new_status: str, admin_username: str) -> dict:
    """Review role request (approve/reject) - Supabase first, SQLite offline fallback"""
    if new_status not in ["approved", "rejected"]:
        raise ValueError("Status must be approved or rejected")

    # Fetch request first (checks Supabase then local)
    req_item = None
    if supabase_client:
        try:
            res = supabase_client.table("role_requests").select("*").eq("id", request_id).execute()
            if res.data and len(res.data) > 0:
                req_item = res.data[0]
        except Exception:
            pass

    if not req_item:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, requested_role FROM role_requests WHERE id = ?", (request_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            raise ValueError("Role request not found")
        username = row[1]
        requested_role = row[2]
    else:
        username = req_item["username"]
        requested_role = req_item["requested_role"]

    now = datetime.utcnow().isoformat()
    update_data = {
        "status": new_status,
        "reviewed_at": now,
        "reviewed_by": admin_username
    }

    # 1. Try Supabase update
    if supabase_client:
        try:
            supabase_client.table("role_requests").update(update_data).eq("id", request_id).execute()
        except Exception as e:
            logger.warning(f"Supabase review_role_request error: {e}. Updating offline local storage.")

    # 2. Update local SQLite
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE role_requests
        SET status = ?, reviewed_at = ?, reviewed_by = ?
        WHERE id = ?
    """, (new_status, now, admin_username, request_id))
    conn.commit()
    conn.close()

    if new_status == "approved":
        update_user_role(username, requested_role)

    return {
        "id": request_id,
        "username": username,
        "requested_role": requested_role,
        "status": new_status,
        "reviewed_at": now,
        "reviewed_by": admin_username
    }

