from django.utils import timezone

from .models import SecurityAuditLogEntry, Session


def _client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR') or 'unknown'


def _extract_session(request):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    session_token = auth_header[7:].strip()
    if not session_token:
        return None
    return Session.find_by_token(session_token)


def _actor_label(user, session):
    if user:
        return user.full_name or user.username or user.email or f"User {user.id}"
    if session and session.guest_id:
        return f"Guest {session.guest_id}"
    return 'Anonymous'


def _map_severity(status_code):
    if status_code >= 500:
        return 'critical', 'failure', 'error'
    if status_code >= 400:
        outcome = 'blocked' if status_code in (401, 403) else 'failure'
        return 'warning', outcome, 'activity'
    return 'info', 'success', 'activity'


def _extract_error_message(response, exception):
    if exception:
        return str(exception)
    if response is None:
        return None
    data = getattr(response, 'data', None)
    if isinstance(data, dict):
        return data.get('message') or data.get('detail') or data.get('error')
    return None


def _build_notes(request, status_code):
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    if user_agent and len(user_agent) > 240:
        user_agent = f"{user_agent[:240]}..."
    if user_agent:
        return f"status={status_code}; user_agent={user_agent}"
    return f"status={status_code}"


def log_system_event(request, response=None, exception=None):
    if not request.path.startswith('/api/'):
        return
    if request.method == 'OPTIONS':
        return

    status_code = getattr(response, 'status_code', None)
    if status_code is None:
        status_code = 500 if exception else 200

    severity, outcome, event_type = _map_severity(status_code)
    if exception:
        event_type = 'error'
        severity = 'critical'
        outcome = 'failure'

    session = _extract_session(request)
    user = getattr(request, 'authenticated_user', None) or (session.user if session else None)
    actor_label = _actor_label(user, session)
    full_path = request.get_full_path()

    action_summary = f"{request.method} {full_path}"
    error_message = _extract_error_message(response, exception)
    if error_message:
        cleaned_message = error_message.strip()
        if len(cleaned_message) > 260:
            cleaned_message = f"{cleaned_message[:260]}..."
        action_summary = f"{action_summary} - {cleaned_message}"

    SecurityAuditLogEntry.objects.create(
        event_type=event_type,
        actor_label=actor_label,
        target_label=full_path,
        action_summary=action_summary,
        severity=severity,
        outcome=outcome,
        ip_address=_client_ip(request),
        occurred_at=timezone.now(),
        notes=_build_notes(request, status_code),
        created_by=user,
        updated_by=user,
    )
