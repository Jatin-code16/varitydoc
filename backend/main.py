from fastapi import FastAPI, UploadFile, File, HTTPException
import os
import shutil
from dotenv import load_dotenv
from blob_service import upload_file_to_blob
from fastapi.middleware.cors import CORSMiddleware


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
async def read_audit_logs():
    try:
        logs = get_audit_logs()
        return {
            "count": len(logs),
            "audit_logs": logs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
