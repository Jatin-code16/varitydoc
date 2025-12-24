import uuid
from datetime import datetime
from typing import Optional, List

from cosmos_service import database
from auth import hash_password
from rbac import UserRole, validate_role

users_container = database.get_container_client("users")


def create_user(username: str, password: str, role: str = "document_owner", email: str = None):
    """
    Create a new user with specified role.
    Default role is 'document_owner' for security.
    """
    # Validate role
    if not validate_role(role):
        raise ValueError(f"Invalid role: {role}. Valid roles: {[r.value for r in UserRole]}")
    
    user = {
        "id": str(uuid.uuid4()),
        "username": username,
        "email": email or f"{username}@docvault.local",
        "password_hash": hash_password(password),
        "role": role,
        "created_at": datetime.utcnow().isoformat(),
        "is_active": True,
        "last_login": None
    }
    users_container.create_item(user)
    return user


def get_user_by_username(username: str) -> Optional[dict]:
    query = "SELECT * FROM c WHERE c.username=@username"
    params = [{"name": "@username", "value": username}]

    items = list(
        users_container.query_items(
            query=query,
            parameters=params,
            enable_cross_partition_query=True,
        )
    )
    return items[0] if items else None


def get_all_users() -> List[dict]:
    """Get all users (admin only)"""
    query = "SELECT c.id, c.username, c.email, c.role, c.created_at, c.is_active, c.last_login FROM c"
    items = list(users_container.query_items(
        query=query,
        enable_cross_partition_query=True
    ))
    return items


def update_user_role(username: str, new_role: str) -> dict:
    """Update user role (admin only)"""
    if not validate_role(new_role):
        raise ValueError(f"Invalid role: {new_role}")
    
    user = get_user_by_username(username)
    if not user:
        raise ValueError(f"User not found: {username}")
    
    user["role"] = new_role
    users_container.upsert_item(user)
    return user


def deactivate_user(username: str) -> dict:
    """Deactivate user account (admin only)"""
    user = get_user_by_username(username)
    if not user:
        raise ValueError(f"User not found: {username}")
    
    user["is_active"] = False
    users_container.upsert_item(user)
    return user


def update_last_login(username: str):
    """Update user's last login timestamp"""
    user = get_user_by_username(username)
    if user:
        user["last_login"] = datetime.utcnow().isoformat()
        users_container.upsert_item(user)


def change_user_password(username: str, current_password: str, new_password: str) -> dict:
    """Change user password after verifying current password"""
    from auth import verify_password
    
    user = get_user_by_username(username)
    if not user:
        raise ValueError("User not found")
    
    # Verify current password
    if not verify_password(current_password, user["password_hash"]):
        raise ValueError("Current password is incorrect")
    
    # Validate new password
    if len(new_password) < 6:
        raise ValueError("New password must be at least 6 characters")
    
    # Update password
    user["password_hash"] = hash_password(new_password)
    users_container.upsert_item(user)
    
    return {"message": "Password changed successfully"}
