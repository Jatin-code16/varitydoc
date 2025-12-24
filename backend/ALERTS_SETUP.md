# Real-Time Alert System Setup Guide

## Overview
DocVault's real-time alert system provides instant notifications when critical events occur, especially tampering detection.

## Alert Types

### 1. **Document Tampered** 🚨
**Severity:** CRITICAL  
**Triggered when:** Document hash verification fails  
**Recipients:** Document owner  
**Contains:**
- Filename
- Stored hash (truncated)
- Uploaded hash (truncated)
- Action required message

### 2. **Invalid Digital Signature** 🔐
**Severity:** CRITICAL  
**Triggered when:** Signature verification fails but hash matches  
**Recipients:** Document owner  
**Contains:**
- Filename
- Original signer
- Action required message

### 3. **Document Registered** ✅
**Severity:** INFO  
**Triggered when:** Document successfully registered  
**Recipients:** Uploader  
**Contains:**
- Filename
- Signer name

### 4. **Unauthorized Access** 🚫
**Severity:** WARNING  
**Triggered when:** User attempts action without permission  
**Recipients:** User who attempted action  
**Contains:**
- Attempted action
- Required role
- User's current role

## API Endpoints

### Get Alerts
```http
GET /alerts?unread_only=false
Authorization: Bearer <token>

Response:
{
  "count": 5,
  "alerts": [
    {
      "id": "alert_1703456789.123",
      "type": "document_tampered",
      "severity": "critical",
      "title": "⚠️ Document Tampering Detected!",
      "message": "The document 'contract.pdf' has been tampered with...",
      "metadata": {
        "filename": "contract.pdf",
        "stored_hash": "abc123...",
        "uploaded_hash": "def456...",
        "action_required": "Investigate..."
      },
      "timestamp": "2025-12-24T10:30:00.123Z",
      "read": false
    }
  ]
}
```

### Get Unread Alerts Only
```http
GET /alerts?unread_only=true
Authorization: Bearer <token>
```

### Mark Alert as Read
```http
POST /alerts/{alert_id}/read
Authorization: Bearer <token>

Response:
{
  "message": "Alert marked as read"
}
```

### Mark All Alerts as Read
```http
POST /alerts/read-all
Authorization: Bearer <token>

Response:
{
  "message": "Marked 3 alerts as read",
  "count": 3
}
```

### Clear All Alerts
```http
DELETE /alerts
Authorization: Bearer <token>

Response:
{
  "message": "Cleared 10 alerts",
  "count": 10
}
```

### Get User Info (includes unread alert count)
```http
GET /me
Authorization: Bearer <token>

Response:
{
  "username": "john.doe",
  "role": "document_owner",
  ...
  "unread_alerts": 2
}
```

## Frontend Integration

### 1. Alert Badge (Notification Bell)
```javascript
// Fetch user info to get unread count
const response = await fetch('/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const userData = await response.json();

// Display badge
<NotificationBell count={userData.unread_alerts} />
```

### 2. Alert Dropdown/Panel
```jsx
function AlertPanel() {
  const [alerts, setAlerts] = useState([]);
  
  useEffect(() => {
    fetchAlerts();
    // Poll every 30 seconds for new alerts
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchAlerts = async () => {
    const response = await fetch('/alerts?unread_only=true', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setAlerts(data.alerts);
  };
  
  const markAsRead = async (alertId) => {
    await fetch(`/alerts/${alertId}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchAlerts(); // Refresh
  };
  
  return (
    <div className="alerts">
      {alerts.map(alert => (
        <Alert
          key={alert.id}
          severity={alert.severity}
          title={alert.title}
          message={alert.message}
          onRead={() => markAsRead(alert.id)}
        />
      ))}
    </div>
  );
}
```

### 3. Real-Time Alert Display
```jsx
// Show critical alerts as toast notifications
useEffect(() => {
  const checkAlerts = async () => {
    const response = await fetch('/alerts?unread_only=true');
    const data = await response.json();
    
    // Show critical alerts as toast
    data.alerts
      .filter(a => a.severity === 'critical')
      .forEach(alert => {
        toast.error(alert.title + ': ' + alert.message);
      });
  };
  
  checkAlerts();
  const interval = setInterval(checkAlerts, 10000); // Every 10 seconds
  return () => clearInterval(interval);
}, []);
```

### 4. Alert Styling by Severity
```css
.alert-critical {
  background: #fee;
  border-left: 4px solid #c00;
  color: #800;
}

.alert-warning {
  background: #ffeaa7;
  border-left: 4px solid #fdcb6e;
  color: #856404;
}

.alert-info {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  color: #0d47a1;
}
```

## Notification Channels

### 1. In-App Notifications (✅ Implemented)
- Real-time alerts in web interface
- Badge with unread count
- Alert panel/dropdown
- Toast notifications for critical alerts

### 2. Email Notifications (📧 Ready for Integration)

#### Using Azure Communication Services
```python
# Install package
pip install azure-communication-email

# In alert_service.py (already has placeholder)
from azure.communication.email import EmailClient

def send_email_alert(user_email, alert):
    connection_string = os.getenv("AZURE_COMMUNICATION_CONNECTION_STRING")
    client = EmailClient.from_connection_string(connection_string)
    
    message = {
        "senderAddress": "noreply@docvault.com",
        "recipients": {
            "to": [{"address": user_email}]
        },
        "content": {
            "subject": alert.title,
            "html": f"""
                <h2>{alert.title}</h2>
                <p>{alert.message}</p>
                <p><strong>Time:</strong> {alert.timestamp}</p>
                <p><a href="https://docvault.app/alerts">View in DocVault</a></p>
            """
        }
    }
    
    poller = client.begin_send(message)
    result = poller.result()
```

#### Setup Azure Communication Services Using Azure Portal

##### Step 1: Create Communication Services Resource
1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"**
3. Search for **"Communication Services"**
4. Click **"Create"**

##### Step 2: Configure Basic Settings
1. **Subscription:** Select your Azure subscription
2. **Resource Group:** Select `docvault-rg` (or create new)
3. **Resource Name:** `docvault-communication` (must be unique)
4. **Data Location:** Select **United States** (or your preferred region)
5. Click **"Review + create"**
6. Click **"Create"**

Wait for deployment to complete (usually 1-2 minutes).

##### Step 3: Get Connection String
1. Once deployed, click **"Go to resource"**
2. In the left menu, click **"Keys"**
3. Under **"Primary key"**, click the **Copy** icon next to **"Connection string"**
4. Save this connection string securely

##### Step 4: Configure Email Domain (Required for Email)
1. In the Communication Services resource, click **"Email"** in the left menu
2. Click **"Connect domain"**
3. You have two options:
   
   **Option A: Use Azure Managed Domain (Quick Start)**
   - Click **"Setup"** under "Azure Managed Domains"
   - Click **"Add"**
   - Select a subdomain name (e.g., `docvault`)
   - Domain will be: `docvault.azurecomm.net`
   - Click **"Add"**
   
   **Option B: Use Custom Domain (Production)**
   - Click **"Add custom domain"**
   - Enter your domain (e.g., `docvault.com`)
   - Follow DNS verification steps
   - Add required TXT and CNAME records to your DNS
   - Wait for verification (can take up to 48 hours)

##### Step 5: Add Sender Email Address
1. After domain is verified, go to **"Email"** → **"Domains"**
2. Click on your domain
3. Click **"MailFrom addresses"** tab
4. Add sender address (e.g., `noreply` for `noreply@docvault.azurecomm.net`)
5. Click **"Add"**

##### Step 6: Update Environment Variables
Add to your `.env` file:
```env
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://docvault-communication.communication.azure.com/;accesskey=xxxxx
```

##### Step 7: Install Python Package
```bash
pip install azure-communication-email
```

### 3. SMS Notifications (📱 Optional - Twilio)

```python
# Install package
pip install twilio

# In alert_service.py
from twilio.rest import Client

def send_sms_alert(phone_number, alert):
    client = Client(
        os.getenv("TWILIO_ACCOUNT_SID"),
        os.getenv("TWILIO_AUTH_TOKEN")
    )
    
    message = client.messages.create(
        body=f"{alert.title}: {alert.message}",
        from_=os.getenv("TWILIO_PHONE_NUMBER"),
        to=phone_number
    )
```

## User Preferences

### Store Notification Preferences in Cosmos DB
```python
# Add to user document
user = {
    "username": "john.doe",
    ...
    "notification_preferences": {
        "in_app": True,
        "email": True,
        "sms": False,
        "email_address": "john@example.com",
        "phone_number": "+1234567890",
        "alert_types": {
            "document_tampered": {"email": True, "sms": True},
            "signature_invalid": {"email": True, "sms": False},
            "document_registered": {"email": False, "sms": False}
        }
    }
}
```

### Preferences API Endpoint
```python
@app.put("/me/notifications")
def update_notification_preferences(
    preferences: dict,
    current_user=Depends(get_current_user)
):
    user = get_user_by_username(current_user["username"])
    user["notification_preferences"] = preferences
    users_container.upsert_item(user)
    return {"message": "Preferences updated"}
```

## Alert Flow Diagram

```
┌─────────────────┐
│ Event Occurs    │
│ (Tampering etc.)│
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Create Alert        │
│ (alert_service.py)  │
└────────┬────────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌──────────────┐   ┌─────────────────┐
│ In-App Alert │   │ Check User Prefs│
│ (Immediate)  │   └────────┬────────┘
└──────────────┘            │
                           ├───────────┬──────────┐
                           │           │          │
                           ▼           ▼          ▼
                    ┌──────────┐  ┌───────┐  ┌──────┐
                    │  Email   │  │  SMS  │  │ Push │
                    └──────────┘  └───────┘  └──────┘
```

## Testing Alerts

### 1. Test Tampering Alert
```bash
# 1. Register a document
curl -X POST http://localhost:8000/register \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"

# 2. Modify the file locally
echo "tampered content" >> test.pdf

# 3. Verify (should trigger tampering alert)
curl -X POST http://localhost:8000/verify \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"

# 4. Check alerts
curl -X GET http://localhost:8000/alerts \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Test Unauthorized Access Alert
```bash
# Login as guest
TOKEN=$(curl -s -X POST http://localhost:8000/login \
  -d "username=guest&password=GuestPass" | jq -r '.access_token')

# Try to register (should be denied and create alert)
curl -X POST http://localhost:8000/register \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"

# Check alerts
curl -X GET http://localhost:8000/alerts \
  -H "Authorization: Bearer $TOKEN"
```

## Performance Considerations

### 1. Alert Storage
- Current: In-memory (lost on restart)
- Production: Use Redis or Cosmos DB
- Retention: Keep last 100 alerts per user
- Archive: Move old alerts to cold storage

### 2. Real-Time Updates
- **Polling:** Frontend polls every 30 seconds (current)
- **WebSocket:** Use FastAPI WebSocket for instant push
- **Server-Sent Events (SSE):** Alternative to WebSocket

### 3. WebSocket Implementation
```python
from fastapi import WebSocket

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket, token: str):
    await websocket.accept()
    user = verify_token(token)
    
    while True:
        # Check for new alerts
        alerts = get_user_alerts(user["username"], unread_only=True)
        if alerts:
            await websocket.send_json({
                "type": "new_alerts",
                "alerts": alerts
            })
        await asyncio.sleep(5)
```

## Production Checklist

- [ ] Migrate alert storage from memory to Redis/Cosmos DB
- [ ] Implement Azure Communication Services for email
- [ ] Add SMS notifications (optional)
- [ ] Implement WebSocket for real-time push
- [ ] Add user notification preferences
- [ ] Set up alert archival/retention policy
- [ ] Configure alert rate limiting (prevent spam)
- [ ] Add alert templates for consistent formatting
- [ ] Implement admin alert dashboard
- [ ] Add alert analytics and reporting
- [ ] Set up monitoring for alert delivery failures
- [ ] Implement alert digest (daily/weekly summary emails)

## Environment Variables

```env
# Email (Azure Communication Services)
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://...;accesskey=...

# SMS (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# Redis (for production alert storage)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=...
```

## Security Considerations

1. **Alert Visibility:** Users can only see their own alerts
2. **Alert Injection:** All alerts validated and sanitized
3. **Rate Limiting:** Prevent alert spam (max 10/minute per user)
4. **Email/SMS Verification:** Verify contact info before sending
5. **Audit Trail:** All alert deliveries logged
6. **Data Privacy:** PII removed from alerts after 90 days
