from functools import wraps

from rest_framework import status
from rest_framework.response import Response

from .models import Session, UserRole


AUTH_REQUIRED_MESSAGE = 'Authentication required.'
FORBIDDEN_MESSAGE = 'You do not have permission to access this resource.'


def get_authenticated_session(request):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None, Response(
            {'success': False, 'message': AUTH_REQUIRED_MESSAGE},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    session_token = auth_header[7:].strip()
    if not session_token:
        return None, Response(
            {'success': False, 'message': AUTH_REQUIRED_MESSAGE},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    session = Session.find_by_token(session_token)
    if not session or not session.user:
        return None, Response(
            {'success': False, 'message': 'Invalid or expired session.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    return session, None


def get_authenticated_user(request):
    session, error_response = get_authenticated_session(request)
    if error_response:
        return None, error_response
    return session.user, None


def require_roles(*allowed_roles):
    allowed = set(allowed_roles)

    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            user, error_response = get_authenticated_user(request)
            if error_response:
                return error_response

            if user.role not in allowed:
                return Response(
                    {'success': False, 'message': FORBIDDEN_MESSAGE},
                    status=status.HTTP_403_FORBIDDEN,
                )

            request.authenticated_user = user
            return view_func(request, *args, **kwargs)

        return wrapped_view

    return decorator


require_staff_or_admin = require_roles(UserRole.STAFF, UserRole.ADMIN)
require_admin_only = require_roles(UserRole.ADMIN)