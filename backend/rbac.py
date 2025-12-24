"""
Enhanced RBAC (Role-Based Access Control) System
Roles: Admin, Document Owner, Auditor, Guest
"""
from enum import Enum
from typing import List
from fastapi import HTTPException, status

class UserRole(str, Enum):
    ADMIN = "admin"
    DOCUMENT_OWNER = "document_owner"
    AUDITOR = "auditor"
    GUEST = "guest"

# Role hierarchy and permissions
ROLE_PERMISSIONS = {
    UserRole.ADMIN: {
        "can_create_users": True,
        "can_delete_users": True,
        "can_view_all_documents": True,
        "can_register_documents": True,
        "can_verify_documents": True,
        "can_view_audit_logs": True,
        "can_export_audit_logs": True,
        "can_manage_system": True,
        "can_view_all_signatures": True,
        "can_delete_documents": True
    },
    UserRole.DOCUMENT_OWNER: {
        "can_create_users": False,
        "can_delete_users": False,
        "can_view_all_documents": False,
        "can_register_documents": True,
        "can_verify_documents": True,
        "can_view_audit_logs": False,
        "can_export_audit_logs": False,
        "can_manage_system": False,
        "can_view_all_signatures": False,
        "can_delete_documents": False,  # Only their own
        "can_view_own_documents": True
    },
    UserRole.AUDITOR: {
        "can_create_users": False,
        "can_delete_users": False,
        "can_view_all_documents": True,
        "can_register_documents": False,
        "can_verify_documents": True,
        "can_view_audit_logs": True,
        "can_export_audit_logs": True,
        "can_manage_system": False,
        "can_view_all_signatures": True,
        "can_delete_documents": False
    },
    UserRole.GUEST: {
        "can_create_users": False,
        "can_delete_users": False,
        "can_view_all_documents": False,
        "can_register_documents": False,
        "can_verify_documents": True,  # Only verification allowed
        "can_view_audit_logs": False,
        "can_export_audit_logs": False,
        "can_manage_system": False,
        "can_view_all_signatures": False,
        "can_delete_documents": False,
        "can_view_own_documents": False
    }
}

def get_role_permissions(role: str) -> dict:
    """Get permissions for a specific role"""
    try:
        user_role = UserRole(role)
        return ROLE_PERMISSIONS.get(user_role, ROLE_PERMISSIONS[UserRole.GUEST])
    except ValueError:
        return ROLE_PERMISSIONS[UserRole.GUEST]

def has_permission(user: dict, permission: str) -> bool:
    """Check if user has a specific permission"""
    role = user.get("role", UserRole.GUEST)
    permissions = get_role_permissions(role)
    return permissions.get(permission, False)

def require_permission(permission: str):
    """Decorator to require a specific permission"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Get current_user from kwargs
            current_user = kwargs.get("current_user")
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if not has_permission(current_user, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied: {permission} required"
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

def require_role(allowed_roles: List[UserRole]):
    """Decorator to require one of the specified roles"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            current_user = kwargs.get("current_user")
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            user_role = current_user.get("role", UserRole.GUEST)
            if user_role not in [role.value for role in allowed_roles]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}"
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

def check_document_ownership(user: dict, document_owner: str) -> bool:
    """Check if user owns a document or is admin"""
    if user.get("role") == UserRole.ADMIN:
        return True
    return user.get("username") == document_owner

def get_role_description(role: str) -> str:
    """Get human-readable role description"""
    descriptions = {
        UserRole.ADMIN: "Full system access - Can manage users, documents, and view all audit logs",
        UserRole.DOCUMENT_OWNER: "Can upload and verify documents, manage own documents",
        UserRole.AUDITOR: "Read-only access to all documents and audit logs for compliance",
        UserRole.GUEST: "Can only verify documents, no upload or audit access"
    }
    try:
        return descriptions.get(UserRole(role), "Unknown role")
    except ValueError:
        return "Unknown role"

def validate_role(role: str) -> bool:
    """Validate if role string is valid"""
    try:
        UserRole(role)
        return True
    except ValueError:
        return False

# Permission constants for easy reference
PERM_CREATE_USERS = "can_create_users"
PERM_DELETE_USERS = "can_delete_users"
PERM_VIEW_ALL_DOCUMENTS = "can_view_all_documents"
PERM_REGISTER_DOCUMENTS = "can_register_documents"
PERM_VERIFY_DOCUMENTS = "can_verify_documents"
PERM_VIEW_AUDIT_LOGS = "can_view_audit_logs"
PERM_EXPORT_AUDIT_LOGS = "can_export_audit_logs"
PERM_MANAGE_SYSTEM = "can_manage_system"
PERM_VIEW_ALL_SIGNATURES = "can_view_all_signatures"
PERM_DELETE_DOCUMENTS = "can_delete_documents"
