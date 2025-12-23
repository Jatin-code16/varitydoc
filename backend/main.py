from fastapi import FastAPI, UploadFile, File, HTTPException
import os
import shutil
from dotenv import load_dotenv
from blob_service import upload_file_to_blob
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from user_service import get_user_by_username, create_user
from auth import verify_password, create_access_token
from dependencies import get_current_user


load_dotenv()

from hash_service import generate_sha256
from cosmos_service import store_document, get_stored_hash, log_audit_event, get_audit_logs


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


@app.post("/register")
async def register_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    try:
        # Save temporarily to local disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Generate hash locally
        file_hash = generate_sha256(file_path)

        # Upload to Azure Blob Storage
        upload_file_to_blob(
            local_file_path=file_path,
            blob_name=file.filename
        )

        # Store metadata locally (temporary)
        store_document(file.filename, file_hash)
        log_audit_event(file.filename, "REGISTER", "SUCCESS")

        return {
            "filename": file.filename,
            "sha256": file_hash,
            "storage": "AZURE_BLOB",
            "status": "REGISTERED"
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

        # Get stored hash from metadata store
        stored_hash = get_stored_hash(file.filename)

        if not stored_hash:
            log_audit_event(file.filename, "VERIFY", "NOT_FOUND")
            raise HTTPException(status_code=404, detail="Document not registered")

        if uploaded_hash == stored_hash:
            result = "AUTHENTIC"
        else:
            result = "TAMPERED"

        log_audit_event(file.filename, "VERIFY", result)

        return {
            "filename": file.filename,
            "stored_hash": stored_hash,
            "uploaded_hash": uploaded_hash,
            "result": result
        }

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
    # 🔐 RBAC check
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    try:
        logs = get_audit_logs()
        return {
            "count": len(logs),
            "audit_logs": logs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user_by_username(form_data.username)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
    }


@app.post("/admin/create-user")
def admin_create_user(
    username: str,
    password: str,
    role: str = "user",
    current_user=Depends(get_current_user)
):
    # 🔐 Only admin can create users
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    existing = get_user_by_username(username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )

    user = create_user(username, password, role)
    return {
        "message": "User created successfully",
        "username": user["username"],
        "role": user["role"]
    }
