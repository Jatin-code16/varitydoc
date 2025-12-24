"""
Alert Service for Real-time Tampering Notifications
Supports multiple notification channels: Email, In-App, SMS (optional)
"""
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import os
from dotenv import load_dotenv

load_dotenv()

class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class AlertType(str, Enum):
    DOCUMENT_TAMPERED = "document_tampered"
    DOCUMENT_REGISTERED = "document_registered"
    SIGNATURE_INVALID = "signature_invalid"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    ACCOUNT_DEACTIVATED = "account_deactivated"

class Alert:
    def __init__(
        self,
        alert_type: AlertType,
        severity: AlertSeverity,
        title: str,
        message: str,
        metadata: Dict = None
    ):
        self.id = f"alert_{datetime.utcnow().timestamp()}"
        self.alert_type = alert_type
        self.severity = severity
        self.title = title
        self.message = message
        self.metadata = metadata or {}
        self.timestamp = datetime.utcnow().isoformat()
        self.read = False
    
    def to_dict(self):
        return {
            "id": self.id,
            "type": self.alert_type.value,
            "severity": self.severity.value,
            "title": self.title,
            "message": self.message,
            "metadata": self.metadata,
            "timestamp": self.timestamp,
            "read": self.read
        }

# In-memory alert storage (in production, use Redis or database)
_alerts_store: Dict[str, List[Alert]] = {}

def create_alert(
    username: str,
    alert_type: AlertType,
    severity: AlertSeverity,
    title: str,
    message: str,
    metadata: Dict = None
) -> Alert:
    """Create a new alert for a user"""
    alert = Alert(alert_type, severity, title, message, metadata)
    
    if username not in _alerts_store:
        _alerts_store[username] = []
    
    _alerts_store[username].append(alert)
    
    # Keep only last 100 alerts per user
    if len(_alerts_store[username]) > 100:
        _alerts_store[username] = _alerts_store[username][-100:]
    
    return alert

def get_user_alerts(username: str, unread_only: bool = False) -> List[Dict]:
    """Get all alerts for a user"""
    alerts = _alerts_store.get(username, [])
    
    if unread_only:
        alerts = [a for a in alerts if not a.read]
    
    return [a.to_dict() for a in alerts]

def mark_alert_read(username: str, alert_id: str) -> bool:
    """Mark an alert as read"""
    alerts = _alerts_store.get(username, [])
    for alert in alerts:
        if alert.id == alert_id:
            alert.read = True
            return True
    return False

def mark_all_alerts_read(username: str) -> int:
    """Mark all alerts as read for a user"""
    alerts = _alerts_store.get(username, [])
    count = 0
    for alert in alerts:
        if not alert.read:
            alert.read = True
            count += 1
    return count

def clear_alerts(username: str) -> int:
    """Clear all alerts for a user"""
    count = len(_alerts_store.get(username, []))
    _alerts_store[username] = []
    return count

# Alert creators for specific events
def alert_document_tampered(
    username: str,
    filename: str,
    stored_hash: str,
    uploaded_hash: str
):
    """Alert when document tampering is detected"""
    return create_alert(
        username=username,
        alert_type=AlertType.DOCUMENT_TAMPERED,
        severity=AlertSeverity.CRITICAL,
        title="⚠️ Document Tampering Detected!",
        message=f"The document '{filename}' has been tampered with. Hash mismatch detected.",
        metadata={
            "filename": filename,
            "stored_hash": stored_hash[:16] + "...",
            "uploaded_hash": uploaded_hash[:16] + "...",
            "action_required": "Investigate the document integrity immediately"
        }
    )

def alert_signature_invalid(
    username: str,
    filename: str,
    signer: str
):
    """Alert when digital signature is invalid"""
    return create_alert(
        username=username,
        alert_type=AlertType.SIGNATURE_INVALID,
        severity=AlertSeverity.CRITICAL,
        title="🔐 Invalid Digital Signature!",
        message=f"The signature for '{filename}' (signed by {signer}) is invalid.",
        metadata={
            "filename": filename,
            "original_signer": signer,
            "action_required": "Contact the document owner for verification"
        }
    )

def alert_document_registered(
    username: str,
    filename: str,
    signed_by: str
):
    """Alert when document is successfully registered"""
    return create_alert(
        username=username,
        alert_type=AlertType.DOCUMENT_REGISTERED,
        severity=AlertSeverity.INFO,
        title="✅ Document Registered",
        message=f"Document '{filename}' has been successfully registered and signed.",
        metadata={
            "filename": filename,
            "signed_by": signed_by
        }
    )

def alert_unauthorized_access(
    username: str,
    attempted_action: str,
    required_role: str
):
    """Alert when unauthorized access attempt is made"""
    return create_alert(
        username=username,
        alert_type=AlertType.UNAUTHORIZED_ACCESS,
        severity=AlertSeverity.WARNING,
        title="🚫 Unauthorized Access Attempt",
        message=f"Attempted to {attempted_action} without proper permissions.",
        metadata={
            "attempted_action": attempted_action,
            "required_role": required_role,
            "your_role": username  # Will be filled in by caller
        }
    )

def broadcast_alert_to_admins(
    alert_type: AlertType,
    severity: AlertSeverity,
    title: str,
    message: str,
    metadata: Dict = None
):
    """Send alert to all admin users"""
    # In production, query database for all admins
    # For now, this is a placeholder
    admin_usernames = []  # Get from database
    
    for admin in admin_usernames:
        create_alert(admin, alert_type, severity, title, message, metadata)

def broadcast_alert_to_auditors(
    alert_type: AlertType,
    severity: AlertSeverity,
    title: str,
    message: str,
    metadata: Dict = None
):
    """Send alert to all auditor users"""
    # Similar to broadcast_alert_to_admins
    pass

# Email notification function (placeholder for Azure Communication Services)
def send_email_notification(
    to_email: str,
    subject: str,
    body: str
):
    """
    Send email notification via Azure Communication Services.
    TODO: Implement with actual Azure Communication Services SDK
    """
    # Placeholder implementation
    print(f"[EMAIL] To: {to_email}")
    print(f"[EMAIL] Subject: {subject}")
    print(f"[EMAIL] Body: {body}")
    
    # In production:
    # from azure.communication.email import EmailClient
    # client = EmailClient.from_connection_string(os.getenv("AZURE_COMMUNICATION_CONNECTION_STRING"))
    # message = {
    #     "senderAddress": "noreply@docvault.com",
    #     "recipients": {"to": [{"address": to_email}]},
    #     "content": {
    #         "subject": subject,
    #         "plainText": body,
    #     }
    # }
    # poller = client.begin_send(message)
    # result = poller.result()

# SMS notification function (placeholder for Twilio or Azure SMS)
def send_sms_notification(
    phone_number: str,
    message: str
):
    """
    Send SMS notification.
    TODO: Implement with Twilio or Azure Communication Services
    """
    print(f"[SMS] To: {phone_number}")
    print(f"[SMS] Message: {message}")
    
    # In production (Twilio):
    # from twilio.rest import Client
    # client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
    # message = client.messages.create(
    #     body=message,
    #     from_=os.getenv("TWILIO_PHONE_NUMBER"),
    #     to=phone_number
    # )
