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

    if not connection_string or "your_azure_storage_connection_string_here" in connection_string:
        # Fallback to local storage if Azure Storage is not yet configured
        blob_dir = os.path.join("uploads", "blob_storage")
        os.makedirs(blob_dir, exist_ok=True)
        import shutil
        shutil.copyfile(local_file_path, os.path.join(blob_dir, blob_name))
        return

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
