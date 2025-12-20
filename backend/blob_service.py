import os
from azure.storage.blob import BlobServiceClient
from azure.core.exceptions import AzureError

CONTAINER_NAME = "documents"


def upload_file_to_blob(local_file_path: str, blob_name: str) -> None:
    """
    Upload a file to Azure Blob Storage.

    :param local_file_path: Path to local file
    :param blob_name: Name of blob in container
    """
    connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")

    if not connection_string:
        raise RuntimeError("Azure storage connection string not set")

    try:
        blob_service_client = BlobServiceClient.from_connection_string(
            connection_string
        )

        container_client = blob_service_client.get_container_client(CONTAINER_NAME)

        with open(local_file_path, "rb") as data:
            container_client.upload_blob(
                name=blob_name,
                data=data,
                overwrite=True
            )

    except AzureError as e:
        raise RuntimeError(f"Azure Blob upload failed: {str(e)}")
