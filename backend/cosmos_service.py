import os
import uuid
from datetime import datetime
from azure.cosmos import CosmosClient, exceptions
from dotenv import load_dotenv
load_dotenv()

# Load env variables
COSMOS_ENDPOINT = os.getenv("COSMOS_ENDPOINT")
COSMOS_KEY = os.getenv("COSMOS_KEY")
DATABASE_NAME = os.getenv("COSMOS_DATABASE")
CONTAINER_NAME = os.getenv("COSMOS_CONTAINER")

if not all([COSMOS_ENDPOINT, COSMOS_KEY, DATABASE_NAME, CONTAINER_NAME]):
    raise RuntimeError("Cosmos DB environment variables not set")


client = CosmosClient(COSMOS_ENDPOINT, credential=COSMOS_KEY)
database = client.get_database_client(DATABASE_NAME)
container = database.get_container_client(CONTAINER_NAME)


def store_document(filename: str, sha256: str, signature_data: dict = None, uploaded_by: str = None):
    item = {
        "id": f"doc:{filename}",
        "type": "document",
        "filename": filename,
        "sha256": sha256,
        "uploaded_at": datetime.utcnow().isoformat(),
        "uploaded_by": uploaded_by
    }
    
    # Add signature data if provided
    if signature_data:
        item["signature"] = signature_data

    try:
        container.upsert_item(item)
    except exceptions.CosmosHttpResponseError as e:
        raise RuntimeError(f"Failed to store document: {str(e)}")


def get_stored_hash(filename: str) -> str | None:
    try:
        item = container.read_item(
            item=f"doc:{filename}",
            partition_key="document"
        )
        return item.get("sha256")
    except exceptions.CosmosResourceNotFoundError:
        return None


def get_document_metadata(filename: str) -> dict | None:
    """Get full document metadata including signature"""
    try:
        item = container.read_item(
            item=f"doc:{filename}",
            partition_key="document"
        )
        return item
    except exceptions.CosmosResourceNotFoundError:
        return None


def log_audit_event(filename: str, action: str, result: str):
    item = {
        "id": f"audit:{uuid.uuid4()}",
        "type": "audit",
        "filename": filename,
        "action": action,
        "result": result,
        "timestamp": datetime.utcnow().isoformat()
    }

    try:
        container.create_item(item)
    except exceptions.CosmosHttpResponseError as e:
        raise RuntimeError(f"Failed to log audit event: {str(e)}")


def get_audit_logs():
    query = "SELECT * FROM c WHERE c.type = 'audit' ORDER BY c.timestamp DESC"
    return list(container.query_items(
        query=query,
        enable_cross_partition_query=True
    ))


def get_system_stats():
    """Get system statistics for admin dashboard"""
    try:
        # Count documents
        doc_query = "SELECT VALUE COUNT(1) FROM c WHERE c.type = 'document'"
        total_documents = list(container.query_items(
            query=doc_query,
            enable_cross_partition_query=True
        ))[0]
        
        # Count users
        user_query = "SELECT VALUE COUNT(1) FROM c WHERE c.type = 'user'"
        total_users = list(container.query_items(
            query=user_query,
            enable_cross_partition_query=True
        ))[0]
        
        # Count alerts
        alert_query = "SELECT VALUE COUNT(1) FROM c WHERE c.type = 'alert'"
        total_alerts = list(container.query_items(
            query=alert_query,
            enable_cross_partition_query=True
        ))[0]
        
        # Count audits
        audit_query = "SELECT VALUE COUNT(1) FROM c WHERE c.type = 'audit'"
        total_audits = list(container.query_items(
            query=audit_query,
            enable_cross_partition_query=True
        ))[0]
        
        # Get recent activity (last 10 audit logs)
        recent_query = "SELECT TOP 10 c.filename, c.action, c.result, c.timestamp FROM c WHERE c.type = 'audit' ORDER BY c.timestamp DESC"
        recent_activity = list(container.query_items(
            query=recent_query,
            enable_cross_partition_query=True
        ))
        
        return {
            "total_documents": total_documents,
            "total_users": total_users,
            "total_alerts": total_alerts,
            "total_audits": total_audits,
            "recent_activity": recent_activity
        }
    except Exception as e:
        raise RuntimeError(f"Failed to get system stats: {str(e)}")


def search_documents_by_name(query: str):
    """Search documents by filename"""
    try:
        sql = f"SELECT * FROM c WHERE c.type = 'document' AND CONTAINS(c.filename, @query) ORDER BY c.uploaded_at DESC"
        return list(container.query_items(
            query=sql,
            parameters=[{"name": "@query", "value": query}],
            enable_cross_partition_query=True
        ))
    except Exception as e:
        raise RuntimeError(f"Failed to search documents: {str(e)}")


def get_all_documents(uploaded_by: str = None):
    """Get all documents, optionally filtered by uploader"""
    try:
        if uploaded_by:
            sql = "SELECT * FROM c WHERE c.type = 'document' AND c.uploaded_by = @uploader ORDER BY c.uploaded_at DESC"
            return list(container.query_items(
                query=sql,
                parameters=[{"name": "@uploader", "value": uploaded_by}],
                enable_cross_partition_query=True
            ))
        else:
            sql = "SELECT * FROM c WHERE c.type = 'document' ORDER BY c.uploaded_at DESC"
            return list(container.query_items(
                query=sql,
                enable_cross_partition_query=True
            ))
    except Exception as e:
        raise RuntimeError(f"Failed to get documents: {str(e)}")
