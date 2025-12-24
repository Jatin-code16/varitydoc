"""
Digital Signature Service using Azure Key Vault
Provides cryptographic signing and verification of documents
"""
from azure.identity import DefaultAzureCredential
from azure.keyvault.keys import KeyClient
from azure.keyvault.keys.crypto import CryptographyClient, SignatureAlgorithm
import hashlib
import base64
import os
from dotenv import load_dotenv

load_dotenv()

KEY_VAULT_URL = os.getenv("AZURE_KEY_VAULT_URL")
KEY_NAME = "docvault-signing-key"

def get_crypto_client(username: str):
    """
    Get a CryptographyClient for signing operations.
    In production, each user would have their own key or certificate.
    For now, we'll use a shared key and include username in metadata.
    """
    try:
        credential = DefaultAzureCredential()
        key_client = KeyClient(vault_url=KEY_VAULT_URL, credential=credential)
        
        # Get or create the signing key
        try:
            key = key_client.get_key(KEY_NAME)
        except:
            # Create RSA key if it doesn't exist
            key = key_client.create_rsa_key(KEY_NAME, size=2048)
        
        crypto_client = CryptographyClient(key, credential=credential)
        return crypto_client
    except Exception as e:
        print(f"Warning: Azure Key Vault not available: {e}")
        return None


def sign_document(document_hash: str, username: str) -> dict:
    """
    Sign a document hash using Azure Key Vault.
    
    Args:
        document_hash: SHA256 hash of the document
        username: Username of the person signing
        
    Returns:
        Dictionary with signature and metadata
    """
    crypto_client = get_crypto_client(username)
    
    if not crypto_client:
        # Fallback: Use local signing (not recommended for production)
        return {
            "signature": base64.b64encode(document_hash.encode()).decode(),
            "algorithm": "base64_fallback",
            "signer": username,
            "key_vault_used": False
        }
    
    try:
        # Convert hash to bytes
        hash_bytes = bytes.fromhex(document_hash)
        
        # Sign using RSA with SHA256
        result = crypto_client.sign(SignatureAlgorithm.rs256, hash_bytes)
        
        # Encode signature to base64 for storage
        signature_b64 = base64.b64encode(result.signature).decode()
        
        return {
            "signature": signature_b64,
            "algorithm": "RS256",
            "signer": username,
            "key_id": result.key_id,
            "key_vault_used": True
        }
    except Exception as e:
        raise Exception(f"Failed to sign document: {e}")


def verify_signature(document_hash: str, signature_data: dict) -> bool:
    """
    Verify a document signature.
    
    Args:
        document_hash: SHA256 hash of the document
        signature_data: Dictionary containing signature and metadata
        
    Returns:
        True if signature is valid, False otherwise
    """
    # Fallback verification
    if not signature_data.get("key_vault_used", False):
        expected = base64.b64encode(document_hash.encode()).decode()
        return signature_data.get("signature") == expected
    
    crypto_client = get_crypto_client(signature_data.get("signer", ""))
    
    if not crypto_client:
        return False
    
    try:
        # Decode signature from base64
        signature_bytes = base64.b64decode(signature_data["signature"])
        
        # Convert hash to bytes
        hash_bytes = bytes.fromhex(document_hash)
        
        # Verify signature
        result = crypto_client.verify(
            SignatureAlgorithm.rs256,
            hash_bytes,
            signature_bytes
        )
        
        return result.is_valid
    except Exception as e:
        print(f"Signature verification error: {e}")
        return False


def get_signature_info(signature_data: dict) -> str:
    """
    Get human-readable signature information.
    """
    if signature_data.get("key_vault_used"):
        return f"Signed by {signature_data['signer']} using Azure Key Vault (RS256)"
    else:
        return f"Signed by {signature_data['signer']} (Fallback mode)"
