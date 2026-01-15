from fastapi import FastAPI, UploadFile, File, HTTPException
import os
import shutil
from dotenv import load_dotenv
from blob_service import upload_file_to_blob
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from user_service import (
    get_user_by_username, create_user, get_all_users, update_user_role, 
    deactivate_user, update_last_login, change_user_password,
    initiate_password_reset, complete_password_reset
)
from auth import verify_password, create_access_token
from dependencies import get_current_user
from rbac import (
    UserRole, has_permission, get_role_permissions, get_role_description,
    PERM_REGISTER_DOCUMENTS, PERM_VIEW_AUDIT_LOGS, PERM_CREATE_USERS,
    PERM_VIEW_ALL_DOCUMENTS, check_document_ownership
)
from opencensus.ext.azure.log_exporter import AzureLogHandler
import logging
import os


load_dotenv()

from hash_service import generate_sha256
from cosmos_service import store_document, get_stored_hash, log_audit_event, get_audit_logs, get_document_metadata
from signature_service import sign_document, verify_signature, get_signature_info
from alert_service import (
    get_user_alerts, mark_alert_read, mark_all_alerts_read, clear_alerts,
    alert_document_tampered, alert_signature_invalid, alert_document_registered,
    alert_unauthorized_access
)

logging.basicConfig(level=logging.INFO)

# Azure Application Insights logging disabled due to handler initialization issues
# if os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING"):
#     try:
#         logging.getLogger().addHandler(
#             AzureLogHandler(
#                 connection_string=os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING")
#             )
#         )
#     except Exception as e:
#         print(f"Warning: Could not initialize Azure logging: {e}")

logger = logging.getLogger(__name__)


app = FastAPI(title="DocVault - Document Verification System")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"


@app.on_event("startup")
def startup_event():
    os.makedirs(UPLOAD_DIR, exist_ok=True)


class PasswordResetRequest(BaseModel):
    username: str

class PasswordResetConfirm(BaseModel):
    username: str
    token: str
    new_password: str

@app.post("/auth/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    try:
        token = initiate_password_reset(request.username)
        logger.info(f"RESET TOKEN FOR {request.username}: {token}")
        return {
            "message": "Password reset initiated. Check logs for token.",
            "debug_token": token
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/auth/reset-password")
async def reset_password_endpoint(request: PasswordResetConfirm):
    try:
        complete_password_reset(request.username, request.token, request.new_password)
        return {"message": "Password reset successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/register")
async def register_document(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    # Check permission
    if not has_permission(current_user, PERM_REGISTER_DOCUMENTS):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to register documents. Required role: Document Owner or Admin"
        )
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    try:
        # Save temporarily to local disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Generate hash locally
        file_hash = generate_sha256(file_path)
        
        # Sign the document hash with user's identity
        signature_data = sign_document(file_hash, current_user["username"])

        # Upload to Azure Blob Storage
        upload_file_to_blob(
            local_file_path=file_path,
            blob_name=file.filename
        )

        # Store metadata with signature
        store_document(
            file.filename, 
            file_hash, 
            signature_data=signature_data,
            uploaded_by=current_user["username"]
        )
        log_audit_event(file.filename, "REGISTER", "SUCCESS")

        logger.info(
            "Document registered",
            extra={
                "event": "register",
                "username": current_user["username"],
                "document_name": file.filename
            }
        )
        
        # Create success alert
        alert_document_registered(
            username=current_user["username"],
            filename=file.filename,
            signed_by=current_user["username"]
        )

        return {
            "filename": file.filename,
            "sha256": file_hash,
            "storage": "AZURE_BLOB",
            "status": "REGISTERED",
            "signed_by": current_user["username"],
            "signature_info": get_signature_info(signature_data)
        }

    except Exception as e:
        log_audit_event(file.filename, "REGISTER", "FAILED")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        file.file.close()


@app.post("/verify")
async def verify_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    try:
        # Save uploaded file temporarily
        temp_path = os.path.join(UPLOAD_DIR, f"verify_{file.filename}")

        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Generate hash of uploaded file
        uploaded_hash = generate_sha256(temp_path)

        # Get stored document metadata including signature
        doc_metadata = get_document_metadata(file.filename)

        if not doc_metadata:
            log_audit_event(file.filename, "VERIFY", "NOT_FOUND")
            raise HTTPException(status_code=404, detail="Document not registered")

        stored_hash = doc_metadata.get("sha256")
        signature_data = doc_metadata.get("signature")
        uploaded_by = doc_metadata.get("uploaded_by", "Unknown")

        # Check hash integrity
        hash_match = uploaded_hash == stored_hash
        
        # Verify digital signature
        signature_valid = False
        if signature_data:
            signature_valid = verify_signature(stored_hash, signature_data)
        
        # Determine overall result
        if hash_match and signature_valid:
            result = "AUTHENTIC"
            status_message = "Document is authentic and signature is valid"
        elif hash_match and not signature_data:
            result = "AUTHENTIC_NO_SIGNATURE"
            status_message = "Document is authentic but has no digital signature"
        elif not hash_match:
            result = "TAMPERED"
            status_message = "Document has been tampered with!"
            # 🚨 CRITICAL ALERT: Send tampering notification to document owner
            alert_document_tampered(
                username=uploaded_by,
                filename=file.filename,
                stored_hash=stored_hash,
                uploaded_hash=uploaded_hash
            )
        else:
            result = "SIGNATURE_INVALID"
            status_message = "Document hash matches but signature is invalid"
            # 🚨 CRITICAL ALERT: Invalid signature
            if signature_data:
                alert_signature_invalid(
                    username=uploaded_by,
                    filename=file.filename,
                    signer=signature_data.get("signer", "Unknown")
                )

        log_audit_event(file.filename, "VERIFY", result)

        response = {
            "filename": file.filename,
            "stored_hash": stored_hash,
            "uploaded_hash": uploaded_hash,
            "result": result,
            "status_message": status_message,
            "hash_match": hash_match,
            "uploaded_by": uploaded_by
        }
        
        # Add signature verification details if available
        if signature_data:
            response["signature_verification"] = {
                "valid": signature_valid,
                "signer": signature_data.get("signer"),
                "algorithm": signature_data.get("algorithm"),
                "info": get_signature_info(signature_data)
            }
        
        return response

    except HTTPException:
        raise

    except Exception as e:
        log_audit_event(file.filename, "VERIFY", "FAILED")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        file.file.close()
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.get("/audit-logs")
async def read_audit_logs(
    current_user=Depends(get_current_user)
):
    logger.info(
        "Audit logs accessed",
        extra={
            "event": "audit_view",
            "username": current_user["username"],
            "role": current_user["role"]
        }
    )

    # RBAC check: Only Admin and Auditor can view audit logs
    if not has_permission(current_user, PERM_VIEW_AUDIT_LOGS):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Required role: Admin or Auditor"
        )

    try:
        logs = get_audit_logs()
        return {
            "count": len(logs),
            "audit_logs": logs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ USER MANAGEMENT MODELS ============

class UserCreateRequest(BaseModel):
    username: str
    password: str
    email: str = None
    role: str = "document_owner"

class RoleUpdateRequest(BaseModel):
    new_role: str


# ============ PUBLIC AUTHENTICATION ENDPOINTS ============

@app.post("/signup")
def signup(request: UserCreateRequest):
    """Public user registration endpoint"""
    # Check if username already exists
    existing = get_user_by_username(request.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken. Please choose a different username."
        )
    
    # Create user with document_owner role (default for self-registration)
    try:
        user = create_user(
            username=request.username,
            password=request.password,
            email=request.email,
            role="document_owner"  # Default role for new signups
        )
        
        logger.info(
            "User registered",
            extra={
                "event": "user_signup",
                "username": request.username
            }
        )
        
        return {
            "message": "Account created successfully",
            "username": user["username"],
            "role": user["role"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user_by_username(form_data.username)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    
    # Check if account is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated",
        )

    if not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    
    # Update last login timestamp
    update_last_login(user["username"])

    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]}
    )

    logger.info(
        "User logged in",
        extra={
            "event": "login",
            "username": user["username"],
            "role": user["role"]
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user["username"],
        "role": user["role"],
        "permissions": get_role_permissions(user["role"]),
        "role_description": get_role_description(user["role"])
    }


# ============ ADMIN ENDPOINTS ============

@app.get("/admin/users")
def list_users(current_user=Depends(get_current_user)):
    """List all users (Admin only)"""
    if not has_permission(current_user, PERM_CREATE_USERS):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    users = get_all_users()
    return {
        "count": len(users),
        "users": users
    }


@app.post("/admin/create-user")
def admin_create_user(
    request: UserCreateRequest,
    current_user=Depends(get_current_user)
):
    """Create new user (Admin only)"""
    if not has_permission(current_user, PERM_CREATE_USERS):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    existing = get_user_by_username(request.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )

    user = create_user(request.username, request.password, request.role, request.email)
    
    logger.info(
        "User created",
        extra={
            "event": "user_create",
            "created_by": current_user["username"],
            "new_user": request.username,
            "role": request.role
        }
    )
    
    return {
        "message": "User created successfully",
        "username": user["username"],
        "email": user["email"],
        "role": user["role"],
        "role_description": get_role_description(request.role)
    }


@app.put("/admin/users/{username}/role")
def update_role(
    username: str,
    request: RoleUpdateRequest,
    current_user=Depends(get_current_user)
):
    """Update user role (Admin only)"""
    if not has_permission(current_user, PERM_CREATE_USERS):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        user = update_user_role(username, request.new_role)
        logger.info(
            "User role updated",
            extra={
                "event": "role_update",
                "admin": current_user["username"],
                "target_user": username,
                "new_role": request.new_role
            }
        )
        return {
            "message": "Role updated successfully",
            "username": user["username"],
            "role": user["role"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/admin/users/{username}/deactivate")
def deactivate_user_account(
    username: str,
    current_user=Depends(get_current_user)
):
    """Deactivate user account (Admin only)"""
    if not has_permission(current_user, PERM_CREATE_USERS):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    if username == current_user["username"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate your own account"
        )
    
    try:
        user = deactivate_user(username)
        logger.info(
            "User deactivated",
            extra={
                "event": "user_deactivate",
                "admin": current_user["username"],
                "target_user": username
            }
        )
        return {
            "message": "User deactivated successfully",
            "username": user["username"]
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/roles")
def get_available_roles():
    """Get all available roles and their permissions"""
    return {
        "roles": [
            {
                "role": role.value,
                "description": get_role_description(role.value),
                "permissions": get_role_permissions(role.value)
            }
            for role in UserRole
        ]
    }


@app.get("/me")
def get_current_user_info(current_user=Depends(get_current_user)):
    """Get current user information and permissions"""
    unread_alerts = len([a for a in get_user_alerts(current_user["username"], unread_only=True)])
    
    # Get full user details
    full_user = get_user_by_username(current_user["username"])
    
    return {
        "username": current_user["username"],
        "email": full_user.get("email", f"{current_user['username']}@docvault.local"),
        "role": current_user["role"],
        "role_description": get_role_description(current_user["role"]),
        "permissions": get_role_permissions(current_user["role"]),
        "is_active": current_user.get("is_active", True),
        "created_at": current_user.get("created_at"),
        "last_login": current_user.get("last_login"),
        "unread_alerts": unread_alerts
    }


# ============ ALERT ENDPOINTS ============

@app.get("/alerts")
def get_alerts(
    unread_only: bool = False,
    current_user=Depends(get_current_user)
):
    """Get user's alerts"""
    alerts = get_user_alerts(current_user["username"], unread_only)
    return {
        "count": len(alerts),
        "alerts": alerts
    }


@app.post("/alerts/{alert_id}/read")
def mark_read(
    alert_id: str,
    current_user=Depends(get_current_user)
):
    """Mark an alert as read"""
    success = mark_alert_read(current_user["username"], alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert marked as read"}


@app.post("/alerts/read-all")
def mark_all_read(current_user=Depends(get_current_user)):
    """Mark all alerts as read"""
    count = mark_all_alerts_read(current_user["username"])
    return {
        "message": f"Marked {count} alerts as read",
        "count": count
    }


@app.delete("/alerts")
def clear_all_alerts(current_user=Depends(get_current_user)):
    """Clear all alerts"""
    count = clear_alerts(current_user["username"])
    return {
        "message": f"Cleared {count} alerts",
        "count": count
    }


# ============ ADMIN STATISTICS ============

@app.get("/admin/stats")
def get_admin_statistics(current_user=Depends(get_current_user)):
    """Get system statistics (Admin only)"""
    if not has_permission(current_user, PERM_CREATE_USERS):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    from cosmos_service import get_system_stats
    
    try:
        stats = get_system_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ PASSWORD MANAGEMENT ============

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

@app.post("/users/change-password")
def change_password(
    request: PasswordChangeRequest,
    current_user=Depends(get_current_user)
):
    """Change user password"""
    from user_service import change_user_password
    
    try:
        result = change_user_password(
            username=current_user["username"],
            current_password=request.current_password,
            new_password=request.new_password
        )
        
        logger.info(
            "Password changed",
            extra={
                "event": "password_change",
                "username": current_user["username"]
            }
        )
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ DOCUMENT SEARCH ============

@app.get("/documents/search")
def search_documents(
    query: str = "",
    current_user=Depends(get_current_user)
):
    """Search documents by filename"""
    from cosmos_service import search_documents_by_name
    
    try:
        documents = search_documents_by_name(query)
        return {"count": len(documents), "documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/documents")
def list_all_documents(
    current_user=Depends(get_current_user)
):
    """List all documents (with ownership filtering)"""
    from cosmos_service import get_all_documents
    
    # Admin and auditors can see all documents
    if has_permission(current_user, PERM_VIEW_ALL_DOCUMENTS):
        documents = get_all_documents()
    else:
        # Regular users see only their documents
        documents = get_all_documents(uploaded_by=current_user["username"])
    
    return {"count": len(documents), "documents": documents}
