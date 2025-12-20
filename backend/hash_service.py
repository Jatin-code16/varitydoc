import hashlib
import os


def generate_sha256(file_path: str) -> str:
    """
    Generate SHA-256 hash for a given file.

    :param file_path: Path to the file
    :return: SHA-256 hash as hex string
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    sha256_hash = hashlib.sha256()

    try:
        with open(file_path, "rb") as file:
            # Read file in chunks to handle large files
            for chunk in iter(lambda: file.read(4096), b""):
                sha256_hash.update(chunk)

        return sha256_hash.hexdigest()

    except Exception as e:
        raise RuntimeError(f"Error while hashing file: {str(e)}")


if __name__ == "__main__":
    # Simple manual test
    test_file = "test_document.txt"

    if not os.path.exists(test_file):
        with open(test_file, "w") as f:
            f.write("This is a test document")

    hash_value = generate_sha256(test_file)
    print(f"SHA-256 Hash: {hash_value}")
