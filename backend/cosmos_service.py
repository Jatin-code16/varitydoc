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


def store_document(filename: str, sha256: str):
    item = {
        "id": f"doc:{filename}",
        "type": "document",
        "filename": filename,
        "sha256": sha256,
        "uploaded_at": datetime.utcnow().isoformat()
    }

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
