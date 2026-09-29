import os
import uuid
import json
import sqlite3
import logging
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Cosmos DB configuration (backward compatibility)
COSMOS_ENDPOINT = os.getenv("COSMOS_ENDPOINT")
COSMOS_KEY = os.getenv("COSMOS_KEY")
DATABASE_NAME = os.getenv("COSMOS_DATABASE", "docvault_db")
CONTAINER_NAME = os.getenv("COSMOS_CONTAINER", "documents")

# Initialize SQLite database for local fallback
SQLITE_DB_PATH = os.path.join(os.path.dirname(__file__), "docvault.db")

def init_sqlite_db():
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            sha256 TEXT NOT NULL,
            uploaded_at TEXT NOT NULL,
            uploaded_by TEXT,
            signature TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            action TEXT NOT NULL,
            result TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)
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
    conn.commit()
    conn.close()

init_sqlite_db()

# Try Supabase initialization
supabase_client = None
if SUPABASE_URL and SUPABASE_KEY and "your_" not in SUPABASE_KEY:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Successfully connected to Supabase")
    except Exception as e:
        logger.warning(f"Could not connect to Supabase ({e}). Using local SQLite engine.")

# Try Azure Cosmos DB initialization (if configured)
cosmos_container = None
if COSMOS_ENDPOINT and COSMOS_KEY and "your_" not in COSMOS_KEY:
    try:
        from azure.cosmos import CosmosClient
        client = CosmosClient(COSMOS_ENDPOINT, credential=COSMOS_KEY)
        database = client.get_database_client(DATABASE_NAME)
        cosmos_container = database.get_container_client(CONTAINER_NAME)
        logger.info("Successfully connected to Azure Cosmos DB")
    except Exception as e:
        logger.warning(f"Could not connect to Cosmos DB ({e}).")

# Backward compatibility dummy database object for any legacy import
class DummyDatabase:
    def get_container_client(self, name):
        return None
database = DummyDatabase()


# ================= DOCUMENT & AUDIT OPERATIONS =================

def store_document(filename: str, sha256: str, signature_data: dict = None, uploaded_by: str = None):
    uploaded_at = datetime.utcnow().isoformat()
    doc_id = f"doc:{filename}"

    # 1. Try Supabase
    if supabase_client:
        try:
            item = {
                "id": doc_id,
                "filename": filename,
                "sha256": sha256,
                "uploaded_at": uploaded_at,
                "uploaded_by": uploaded_by,
                "signature": signature_data
            }
            supabase_client.table("documents").upsert(item).execute()
            return
        except Exception as e:
            logger.warning(f"Supabase store_document failed: {e}. Falling back to SQLite.")

    # 2. Try Cosmos DB
    if cosmos_container:
        try:
            item = {
                "id": doc_id,
                "type": "document",
                "filename": filename,
                "sha256": sha256,
                "uploaded_at": uploaded_at,
                "uploaded_by": uploaded_by
            }
            if signature_data:
                item["signature"] = signature_data
            cosmos_container.upsert_item(item)
            return
        except Exception as e:
            logger.warning(f"Cosmos DB store_document failed: {e}. Falling back to SQLite.")

    # 3. SQLite Fallback
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO documents (id, filename, sha256, uploaded_at, uploaded_by, signature)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (doc_id, filename, sha256, uploaded_at, uploaded_by, json.dumps(signature_data) if signature_data else None))
    conn.commit()
    conn.close()


def get_stored_hash(filename: str) -> str | None:
    # 1. Try Supabase
    if supabase_client:
        try:
            res = supabase_client.table("documents").select("sha256").eq("filename", filename).execute()
            if res.data and len(res.data) > 0:
                return res.data[0].get("sha256")
        except Exception as e:
            logger.warning(f"Supabase get_stored_hash error: {e}")

    # 2. Try Cosmos DB
    if cosmos_container:
        try:
            from azure.cosmos import exceptions
            item = cosmos_container.read_item(item=f"doc:{filename}", partition_key="document")
            return item.get("sha256")
        except Exception:
            pass

    # 3. SQLite Fallback
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT sha256 FROM documents WHERE filename = ?", (filename,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None


def get_document_metadata(filename: str) -> dict | None:
    """Get full document metadata including signature"""
    # 1. Try Supabase
    if supabase_client:
        try:
            res = supabase_client.table("documents").select("*").eq("filename", filename).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.warning(f"Supabase get_document_metadata error: {e}")

    # 2. Try Cosmos DB
    if cosmos_container:
        try:
            return cosmos_container.read_item(item=f"doc:{filename}", partition_key="document")
        except Exception:
            pass

    # 3. SQLite Fallback
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, sha256, uploaded_at, uploaded_by, signature FROM documents WHERE filename = ?", (filename,))
    row = cursor.fetchone()
    conn.close()
    if row:
        sig = json.loads(row[5]) if row[5] else None
        return {
            "id": row[0],
            "filename": row[1],
            "sha256": row[2],
            "uploaded_at": row[3],
            "uploaded_by": row[4],
            "signature": sig
        }
    return None


def log_audit_event(filename: str, action: str, result: str):
    audit_id = f"audit:{uuid.uuid4()}"
    timestamp = datetime.utcnow().isoformat()

    # 1. Try Supabase
    if supabase_client:
        try:
            supabase_client.table("audit_logs").insert({
                "id": audit_id,
                "filename": filename,
                "action": action,
                "result": result,
                "timestamp": timestamp
            }).execute()
            return
        except Exception as e:
            logger.warning(f"Supabase log_audit_event error: {e}")

    # 2. Try Cosmos DB
    if cosmos_container:
        try:
            cosmos_container.create_item({
                "id": audit_id,
                "type": "audit",
                "filename": filename,
                "action": action,
                "result": result,
                "timestamp": timestamp
            })
            return
        except Exception as e:
            logger.warning(f"Cosmos DB log_audit_event error: {e}")

    # 3. SQLite Fallback
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO audit_logs (id, filename, action, result, timestamp)
        VALUES (?, ?, ?, ?, ?)
    """, (audit_id, filename, action, result, timestamp))
    conn.commit()
    conn.close()


def get_audit_logs():
    # 1. Try Supabase
    if supabase_client:
        try:
            res = supabase_client.table("audit_logs").select("*").order("timestamp", desc=True).execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.warning(f"Supabase get_audit_logs error: {e}")

    # 2. Try Cosmos DB
    if cosmos_container:
        try:
            query = "SELECT * FROM c WHERE c.type = 'audit' ORDER BY c.timestamp DESC"
            return list(cosmos_container.query_items(query=query, enable_cross_partition_query=True))
        except Exception as e:
            logger.warning(f"Cosmos DB get_audit_logs error: {e}")

    # 3. SQLite Fallback
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, action, result, timestamp FROM audit_logs ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {"id": r[0], "filename": r[1], "action": r[2], "result": r[3], "timestamp": r[4]}
        for r in rows
    ]


def get_system_stats():
    """Get system statistics for admin dashboard"""
    # 1. Try Supabase
    if supabase_client:
        try:
            docs = supabase_client.table("documents").select("id").execute().data or []
            users = supabase_client.table("users").select("id").execute().data or []
            audits = supabase_client.table("audit_logs").select("*").order("timestamp", desc=True).limit(10).execute().data or []
            return {
                "total_documents": len(docs),
                "total_users": len(users),
                "total_alerts": 0,
                "total_audits": len(audits),
                "recent_activity": audits
            }
        except Exception as e:
            logger.warning(f"Supabase get_system_stats error: {e}")

    # 2. SQLite Fallback
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM documents")
    total_docs = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM users")
    total_users = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM audit_logs")
    total_audits = cursor.fetchone()[0]
    cursor.execute("SELECT filename, action, result, timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT 10")
    recent = cursor.fetchall()
    conn.close()

    return {
        "total_documents": total_docs,
        "total_users": total_users,
        "total_alerts": 0,
        "total_audits": total_audits,
        "recent_activity": [
            {"filename": r[0], "action": r[1], "result": r[2], "timestamp": r[3]}
            for r in recent
        ]
    }


def search_documents_by_name(query: str):
    """Search documents by filename"""
    # 1. Try Supabase
    if supabase_client:
        try:
            res = supabase_client.table("documents").select("*").ilike("filename", f"%{query}%").order("uploaded_at", desc=True).execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.warning(f"Supabase search_documents_by_name error: {e}")

    # 2. SQLite Fallback
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, sha256, uploaded_at, uploaded_by, signature FROM documents WHERE filename LIKE ? ORDER BY uploaded_at DESC", (f"%{query}%",))
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "filename": r[1],
            "sha256": r[2],
            "uploaded_at": r[3],
            "uploaded_by": r[4],
            "signature": json.loads(r[5]) if r[5] else None
        }
        for r in rows
    ]


def get_all_documents(uploaded_by: str = None):
    """Get all documents, optionally filtered by uploader"""
    # 1. Try Supabase
    if supabase_client:
        try:
            q = supabase_client.table("documents").select("*").order("uploaded_at", desc=True)
            if uploaded_by:
                q = q.eq("uploaded_by", uploaded_by)
            res = q.execute()
            if res.data:
                return res.data
        except Exception as e:
            logger.warning(f"Supabase get_all_documents error: {e}")

    # 2. SQLite Fallback
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    if uploaded_by:
        cursor.execute("SELECT id, filename, sha256, uploaded_at, uploaded_by, signature FROM documents WHERE uploaded_by = ? ORDER BY uploaded_at DESC", (uploaded_by,))
    else:
        cursor.execute("SELECT id, filename, sha256, uploaded_at, uploaded_by, signature FROM documents ORDER BY uploaded_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "filename": r[1],
            "sha256": r[2],
            "uploaded_at": r[3],
            "uploaded_by": r[4],
            "signature": json.loads(r[5]) if r[5] else None
        }
        for r in rows
    ]
