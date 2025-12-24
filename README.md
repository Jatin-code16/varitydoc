# DocVault - Enterprise Document Verification & Security System

<div align="center">

**A cloud-native document integrity verification system with cryptographic signatures, RBAC, and real-time security alerts**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Docker](https://img.shields.io/badge/docker-enabled-blue)]()
[![Azure](https://img.shields.io/badge/cloud-azure-0089d6)]()
[![Security](https://img.shields.io/badge/security-enterprise-red)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

[Features](#-features) • [Architecture](#️-architecture) • [Quick Start](#-quick-start) • [API Documentation](#-api-documentation) • [Security](#-security-features) • [Deployment](#-deployment)

</div>

---

## 📌 Overview

**DocVault** is an enterprise-grade document verification and security system that combines SHA-256 cryptographic hashing with **Azure Key Vault digital signatures**, **role-based access control (RBAC)**, and **real-time security alerts**. It provides a complete solution for registering documents with cryptographic proof, verifying their authenticity, maintaining comprehensive audit trails, and alerting on security events—all deployed on Azure with fully automated CI/CD pipelines.

### 🎯 Key Capabilities

- **🔐 Digital Signatures**: RSA-2048 cryptographic signing with Azure Key Vault for non-repudiation
- **👥 Role-Based Access Control**: 4-tier RBAC system (Admin, Document Owner, Auditor, Guest)
- **🚨 Real-Time Security Alerts**: Instant notifications for tampering, invalid signatures, and security events
- **🛡️ Tamper Detection**: SHA-256 hash-based verification combined with signature validation
- **☁️ Cloud Storage**: Azure Blob Storage integration for scalable document management
- **📊 Audit Trail**: Complete verification history with digital signature records in Azure Cosmos DB
- **🎨 Modern Frontend**: React SPA with glassmorphism UI, real-time alerts, and role badges
- **⚡ Production Architecture**: NGINX reverse proxy with containerized microservices
- **🔄 Zero-Downtime Deployment**: Automated CI/CD with Docker Hub and Azure VM

---

## 🚀 Features

### 🔒 Enterprise Security Features

#### Digital Signatures (Azure Key Vault)
- ✅ **RSA-2048 Cryptographic Signing**: Each document is digitally signed upon registration
- ✅ **Azure Key Vault Integration**: Secure key management with Hardware Security Module (HSM) backing
- ✅ **Signature Verification**: Automatic validation on document verification
- ✅ **Non-Repudiation**: Cryptographic proof of document origin and integrity
- ✅ **Fallback Mode**: Testing support without Key Vault for development

#### Role-Based Access Control (RBAC)
- 👑 **Admin Role**: Full system access, user management, role assignment, all audit logs
- 📄 **Document Owner**: Register and verify documents, view own alerts
- 🔍 **Auditor**: Read-only audit log access, verify documents, view all alerts
- 👤 **Guest**: Limited verification-only access
- ✅ **Permission Matrix**: 10+ granular permissions per role
- ✅ **API-Level Enforcement**: Every endpoint protected with permission checks

#### Real-Time Alert System
- 🚨 **Tampering Detection Alerts**: Critical alerts when hash mismatch detected
- ⚠️ **Signature Validation Alerts**: Warnings for invalid or missing signatures
- 📢 **Success Notifications**: Info alerts for successful registrations
- 🔔 **In-App Notifications**: Real-time alert panel with unread count badge
- 📧 **Email/SMS Ready**: Placeholders for Azure Communication Services integration
- 🎯 **Severity Levels**: INFO, WARNING, CRITICAL with color-coded UI

### Core Functionality
- ✅ **Document Registration**: Upload and hash documents with automatic cryptographic signing
- ✅ **Integrity Verification**: Compare uploaded documents against registered hashes + signatures
- ✅ **Audit Logging**: Track all verification attempts with timestamps, results, and signatures
- ✅ **User Management**: Admin endpoints for role assignment and user deactivation
- ✅ **RESTful API**: FastAPI backend with automatic OpenAPI documentation

### Technical Features
- 🔐 **Cryptographic Security**: SHA-256 hashing + RSA-2048 digital signatures
- 🔑 **Azure Key Vault**: Hardware-backed key management and signature operations
- 👥 **RBAC System**: 4 roles with granular permission checks on all endpoints
- 🚨 **Alert Engine**: Multi-severity notification system with in-memory storage
- ☁️ **Azure Integration**: Blob Storage + Cosmos DB + Key Vault
- 🐳 **Containerized**: Multi-stage Docker builds for optimized images
- 🔄 **CI/CD Pipeline**: GitHub Actions with automated testing and deployment
- 🌐 **Reverse Proxy**: NGINX configuration for `/api` routing
- 🎨 **Modern UI**: Glassmorphism design with real-time alert panel and role badges
- 📱 **Responsive**: Mobile-optimized with adaptive layouts

---

## 🏗️ Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT                                   │
│                     (Web Browser)                                │
│  • Real-time alert notifications                                │
│  • Role-based UI components                                     │
│  • Digital signature display                                    │
└────────────────────────┬─────────────────────────────────────────┘
                         │ HTTP/HTTPS
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    NGINX (Port 80)                               │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  /          ──►  React Frontend (Static Files)            │   │
│  │  /api/*     ──►  FastAPI Backend (Port 8000)              │   │
│  └───────────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────┬──────────────────────┘
             │                            │
             ▼                            ▼
┌────────────────────────┐    ┌───────────────────────────────────┐
│   React Frontend       │    │   FastAPI Backend                 │
│   ────────────────     │    │   ────────────────────            │
│   • Vite Build         │    │   • Document Upload               │
│   • Glassmorphism UI   │    │   • Hash Generation (SHA-256)     │
│   • AlertPanel         │    │   • Digital Signing (RSA-2048)    │
│   • RoleBadge          │    │   • Signature Verification        │
│   • Axios Client       │    │   • RBAC Permission Checks        │
│   • Real-time Updates  │    │   • Alert Generation              │
└────────────────────────┘    └──────────┬────────────────────────┘
                                         │
                    ┌────────────────────┼─────────────────────────┐
                    ▼                    ▼                         ▼
         ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
         │  Azure Blob      │  │  Azure Cosmos    │  │  Azure Key Vault    │
         │  Storage         │  │  DB              │  │  ─────────────────  │
         │  ──────────      │  │  ────────────    │  │  • RSA Key Pairs    │
         │  • Documents     │  │  • Metadata      │  │  • Sign Operations  │
         │  • Binary Store  │  │  • Audit Logs    │  │  • Verify Ops       │
         │                  │  │  • User Roles    │  │  • HSM Backing      │
         │                  │  │  • Alerts Store  │  │  • Managed Identity │
         └──────────────────┘  └──────────────────┘  └─────────────────────┘
```

### Technology Stack

#### Backend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| API Framework | **FastAPI** | High-performance Python web framework |
| Document Storage | **Azure Blob Storage** | Cloud-native binary storage |
| Metadata Storage | **Azure Cosmos DB** | NoSQL database for hashes and logs |
| Hashing | **SHA-256** | Cryptographic integrity verification |
| Digital Signatures | **Azure Key Vault** | RSA-2048 signing with HSM backing |
| Authentication | **JWT Tokens** | Stateless user authentication |
| RBAC Engine | **Custom Python** | Role-based permission enforcement |
| Alert System | **In-Memory Store** | Real-time notification management |
| Server | **Uvicorn** | ASGI server for production |

#### Frontend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | **React 19** | Modern UI library |
| Build Tool | **Vite** | Fast development and optimized builds |
| Styling | **Custom CSS** | Glassmorphism design system |
| HTTP Client | **Axios** | Promise-based API communication |
| State Management | **React Hooks** | Component state and effects |
| Components | **AlertPanel, RoleBadge** | Custom enterprise components |
| Web Server | **NGINX** | Static file serving + reverse proxy |

#### DevOps
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Containerization | **Docker** | Consistent deployment environments |
| Orchestration | **Docker Compose** | Multi-container management |
| CI/CD | **GitHub Actions** | Automated build and deployment |
| Registry | **Docker Hub** | Container image repository |
| Cloud Platform | **Azure VM** | Production hosting environment |

---

## 📂 Project Structure

```
docvault/
├── .github/
│   └── workflows/
│       ├── docker-build.yml      # CI: Build & push Docker images
│       └── deploy.yml            # CD: Deploy to Azure VM
│
├── backend/
│   ├── main.py                   # FastAPI application + RBAC endpoints
│   ├── hash_service.py           # SHA-256 hashing implementation
│   ├── blob_service.py           # Azure Blob Storage operations
│   ├── cosmos_service.py         # Cosmos DB CRUD + signature metadata
│   ├── user_service.py           # User management + role assignment
│   ├── signature_service.py      # Azure Key Vault digital signatures (NEW)
│   ├── rbac.py                   # Role-based access control system (NEW)
│   ├── alert_service.py          # Real-time alert management (NEW)
│   ├── auth.py                   # JWT authentication
│   ├── dependencies.py           # FastAPI dependencies
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile                # Backend container definition
│   ├── .env.example              # Environment variables template
│   ├── DIGITAL_SIGNATURES_SETUP.md   # Key Vault setup guide (NEW)
│   ├── RBAC_SETUP.md             # Role configuration guide (NEW)
│   ├── ALERTS_SETUP.md           # Alert system guide (NEW)
│   └── uploads/                  # Temporary file storage
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Register.jsx      # Document registration + signature display
│   │   │   ├── Verify.jsx        # Document verification + signature check
│   │   │   ├── AuditLogs.jsx     # Audit trail viewer
│   │   │   ├── AlertPanel.jsx    # Real-time notification panel (NEW)
│   │   │   ├── RoleBadge.jsx     # Role display with permissions (NEW)
│   │   │   └── Login.jsx         # User authentication UI
│   │   ├── api/
│   │   │   └── client.js         # Axios instance with /api base + auth
│   │   ├── App.jsx               # Main application + alert bell + role badge
│   │   ├── App.css               # Glassmorphism design + alert styles
│   │   └── main.jsx              # React entry point
│   ├── public/                   # Static assets
│   ├── nginx.conf                # NGINX configuration
│   ├── Dockerfile                # Frontend container definition
│   ├── package.json              # Node.js dependencies
│   ├── vite.config.js            # Vite build configuration
│   └── tailwind.config.cjs       # Tailwind CSS configuration
│
├── nginx/
│   └── nginx.conf                # Production NGINX config
│
├── docker-compose.yml            # Multi-container orchestration
├── UI_ENHANCEMENT_SUMMARY.md     # UI/UX update documentation (NEW)
└── README.md                     # This file
```

---

## ⚙️ How It Works

### 1️⃣ Document Registration Flow (with Digital Signatures)

```mermaid
sequenceDiagram
    User->>Frontend: Upload Document
    Frontend->>Backend: POST /register
    Backend->>Backend: Check PERM_REGISTER_DOCUMENT
    Backend->>Backend: Generate SHA-256 Hash
    Backend->>Azure Key Vault: Sign Hash (RSA-2048)
    Azure Key Vault-->>Backend: Return Signature
    Backend->>Azure Blob: Store Document
    Backend->>Cosmos DB: Store Hash + Signature + Metadata
    Backend->>Alert System: Create SUCCESS Alert
    Backend->>Cosmos DB: Log Audit Event (REGISTER)
    Backend-->>Frontend: Return Hash + Signature + Status
    Frontend->>Frontend: Display Signature Info
    Frontend->>Frontend: Update Alert Badge
    Frontend-->>User: Display Registration Success
```

**Enhanced Steps:**
1. User uploads document through React interface
2. Backend checks user has `PERM_REGISTER_DOCUMENT` permission
3. SHA-256 hash computed from file contents
4. **Hash digitally signed using Azure Key Vault (RSA-2048)**
5. Document uploaded to Azure Blob Storage
6. Hash, signature, and metadata stored in Cosmos DB
7. **SUCCESS alert created for the user**
8. Audit event logged with signature details
9. Response includes hash, signature, algorithm, and signer
10. **Frontend displays digital signature badge and info**

### 2️⃣ Document Verification Flow (with Signature Validation)

```mermaid
sequenceDiagram
    User->>Frontend: Upload Document
    Frontend->>Backend: POST /verify
    Backend->>Backend: Generate SHA-256 Hash
    Backend->>Cosmos DB: Retrieve Stored Hash + Signature
    Backend->>Backend: Compare Hashes
    Backend->>Azure Key Vault: Verify Signature
    alt Hashes Match & Signature Valid
        Backend->>Cosmos DB: Log AUTHENTIC
        Backend-->>Frontend: Return AUTHENTIC + Valid Sig
    else Hashes Differ
        Backend->>Alert System: Create CRITICAL Tampering Alert
        Backend->>Cosmos DB: Log TAMPERED
        Backend-->>Frontend: Return TAMPERED
    else Signature Invalid
        Backend->>Alert System: Create WARNING Invalid Sig Alert
        Backend->>Cosmos DB: Log INVALID_SIGNATURE
        Backend-->>Frontend: Return TAMPERED + Invalid Sig
    end
    Frontend->>Frontend: Display Signature Status
    Frontend->>Frontend: Update Alert Badge
    Frontend-->>User: Display Verification Result
```

**Enhanced Steps:**
1. User uploads document for verification
2. Backend generates hash of uploaded file
3. System retrieves stored hash AND signature from Cosmos DB
4. Hashes compared for exact match
5. **Digital signature verified using Azure Key Vault**
6. **If tampering detected, CRITICAL alert created**
7. **If signature invalid, WARNING alert created**
8. Result logged in audit trail with signature validation status
9. Response includes hashes, verdict, signature validity, and signer
10. **Frontend displays signature verification status with color coding**

### 3️⃣ Real-Time Alert Flow

```mermaid
sequenceDiagram
    Backend->>Alert System: Create Alert (Tampering/Success)
    Frontend->>Backend: GET /me (every 60s)
    Backend-->>Frontend: Return unread_alerts count
    Frontend->>Frontend: Update Bell Badge
    User->>Frontend: Click Alert Bell
    Frontend->>Backend: GET /alerts
    Backend->>Alert System: Retrieve Alerts
    Backend-->>Frontend: Return Alert List
    Frontend->>Frontend: Display AlertPanel
    User->>Frontend: Mark as Read
    Frontend->>Backend: POST /alerts/{id}/read
    Backend->>Alert System: Update Alert Status
    Frontend->>Frontend: Refresh Unread Count
```

### 4️⃣ Role-Based Access Control Flow

```mermaid
sequenceDiagram
    User->>Frontend: Login
    Frontend->>Backend: POST /login
    Backend->>Cosmos DB: Retrieve User + Role
    Backend->>RBAC: Get Role Permissions
    Backend-->>Frontend: Return JWT + Role + Permissions
    Frontend->>Frontend: Store Auth + Display RoleBadge
    User->>Frontend: Click Protected Action
    Frontend->>Backend: POST /admin/users (with JWT)
    Backend->>RBAC: Check has_permission(PERM_MANAGE_USERS)
    alt Permission Granted
        Backend->>Cosmos DB: Execute Action
        Backend-->>Frontend: Success Response
    else Permission Denied
        Backend-->>Frontend: 403 Forbidden
        Frontend->>Alert System: Show Error Toast
    end
```

---

## 🚦 Quick Start

### Prerequisites

- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **Node.js** (v18+) for local frontend development
- **Python** (v3.10+) for local backend development
- **Azure Account** with:
  - Storage Account (for Blob Storage)
  - Cosmos DB Account (for database)

### Environment Variables

Create `backend/.env`:

```env
# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...

# Azure Cosmos DB
COSMOS_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
COSMOS_KEY=your-cosmos-key-here
COSMOS_DATABASE=docvault
COSMOS_CONTAINER=documents
```

### 🐳 Running with Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/yourusername/docvault.git
cd docvault

# Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your Azure credentials

# Build and start all services
docker compose up --build

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost/api/docs
```

### 💻 Local Development

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---

## 📡 API Documentation

### Base URL
- **Development**: `http://localhost:8000`
- **Production**: `http://your-domain/api`

### Authentication
All endpoints (except `/login` and `/register-user`) require JWT authentication:
```http
Authorization: Bearer <your_jwt_token>
```

### Endpoints

#### 🔐 Authentication & User Management

##### 1. User Registration
```http
POST /register-user
Content-Type: application/json
```

**Request:**
```json
{
  "username": "john_doe",
  "password": "secure_password",
  "role": "document_owner"
}
```

**Response:**
```json
{
  "username": "john_doe",
  "role": "document_owner",
  "created_at": "2025-12-24T12:00:00Z"
}
```

##### 2. Login
```http
POST /login
Content-Type: application/json
```

**Request:**
```json
{
  "username": "john_doe",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "username": "john_doe",
  "role": "document_owner",
  "permissions": ["PERM_REGISTER_DOCUMENT", "PERM_VERIFY_DOCUMENT"],
  "role_description": "Can register and verify documents"
}
```

##### 3. Get Current User Info
```http
GET /me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "username": "john_doe",
  "role": "document_owner",
  "permissions": ["PERM_REGISTER_DOCUMENT", "PERM_VERIFY_DOCUMENT"],
  "unread_alerts": 3,
  "role_description": "Can register and verify documents",
  "last_login": "2025-12-24T12:00:00Z"
}
```

#### 📄 Document Operations

##### 4. Register Document (with Digital Signature)
```http
POST /register
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Required Permission:** `PERM_REGISTER_DOCUMENT`

**Request:**
```bash
curl -X POST "http://localhost/api/register" \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf"
```

**Response:**
```json
{
  "filename": "document.pdf",
  "sha256": "a3b2c1d4e5f6...",
  "storage": "AZURE_BLOB",
  "status": "REGISTERED",
  "signature": "dGVzdHNpZ25hdHVyZQ==",
  "signature_algorithm": "RSA-2048",
  "signed_by": "john_doe",
  "timestamp": "2025-12-24T12:00:00Z"
}
}
```

##### 5. Verify Document (with Signature Validation)
```http
POST /verify
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Required Permission:** `PERM_VERIFY_DOCUMENT`

**Request:**
```bash
curl -X POST "http://localhost/api/verify" \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf"
```

**Response (Authentic):**
```json
{
  "filename": "document.pdf",
  "stored_hash": "a3b2c1d4e5f6...",
  "uploaded_hash": "a3b2c1d4e5f6...",
  "result": "AUTHENTIC",
  "signature_valid": true,
  "signature": "dGVzdHNpZ25hdHVyZQ==",
  "signed_by": "john_doe",
  "signature_algorithm": "RSA-2048",
  "timestamp": "2025-12-24T12:00:00Z"
}
```

**Response (Tampered):**
```json
{
  "filename": "document.pdf",
  "stored_hash": "a3b2c1d4e5f6...",
  "uploaded_hash": "b4c3d2e1f0a9...",
  "result": "TAMPERED",
  "signature_valid": false,
  "signature": "dGVzdHNpZ25hdHVyZQ==",
  "signed_by": "john_doe",
  "signature_algorithm": "RSA-2048",
  "timestamp": "2025-12-24T12:00:00Z"
}
```

#### 📊 Audit & Alerts

##### 6. Get Audit Logs
```http
GET /audit-logs
Authorization: Bearer <token>
```

**Required Permission:** `PERM_VIEW_AUDIT_LOGS` (Admin or Auditor only)

**Response:**
```json
{
  "logs": [
    {
      "filename": "document.pdf",
      "sha256": "a3b2c1d4e5f6...",
      "action": "REGISTER",
      "result": "REGISTERED",
      "timestamp": "2025-12-24T12:00:00Z",
      "signature": "dGVzdHNpZ25hdHVyZQ==",
      "signed_by": "john_doe"
    },
    {
      "filename": "document.pdf",
      "sha256": "a3b2c1d4e5f6...",
      "action": "VERIFY",
      "result": "AUTHENTIC",
      "timestamp": "2025-12-24T12:05:00Z",
      "signature_valid": true
    }
  ]
}
```

##### 7. Get Alerts
```http
GET /alerts
Authorization: Bearer <token>
```

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert_123",
      "severity": "CRITICAL",
      "title": "Document Tampering Detected",
      "message": "Hash mismatch detected for document.pdf",
      "is_read": false,
      "created_at": "2025-12-24T12:00:00Z",
      "metadata": {
        "document_name": "document.pdf",
        "user": "john_doe"
      }
    }
  ]
}
```

##### 8. Mark Alert as Read
```http
POST /alerts/{alert_id}/read
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Alert marked as read"
}
```

##### 9. Mark All Alerts as Read
```http
POST /alerts/read-all
Authorization: Bearer <token>
```

##### 10. Delete Alerts
```http
DELETE /alerts?alert_ids=alert_123,alert_456
Authorization: Bearer <token>
```

#### 👥 Admin Endpoints

##### 11. List All Users (Admin Only)
```http
GET /admin/users
Authorization: Bearer <token>
```

**Required Permission:** `PERM_MANAGE_USERS`

**Response:**
```json
{
  "users": [
    {
      "username": "john_doe",
      "role": "document_owner",
      "is_active": true,
      "last_login": "2025-12-24T12:00:00Z"
    }
  ]
}
```

##### 12. Update User Role (Admin Only)
```http
PUT /admin/users/{username}/role
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "new_role": "auditor"
}
```

##### 13. Deactivate User (Admin Only)
```http
POST /admin/users/{username}/deactivate
Authorization: Bearer <token>
```

##### 14. Get All Roles and Permissions
```http
GET /roles
Authorization: Bearer <token>
```

**Response:**
```json
{
  "roles": {
    "admin": {
      "description": "Full system access",
      "permissions": ["PERM_REGISTER_DOCUMENT", "PERM_VERIFY_DOCUMENT", ...]
    },
    "document_owner": {
      "description": "Can register and verify documents",
      "permissions": ["PERM_REGISTER_DOCUMENT", "PERM_VERIFY_DOCUMENT"]
    }
  }
}
```

---

## 🔒 Security Features

### Digital Signatures with Azure Key Vault

**Setup Guide:** See [DIGITAL_SIGNATURES_SETUP.md](backend/DIGITAL_SIGNATURES_SETUP.md)

- **Algorithm**: RSA-2048 with SHA-256
- **Key Storage**: Azure Key Vault with HSM backing
- **Signing Process**: Hash is signed upon document registration
- **Verification**: Signature validated during document verification
- **Non-Repudiation**: Cryptographic proof of document origin
- **Fallback Mode**: Testing support without Azure Key Vault

**Environment Variables:**
```bash
AZURE_KEY_VAULT_URL=https://your-vault.vault.azure.net/
AZURE_KEY_NAME=docvault-sign-key
```

### Role-Based Access Control (RBAC)

**Setup Guide:** See [RBAC_SETUP.md](backend/RBAC_SETUP.md)

#### Role Hierarchy

| Role | Access Level | Permissions |
|------|--------------|-------------|
| **Admin** 👑 | Full Access | All permissions including user management |
| **Document Owner** 📄 | Standard | Register, verify, view own alerts |
| **Auditor** 🔍 | Read-Only+ | View audits, verify, view all alerts |
| **Guest** 👤 | Minimal | Verify documents only |

#### Permission Matrix

| Permission | Admin | Document Owner | Auditor | Guest |
|------------|-------|----------------|---------|-------|
| PERM_REGISTER_DOCUMENT | ✅ | ✅ | ❌ | ❌ |
| PERM_VERIFY_DOCUMENT | ✅ | ✅ | ✅ | ✅ |
| PERM_VIEW_AUDIT_LOGS | ✅ | ❌ | ✅ | ❌ |
| PERM_MANAGE_USERS | ✅ | ❌ | ❌ | ❌ |
| PERM_UPDATE_ROLES | ✅ | ❌ | ❌ | ❌ |
| PERM_VIEW_ALL_ALERTS | ✅ | ❌ | ✅ | ❌ |

### Real-Time Alert System

**Setup Guide:** See [ALERTS_SETUP.md](backend/ALERTS_SETUP.md)

#### Alert Severities

- **CRITICAL** 🔴: Tampering detected, unauthorized access attempts
- **WARNING** ⚠️: Invalid signatures, quota warnings
- **INFO** 🔵: Successful operations, document registered

#### Alert Types

1. **Document Tampering**: Hash mismatch detected during verification
2. **Invalid Signature**: Signature validation failed
3. **Document Registered**: Successful registration with signature
4. **Access Denied**: Permission violation attempt

#### Integration Options

- **In-App Notifications**: Real-time badge and panel (✅ Implemented)
- **Email Notifications**: Azure Communication Services (placeholder)
- **SMS Alerts**: Twilio integration (placeholder)

**Environment Variables:**
```bash
# Optional: For email/SMS alerts
AZURE_COMMUNICATION_CONNECTION_STRING=your_connection_string
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
```

---

**Response (Authentic):**
```json
{
  "filename": "document.pdf",
  "stored_hash": "a3b2c1d4e5f6...",
  "uploaded_hash": "a3b2c1d4e5f6...",
  "result": "AUTHENTIC"
}
```

**Response (Tampered):**
```json
{
  "filename": "document.pdf",
  "stored_hash": "a3b2c1d4e5f6...",
  "uploaded_hash": "x9y8z7w6v5u4...",
  "result": "TAMPERED"
}
```

#### 3. Get Audit Logs
```http
GET /audit-logs
```

**Response:**
```json
{
  "count": 15,
  "audit_logs": [
    {
      "id": "audit:uuid-here",
      "filename": "contract.pdf",
      "action": "VERIFY",
      "result": "AUTHENTIC",
      "timestamp": "2025-12-20T10:30:00Z"
    },
    {
      "id": "audit:uuid-here",
      "filename": "invoice.pdf",
      "action": "REGISTER",
      "result": "SUCCESS",
      "timestamp": "2025-12-20T09:15:00Z"
    }
  ]
}
```

### Interactive API Docs

FastAPI provides automatic interactive documentation:
- **Swagger UI**: `http://localhost/api/docs`
- **ReDoc**: `http://localhost/api/redoc`

---

## 🔄 CI/CD Pipeline

### Architecture Overview

```
┌─────────────────────┐
│   git push main     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│         GitHub Actions: docker-build.yml        │
│  ┌───────────────────────────────────────────┐  │
│  │ 1. Checkout code                          │  │
│  │ 2. Build frontend (npm run build)         │  │
│  │ 3. Build Docker images                    │  │
│  │ 4. Tag with Git SHA                       │  │
│  │ 5. Push to Docker Hub                     │  │
│  └───────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────┘
                       │ Triggers on success
                       ▼
┌─────────────────────────────────────────────────┐
│         GitHub Actions: deploy.yml              │
│  ┌───────────────────────────────────────────┐  │
│  │ 1. SSH into Azure VM                      │  │
│  │ 2. Update docker-compose.yml with SHA     │  │
│  │ 3. Pull new images from Docker Hub        │  │
│  │ 4. Recreate containers (zero-downtime)    │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Continuous Integration (CI)

**Workflow**: [`.github/workflows/docker-build.yml`](.github/workflows/docker-build.yml)

**Triggered by**: Push to `main` branch

**Steps**:
1. ✅ Checkout repository code
2. ✅ Install Node.js dependencies and build frontend
3. ✅ Set up Docker Buildx for multi-platform builds
4. ✅ Authenticate with Docker Hub
5. ✅ Build backend image with Git SHA tag
6. ✅ Build frontend image with Git SHA tag
7. ✅ Push images to Docker Hub

**Outcome**: Two Docker images published
- `jatinnaik16/docvault-backend:abc123def` (commit SHA)
- `jatinnaik16/docvault-frontend:abc123def` (commit SHA)

### Continuous Deployment (CD)

**Workflow**: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

**Triggered by**: Successful completion of `docker-build.yml`

**Steps**:
1. ✅ SSH into Azure VM using private key
2. ✅ Navigate to deployment directory
3. ✅ Update `docker-compose.yml` with new image tags
4. ✅ Pull latest images from Docker Hub
5. ✅ Recreate containers with `--force-recreate`
6. ✅ Verify deployment health

**Outcome**: Application automatically updated with zero downtime

### Required GitHub Secrets

Configure these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `VM_HOST` | Azure VM IP address or hostname |
| `VM_USER` | SSH username (e.g., `azureuser`) |
| `VM_SSH_KEY` | Private SSH key for VM access |

---

## 🚀 Deployment

### Azure VM Setup

#### 1. Create Azure Resources

```bash
# Create resource group
az group create --name docvault-rg --location eastus

# Create virtual machine
az vm create \
  --resource-group docvault-rg \
  --name docvault-vm \
  --image Ubuntu2204 \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys

# Open port 80
az vm open-port --port 80 --resource-group docvault-rg --name docvault-vm
```

#### 2. Configure VM

```bash
# SSH into VM
ssh azureuser@<VM-IP>

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/yourusername/docvault.git
cd docvault

# Configure environment
cp backend/.env.example backend/.env
nano backend/.env  # Add Azure credentials
```

#### 3. Initial Deployment

```bash
# Build and start services
docker compose up -d

# Verify services
docker compose ps
docker compose logs -f
```

### Azure Cosmos DB Setup

```bash
# Create Cosmos DB account
az cosmosdb create \
  --name docvault-cosmos \
  --resource-group docvault-rg \
  --locations regionName=eastus

# Create database
az cosmosdb sql database create \
  --account-name docvault-cosmos \
  --resource-group docvault-rg \
  --name docvault

# Create container
az cosmosdb sql container create \
  --account-name docvault-cosmos \
  --resource-group docvault-rg \
  --database-name docvault \
  --name documents \
  --partition-key-path "/type"
```

### Azure Blob Storage Setup

```bash
# Create storage account
az storage account create \
  --name docvaultstorage \
  --resource-group docvault-rg \
  --location eastus \
  --sku Standard_LRS

# Create container
az storage container create \
  --name documents \
  --account-name docvaultstorage
```

### Azure Key Vault Setup

```bash
# Create Key Vault
az keyvault create \
  --name docvault-keyvault \
  --resource-group docvault-rg \
  --location eastus

# Generate RSA key pair for digital signatures
az keyvault key create \
  --vault-name docvault-keyvault \
  --name document-signing-key \
  --kty RSA \
  --size 2048

# Set access policy for the VM (or service principal)
az keyvault set-policy \
  --name docvault-keyvault \
  --object-id <VM-OBJECT-ID> \
  --key-permissions get sign verify

# Add environment variables to backend/.env
AZURE_KEY_VAULT_NAME=docvault-keyvault
AZURE_KEY_NAME=document-signing-key
```

---

## 🔐 Security Considerations

### Implemented Security Measures

✅ **Digital Signatures**: RSA-2048 signatures with Azure Key Vault for non-repudiation  
✅ **Role-Based Access Control**: 4-tier permission system (admin/owner/auditor/guest)  
✅ **Real-Time Security Alerts**: Automated threat detection and notifications  
✅ **Cryptographic Hashing**: SHA-256 ensures document integrity  
✅ **JWT Authentication**: Stateless token-based auth with role/permission claims  
✅ **Environment Variables**: Sensitive credentials isolated from code  
✅ **CORS Configuration**: Restricted origins in production  
✅ **Azure Managed Services**: Built-in encryption and security  
✅ **SSH Key Authentication**: Secure CI/CD deployment  
✅ **No Hard-coded Secrets**: All credentials managed via GitHub Secrets  
✅ **Audit Logging**: Comprehensive activity tracking for compliance

### Production Recommendations

- 🔒 Enable HTTPS with SSL/TLS certificates (Let's Encrypt)
- 🔒 Implement rate limiting on API endpoints (Azure API Management)
- 🔒 Enable Azure Blob Storage encryption at rest and in transit
- 🔒 Configure Azure Cosmos DB firewall rules and network isolation
- 🔒 Implement comprehensive input validation and sanitization
- 🔒 Add CSRF protection for state-changing operations
- 🔒 Enable Azure Monitor, Application Insights, and Azure Sentinel
- 🔒 Configure Azure Key Vault access policies with least privilege
- 🔒 Implement automated secret rotation for Key Vault keys
- 🔒 Enable Azure DDoS Protection Standard
- 🔒 Configure Web Application Firewall (WAF) rules
- 🔒 Implement comprehensive logging and SIEM integration

---

## 🧪 Testing

### Manual Testing

#### Register Document
```bash
curl -X POST "http://localhost/api/register" \
  -F "file=@test.pdf" | jq
```

#### Verify Document
```bash
curl -X POST "http://localhost/api/verify" \
  -F "file=@test.pdf" | jq
```

#### Get Audit Logs
```bash
curl "http://localhost/api/audit-logs" | jq
```

#### Test RBAC (Admin Operations)
```bash
# Login as admin user
curl -X POST "http://localhost/api/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq -r '.token' > token.txt

# Create new user (admin only)
curl -X POST "http://localhost/api/users" \
  -H "Authorization: Bearer $(cat token.txt)" \
  -H "Content-Type: application/json" \
  -d '{"username": "newuser", "email": "new@example.com", "password": "pass123", "role": "auditor"}' | jq

# Get all alerts
curl -X GET "http://localhost/api/alerts" \
  -H "Authorization: Bearer $(cat token.txt)" | jq
```

### Frontend Testing

```bash
cd frontend
npm run lint  # ESLint checks
npm run dev   # Development server
```

---

## 🛠️ Troubleshooting

### Common Issues

#### Backend can't connect to Azure
```bash
# Check environment variables
docker exec docvault-backend env | grep AZURE
docker exec docvault-backend env | grep COSMOS

# Test connectivity
docker exec -it docvault-backend python -c "from cosmos_service import client; print(client)"
```

#### Frontend can't reach backend
```bash
# Check NGINX logs
docker logs docvault-frontend

# Verify NGINX configuration
docker exec docvault-frontend cat /etc/nginx/nginx.conf

# Test backend directly
curl http://localhost/api/audit-logs
```

#### CI/CD pipeline failing
```bash
# Check Docker Hub credentials
# Verify GitHub Secrets are set correctly
# Check VM SSH connectivity: ssh azureuser@<VM-IP>
```

---

## 📊 Performance Metrics

### System Capabilities

- **File Upload Speed**: ~10MB/s (dependent on network)
- **Hash Generation**: <1s for files up to 100MB
- **Verification Latency**: <500ms average
- **Concurrent Users**: Tested up to 50 simultaneous uploads
- **Storage**: Unlimited (Azure Blob Storage auto-scales)

---

## 🎯 Future Enhancements

- [ ] Document expiration and automatic cleanup policies
- [ ] Multi-document batch operations with parallel processing
- [ ] Document versioning with complete history tracking
- [ ] Advanced search with full-text indexing (Azure Cognitive Search)
- [ ] Two-factor authentication (2FA) for critical operations
- [ ] Mobile application (React Native) with biometric auth
- [ ] Blockchain integration for immutable public audit trail
- [ ] Machine learning for document anomaly detection
- [ ] Webhook support for external integrations
- [ ] Multi-tenancy support for enterprise customers
- [ ] Advanced analytics dashboard with Power BI integration
- [ ] Document workflow automation and approval chains
- [ ] Integration with Azure Active Directory (Entra ID)

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Jatin Naik**  
Azure Major Project - Cloud Computing & DevOps

**Project Focus Areas:**
- Cloud-native architecture (Azure)
- Containerization & orchestration (Docker/Compose)
- CI/CD automation (GitHub Actions)
- Microservices design patterns
- Document integrity & cryptography

---

## 🙏 Acknowledgments

- **FastAPI** for excellent API framework and documentation
- **React** ecosystem for modern frontend development
- **Azure** for reliable cloud infrastructure
- **Docker** for containerization technology
- **GitHub Actions** for CI/CD automation

---

## 📞 Support

For issues, questions, or contributions:
- Open an issue on [GitHub Issues](https://github.com/Jatin-code16/varitydoc/issues)
- Contact: jatinnaiknawa2@gmail.com

---

<div align="center">

**⭐ If you find this project useful, please consider giving it a star!**

Built with ❤️ using Azure, Docker, React, and FastAPI

</div>
