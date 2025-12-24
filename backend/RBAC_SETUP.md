# Enhanced RBAC (Role-Based Access Control) Setup Guide

## Overview
DocVault now implements enterprise-grade RBAC with four distinct roles, each with specific permissions.

## Roles and Permissions

### 1. **Admin** 👑
**Full system access**
- ✅ Create and manage users
- ✅ Delete users  
- ✅ View all documents
- ✅ Register documents
- ✅ Verify documents
- ✅ View audit logs
- ✅ Export audit logs
- ✅ Manage system settings
- ✅ View all signatures
- ✅ Delete documents

**Use case:** System administrators, IT security team

### 2. **Document Owner** 📄
**Standard document management**
- ❌ Cannot create users
- ❌ Cannot view other users' documents
- ✅ Register own documents
- ✅ Verify any documents
- ❌ Cannot view audit logs
- ✅ View own documents
- ❌ Cannot delete others' documents

**Use case:** Regular employees, document creators

### 3. **Auditor** 🔍
**Read-only compliance access**
- ❌ Cannot create users
- ✅ View all documents (read-only)
- ❌ Cannot register documents
- ✅ Verify documents
- ✅ View full audit logs
- ✅ Export audit logs
- ✅ View all signatures
- ❌ Cannot delete documents

**Use case:** Compliance officers, external auditors, quality assurance

### 4. **Guest** 👤
**Minimal verification-only access**
- ❌ Cannot create users
- ❌ Cannot view documents list
- ❌ Cannot register documents
- ✅ Verify documents only
- ❌ Cannot view audit logs
- ❌ Cannot view signatures

**Use case:** External parties, temporary users, third-party verification

## API Endpoints

### Authentication
```http
POST /login
Body: {
  "username": "string",
  "password": "string"
}
Response: {
  "access_token": "string",
  "token_type": "bearer",
  "username": "string",
  "role": "admin|document_owner|auditor|guest",
  "permissions": { ... },
  "role_description": "string"
}
```

### User Management (Admin Only)

#### List All Users
```http
GET /admin/users
Authorization: Bearer <admin_token>
Response: {
  "count": 10,
  "users": [...]
}
```

#### Create User
```http
POST /admin/create-user
Authorization: Bearer <admin_token>
Body: {
  "username": "john.doe",
  "password": "SecurePass123!",
  "role": "document_owner"
}
```

#### Update User Role
```http
PUT /admin/users/{username}/role
Authorization: Bearer <admin_token>
Body: {
  "new_role": "auditor"
}
```

#### Deactivate User
```http
POST /admin/users/{username}/deactivate
Authorization: Bearer <admin_token>
```

### Role Information

#### Get Available Roles
```http
GET /roles
Response: {
  "roles": [
    {
      "role": "admin",
      "description": "Full system access...",
      "permissions": { ... }
    },
    ...
  ]
}
```

#### Get Current User Info
```http
GET /me
Authorization: Bearer <token>
Response: {
  "username": "john.doe",
  "role": "document_owner",
  "role_description": "...",
  "permissions": { ... },
  "is_active": true,
  "created_at": "2025-12-24T...",
  "last_login": "2025-12-24T..."
}
```

## Setup Instructions

### 1. Create Admin User (First Time Setup)
```python
# Run this script once to create the first admin
from user_service import create_user

admin = create_user(
    username="admin",
    password="AdminPass123!",  # Change this!
    role="admin"
)
print(f"Admin user created: {admin['username']}")
```

Or use the CLI:
```bash
# In Python REPL or script
python -c "from user_service import create_user; create_user('admin', 'YourSecurePassword', 'admin')"
```

### 2. Login as Admin
```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=AdminPass123!"
```

### 3. Create Other Users
```bash
# Document Owner
curl -X POST http://localhost:8000/admin/create-user \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john.doe",
    "password": "SecurePass123!",
    "role": "document_owner"
  }'

# Auditor
curl -X POST http://localhost:8000/admin/create-user \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "auditor.jane",
    "password": "AuditorPass123!",
    "role": "auditor"
  }'

# Guest
curl -X POST http://localhost:8000/admin/create-user \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "guest.user",
    "password": "GuestPass123!",
    "role": "guest"
  }'
```

## Permission Matrix

| Action | Admin | Document Owner | Auditor | Guest |
|--------|-------|----------------|---------|-------|
| Register Documents | ✅ | ✅ | ❌ | ❌ |
| Verify Documents | ✅ | ✅ | ✅ | ✅ |
| View Audit Logs | ✅ | ❌ | ✅ | ❌ |
| Create Users | ✅ | ❌ | ❌ | ❌ |
| View All Documents | ✅ | ❌ | ✅ | ❌ |
| Delete Documents | ✅ | ⚠️ Own | ❌ | ❌ |
| Manage System | ✅ | ❌ | ❌ | ❌ |
| Export Audit Logs | ✅ | ❌ | ✅ | ❌ |

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden (Permission Denied)
```json
{
  "detail": "You do not have permission to register documents. Required role: Document Owner or Admin"
}
```

### 403 Forbidden (Account Deactivated)
```json
{
  "detail": "Account has been deactivated"
}
```

## Security Best Practices

### 1. Default Role
- New users default to `document_owner` (not `admin`)
- Prevents privilege escalation

### 2. Account Deactivation
- Admins cannot deactivate their own accounts
- Deactivated users cannot login
- All data preserved for audit trail

### 3. Last Login Tracking
- Every login updates `last_login` timestamp
- Useful for identifying inactive accounts
- Compliance requirement

### 4. Role Validation
- All roles validated against enum
- Invalid roles rejected at creation
- Cannot assign non-existent roles

## Frontend Integration

### Check Permissions in UI
```javascript
// After login
const response = await fetch('/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const userData = await response.json();

// Hide/show features based on permissions
if (userData.permissions.can_register_documents) {
  showUploadButton();
}

if (userData.permissions.can_view_audit_logs) {
  showAuditTab();
}

// Show role badge
displayRole(userData.role, userData.role_description);
```

### Role-Based UI Components
```javascript
// Admin-only components
{userData.role === 'admin' && (
  <AdminPanel />
)}

// Document Owner + Admin
{userData.permissions.can_register_documents && (
  <UploadButton />
)}

// Auditor + Admin
{userData.permissions.can_view_audit_logs && (
  <AuditLogsTab />
)}

// Everyone (including Guest)
<VerifyDocumentSection />
```

## Migration from Old System

### Update Existing Users
If you have existing users with role="user", update them:

```python
from user_service import update_user_role

# Update all "user" roles to "document_owner"
users = get_all_users()
for user in users:
    if user['role'] == 'user':
        update_user_role(user['username'], 'document_owner')
        print(f"Updated {user['username']} to document_owner")
```

## Testing RBAC

### Test Admin Access
```bash
# Login as admin
TOKEN=$(curl -s -X POST http://localhost:8000/login \
  -d "username=admin&password=AdminPass123!" | jq -r '.access_token')

# Should succeed
curl -X GET http://localhost:8000/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

### Test Document Owner
```bash
# Login as document owner
TOKEN=$(curl -s -X POST http://localhost:8000/login \
  -d "username=john.doe&password=SecurePass123!" | jq -r '.access_token')

# Should succeed - register document
curl -X POST http://localhost:8000/register \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"

# Should fail - view audit logs
curl -X GET http://localhost:8000/audit-logs \
  -H "Authorization: Bearer $TOKEN"
# Returns: 403 Forbidden
```

### Test Guest
```bash
# Login as guest
TOKEN=$(curl -s -X POST http://localhost:8000/login \
  -d "username=guest.user&password=GuestPass123!" | jq -r '.access_token')

# Should fail - register document
curl -X POST http://localhost:8000/register \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"
# Returns: 403 Forbidden

# Should succeed - verify document
curl -X POST http://localhost:8000/verify \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"
```

## Troubleshooting

### Issue: Cannot create admin user
**Solution:** Make sure Cosmos DB users container exists:
```python
from cosmos_service import database
database.create_container_if_not_exists(
    id="users",
    partition_key={"paths": ["/username"]}
)
```

### Issue: Role validation error
**Solution:** Use exact role names:
- `admin` ✅
- `document_owner` ✅
- `auditor` ✅
- `guest` ✅
- `user` ❌ (deprecated)

### Issue: Permission denied after role update
**Solution:** Users must re-login to get updated permissions in their token.
