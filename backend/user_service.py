import uuid
from datetime import datetime
from typing import Optional

from cosmos_service import database
from auth import hash_password

users_container = database.get_container_client("users")


def create_user(username: str, password: str, role: str = "user"):
    user = {
        "id": str(uuid.uuid4()),
        "username": username,
        "password_hash": hash_password(password),
        "role": role,
        "created_at": datetime.utcnow().isoformat(),
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
