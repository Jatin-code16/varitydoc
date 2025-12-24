# Digital Signatures Setup with Azure Key Vault

## Overview
Digital signatures prove **WHO** uploaded a document, not just that it hasn't changed. This uses Azure Key Vault for cryptographic signing.

## Prerequisites
1. Azure subscription
2. Access to Azure Portal (https://portal.azure.com)

## Setup Instructions

### 1. Create Azure Key Vault Using Azure Portal

#### Step 1.1: Navigate to Key Vault
1. Go to [Azure Portal](https://portal.azure.com)
2. In the search bar at the top, type **"Key vaults"**
3. Click on **"Key vaults"** from the results
4. Click **"+ Create"** button

#### Step 1.2: Configure Key Vault Basics
1. **Subscription:** Select your Azure subscription
2. **Resource Group:** 
   - Click "Create new" if you don't have one
   - Name it: `docvault-rg`
   - Click OK
3. **Key vault name:** `docvault-keyvault` (must be globally unique)
4. **Region:** Select your preferred region (e.g., West US 2)
5. **Pricing tier:** Standard (or Premium for HSM-backed keys)
6. Click **"Next: Access policy"**

#### Step 1.3: Configure Access Policy
1. Under **"Permission model"**, select **"Vault access policy"**
2. Click **"+ Add Access Policy"**
3. Configure permissions:
   - **Key permissions:** Select **Get, List, Create, Sign, Verify**
   - Click **"Select principal"**
   - Search for your user email or name
   - Select your user
   - Click **"Select"**
4. Click **"Add"** to add the access policy
5. Click **"Review + create"**
6. Click **"Create"**

Wait for deployment to complete (usually 1-2 minutes).

### 2. Get Key Vault URL

1. Once deployment is complete, click **"Go to resource"**
2. On the Key Vault overview page, find **"Vault URI"**
3. Copy the URL (e.g., `https://docvault-keyvault.vault.azure.net/`)

### 3. Update Environment Variables
Add to your `.env` file:
```env
AZURE_KEY_VAULT_URL=https://docvault-keyvault.vault.azure.net/
```
Replace with your actual Key Vault URL from step 2.

### 4. Authentication for Local Development

#### Option A: Using Azure CLI (Recommended for Local Dev)
1. Install Azure CLI from: https://aka.ms/installazurecli
2. Open terminal and login:
```bash
az login
```
3. Your browser will open - sign in with your Azure account
4. That's it! The app will use your Azure CLI credentials

#### Option B: Using Service Principal (For CI/CD)
1. Go to Azure Portal → **"Microsoft Entra ID"** (formerly Azure AD)
2. Click **"App registrations"** → **"+ New registration"**
3. Name: `docvault-sp`
4. Click **"Register"**
5. Copy the **Application (client) ID** and **Directory (tenant) ID**
6. Click **"Certificates & secrets"** → **"+ New client secret"**
7. Add description: `DocVault Key Vault Access`
8. Click **"Add"** and copy the secret value immediately

Then add to `.env`:
```env
AZURE_CLIENT_ID=<your-client-id>
AZURE_TENANT_ID=<your-tenant-id>
AZURE_CLIENT_SECRET=<your-client-secret>
AZURE_KEY_VAULT_URL=https://docvault-keyvault.vault.azure.net/
```

And grant the service principal access to Key Vault:
1. Go back to your Key Vault
2. Click **"Access policies"**
3. Click **"+ Add Access Policy"**
4. **Key permissions:** Get, List, Create, Sign, Verify
5. **Select principal:** Search for `docvault-sp`
6. Click **"Add"**, then **"Save"**

### 5. Test the Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Start the backend
uvicorn main:app --reload

# Upload a document - it will now be digitally signed!
```

## How It Works

### Document Registration
1. User uploads document
2. System calculates SHA-256 hash
3. **Hash is signed using Azure Key Vault RSA key**
4. Document, hash, and signature stored in Cosmos DB
5. Signature includes:
   - Username of uploader
   - Timestamp
   - Key ID from Key Vault
   - Algorithm (RS256)

### Document Verification
1. User uploads document to verify
2. System calculates hash
3. Compares with stored hash
4. **Verifies digital signature using Key Vault**
5. Returns:
   - Hash match status
   - Signature validity
   - Original uploader identity

## Response Examples

### Register Response
```json
{
  "filename": "contract.pdf",
  "sha256": "abc123...",
  "storage": "AZURE_BLOB",
  "status": "REGISTERED",
  "signed_by": "john.doe",
  "signature_info": "Signed by john.doe using Azure Key Vault (RS256)"
}
```

### Verify Response
```json
{
  "filename": "contract.pdf",
  "result": "AUTHENTIC",
  "status_message": "Document is authentic and signature is valid",
  "hash_match": true,
  "uploaded_by": "john.doe",
  "signature_verification": {
    "valid": true,
    "signer": "john.doe",
    "algorithm": "RS256",
    "info": "Signed by john.doe using Azure Key Vault (RS256)"
  }
}
```

## Fallback Mode
If Azure Key Vault is not configured or unavailable:
- System uses base64 encoding as fallback (NOT SECURE)
- Warning: "key_vault_used": false in signature data
- Documents still work, but signatures are not cryptographically secure

## Production Deployment

### Using Managed Identity (Recommended for Azure App Service)
When deployed to Azure App Service, Container Apps, or VM:

#### Step 1: Enable Managed Identity
1. Go to your **Azure App Service** in Azure Portal
2. In the left menu, click **"Identity"**
3. Under **"System assigned"** tab:
   - Toggle **Status** to **On**
   - Click **"Save"**
   - Click **"Yes"** to confirm
4. Copy the **Object (principal) ID** that appears

#### Step 2: Grant Key Vault Access
1. Go to your **Key Vault** (`docvault-keyvault`)
2. Click **"Access policies"** in the left menu
3. Click **"+ Add Access Policy"**
4. Configure:
   - **Key permissions:** Get, List, Create, Sign, Verify
   - Click **"Select principal"**
   - Paste the **Object ID** from Step 1
   - Click **"Select"**
5. Click **"Add"**
6. Click **"Save"** at the top

That's it! Your app will automatically use Managed Identity when deployed to Azure.

### Using Service Principal (For CI/CD or External Hosting)
If hosting outside Azure or need CI/CD access:

#### Step 1: Create Service Principal via Portal
1. Go to **"Microsoft Entra ID"** in Azure Portal
2. Click **"App registrations"** → **"+ New registration"**
3. **Name:** `docvault-keyvault-sp`
4. **Supported account types:** Single tenant
5. Click **"Register"**
6. On the overview page, copy:
   - **Application (client) ID**
   - **Directory (tenant) ID**

#### Step 2: Create Client Secret
1. In the same app registration, click **"Certificates & secrets"**
2. Click **"+ New client secret"**
3. **Description:** `Production Key Vault Access`
4. **Expires:** Choose duration (recommended: 12 months)
5. Click **"Add"**
6. **IMPORTANT:** Copy the secret **Value** immediately (you won't see it again!)

#### Step 3: Grant Key Vault Access to Service Principal
1. Go to your **Key Vault**
2. Click **"Access policies"** → **"+ Add Access Policy"**
3. Configure:
   - **Key permissions:** Get, List, Create, Sign, Verify
   - Click **"Select principal"**
   - Search for `docvault-keyvault-sp`
   - Select it and click **"Select"**
4. Click **"Add"**, then **"Save"**

#### Step 4: Update Environment Variables
Add the credentials to your `.env` file or application settings:
```env
AZURE_CLIENT_ID=<your-client-id-from-step-1>
AZURE_TENANT_ID=<your-tenant-id-from-step-1>
AZURE_CLIENT_SECRET=<your-client-secret-from-step-2>
AZURE_KEY_VAULT_URL=https://docvault-keyvault.vault.azure.net/
```

## Security Benefits
✅ **Non-repudiation:** Uploader cannot deny signing the document  
✅ **Authenticity:** Proves document came from specific user  
✅ **Integrity:** Any tampering invalidates signature  
✅ **Audit Trail:** Complete record of who signed what and when  
✅ **Key Rotation:** Keys managed centrally in Key Vault  
✅ **HSM-backed:** Premium Key Vault uses hardware security modules

## Troubleshooting

### "Azure Key Vault not available"
**Symptoms:** Error message when uploading documents

**Solutions:**
1. Verify `AZURE_KEY_VAULT_URL` in `.env` is correct
2. Check you're logged in to Azure CLI:
   ```bash
   az login
   az account show
   ```
3. In Azure Portal:
   - Go to your Key Vault
   - Click **"Access policies"**
   - Verify your user or service principal has permissions

### "Access denied" or "Forbidden" errors
**Symptoms:** 403 errors when accessing Key Vault

**Solutions:**
1. **For Local Development:**
   - Ensure you're logged in: `az login`
   - Verify your user has Key Vault access policy (see Setup Step 1.3)

2. **For Service Principal:**
   - Verify all three environment variables are set correctly
   - Check the service principal has Key Vault access policy
   - Ensure the client secret hasn't expired

3. **For Managed Identity:**
   - Verify Managed Identity is enabled in App Service
   - Check the Object ID matches in Key Vault access policy

### Signature verification fails
**Symptoms:** Document shows "SIGNATURE_INVALID"

**Possible Causes:**
1. Key was rotated or deleted in Key Vault
2. Using different Key Vault for sign vs verify
3. `key_vault_used: false` indicates fallback mode was used during registration

**Solution:**
- Check Key Vault access and permissions
- Re-register documents if Key Vault was recently configured

### "Cannot find module" errors
**Solution:** Install required packages:
```bash
pip install azure-keyvault-keys azure-identity
```

## Quick Reference

### Key Vault Permissions Required
- **Get** - Read key metadata
- **List** - List keys in vault
- **Create** - Create new signing keys
- **Sign** - Sign document hashes
- **Verify** - Verify signatures

### Authentication Priority (DefaultAzureCredential)
The system tries authentication in this order:
1. ✅ **Environment Variables** (AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET)
2. ✅ **Managed Identity** (when running in Azure)
3. ✅ **Azure CLI** (for local development)
4. ✅ **Visual Studio** / **VS Code** credentials
5. ❌ Falls back to base64 if all fail
