from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import transaction
from .models import (
    AdminUser,
    UserAccount,
    SystemSettings,
    DatabaseStructureRecord,
    DatabaseBackupRecord,
    SecurityAuthenticationPolicy,
    SecurityAccessControlRule,
    SecurityAuditLogEntry,
)
from .admin_serializers import (
    AdminLoginSerializer,
    AdminUserSerializer,
    AdminCreateSerializer,
    UserAccountAdminSerializer,
    UserAccountAdminCreateSerializer,
    UserAccountAdminUpdateSerializer,
    SystemSettingsSerializer,
    DatabaseStructureRecordSerializer,
    DatabaseBackupRecordSerializer,
    SecurityAuthenticationPolicySerializer,
    SecurityAccessControlRuleSerializer,
    SecurityAuditLogEntrySerializer,
)
from .permissions import require_admin_only

@api_view(['POST'])
def admin_login_view(request):
    """
    POST /api/admin/login/
    Authenticate admin user
    
    Request body:
    {
        "email": "admin@example.com",
        "password": "password123"
    }
    
    Response:
    {
        "success": true,
        "message": "Login successful",
        "admin": {
            "id": "uuid",
            "email": "admin@example.com",
            "full_name": "Admin Name",
            "last_login": "2024-11-23T10:00:00Z"
        }
    }
    """
    try:
        serializer = AdminLoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid input',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        try:
            admin = AdminUser.objects.get(email=email)
            
            if not admin.is_active:
                return Response({
                    'success': False,
                    'message': 'Account is inactive'
                }, status=status.HTTP_403_FORBIDDEN)
            
            if not admin.check_password(password):
                return Response({
                    'success': False,
                    'message': 'Invalid email or password'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Update last login
            admin.last_login = timezone.now()
            admin.save(update_fields=['last_login'])
            
            # Return admin data (without password)
            admin_data = AdminUserSerializer(admin).data
            
            return Response({
                'success': True,
                'message': 'Login successful',
                'admin': admin_data
            }, status=status.HTTP_200_OK)
            
        except AdminUser.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid email or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@require_admin_only
def admin_users_view(request):
    """
    GET /api/admin/users/ - List all admin users
    POST /api/admin/users/ - Create new admin user
    """
    if request.method == 'GET':
        admins = AdminUser.objects.all()
        serializer = AdminUserSerializer(admins, many=True)
        return Response({
            'success': True,
            'admins': serializer.data,
            'count': admins.count()
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        serializer = AdminCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid input',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            admin = serializer.save()
            return Response({
                'success': True,
                'message': 'Admin user created successfully',
                'admin': AdminUserSerializer(admin).data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error creating admin: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@require_admin_only
def admin_user_delete_view(request, admin_id):
    """
    DELETE /api/admin/users/<admin_id>/
    Delete an admin user
    """
    try:
        admin = AdminUser.objects.get(id=admin_id)
        email = admin.email
        admin.delete()
        
        return Response({
            'success': True,
            'message': f'Admin user {email} deleted successfully'
        }, status=status.HTTP_200_OK)
        
    except AdminUser.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Admin user not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'POST'])
@require_admin_only
def admin_user_accounts_view(request):
    """
    GET /api/admin/user-accounts/ - List all user accounts
    POST /api/admin/user-accounts/ - Create a new user account
    """
    if request.method == 'GET':
        accounts = UserAccount.objects.all().order_by('-created_at')
        serializer = UserAccountAdminSerializer(accounts, many=True)
        return Response({
            'success': True,
            'accounts': serializer.data,
            'count': accounts.count()
        }, status=status.HTTP_200_OK)

    serializer = UserAccountAdminCreateSerializer(data=request.data)

    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Invalid input',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = serializer.save()
        return Response({
            'success': True,
            'message': 'User account created successfully',
            'account': UserAccountAdminSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error creating user account: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PATCH'])
@require_admin_only
def admin_user_account_detail_view(request, user_id):
    """
    GET /api/admin/user-accounts/<user_id>/ - Get user account details
    PATCH /api/admin/user-accounts/<user_id>/ - Update user account / deactivate
    """
    try:
        account = UserAccount.objects.get(id=user_id)
    except UserAccount.DoesNotExist:
        return Response({
            'success': False,
            'message': 'User account not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({
            'success': True,
            'account': UserAccountAdminSerializer(account).data
        }, status=status.HTTP_200_OK)

    acting_user = getattr(request, 'authenticated_user', None)
    if acting_user and acting_user.id == account.id:
        incoming_is_active = request.data.get('is_active')
        incoming_role = request.data.get('role')
        if incoming_is_active is not None and bool(incoming_is_active) is False and account.is_active:
            return Response({
                'success': False,
                'message': 'You cannot deactivate your own account from this screen.'
            }, status=status.HTTP_400_BAD_REQUEST)
        if incoming_role is not None and incoming_role != account.role:
            return Response({
                'success': False,
                'message': 'You cannot change your own role from this screen.'
            }, status=status.HTTP_400_BAD_REQUEST)

    serializer = UserAccountAdminUpdateSerializer(account, data=request.data, partial=True)

    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Invalid input',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        account = serializer.save()
        return Response({
            'success': True,
            'message': 'User account updated successfully',
            'account': UserAccountAdminSerializer(account).data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error updating user account: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PATCH'])
@require_admin_only
def system_settings_view(request):
    """GET/PATCH /api/admin/system-settings/ - Read or update system settings."""
    settings = SystemSettings.get_solo()

    if request.method == 'GET':
        serializer = SystemSettingsSerializer(settings)
        return Response({
            'success': True,
            'settings': serializer.data,
        }, status=status.HTTP_200_OK)

    serializer = SystemSettingsSerializer(settings, data=request.data, partial=True, context={'request': request})
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Invalid input',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        settings = serializer.save()
        return Response({
            'success': True,
            'message': 'System settings updated successfully',
            'settings': SystemSettingsSerializer(settings).data,
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error updating system settings: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@require_admin_only
def admin_database_structures_view(request):
    """
    GET /api/admin/database-structures/ - List all structure records
    POST /api/admin/database-structures/ - Create a structure record
    """
    if request.method == 'GET':
        records = DatabaseStructureRecord.objects.all().order_by('-updated_at', '-created_at')
        serializer = DatabaseStructureRecordSerializer(records, many=True)
        return Response({
            'success': True,
            'records': serializer.data,
            'count': records.count(),
        }, status=status.HTTP_200_OK)

    serializer = DatabaseStructureRecordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Invalid input',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        acting_user = getattr(request, 'authenticated_user', None)
        with transaction.atomic():
            record = serializer.save(created_by=acting_user, updated_by=acting_user)
            if record.is_current:
                DatabaseStructureRecord.objects.exclude(id=record.id).update(is_current=False)
        return Response({
            'success': True,
            'message': 'Database structure record created successfully',
            'record': DatabaseStructureRecordSerializer(record).data,
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error creating structure record: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PATCH', 'DELETE'])
@require_admin_only
def admin_database_structure_detail_view(request, record_id):
    """
    GET /api/admin/database-structures/<record_id>/ - Get one structure record
    PATCH /api/admin/database-structures/<record_id>/ - Update one structure record
    DELETE /api/admin/database-structures/<record_id>/ - Delete one structure record
    """
    try:
        record = DatabaseStructureRecord.objects.get(id=record_id)
    except DatabaseStructureRecord.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Database structure record not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({
            'success': True,
            'record': DatabaseStructureRecordSerializer(record).data,
        }, status=status.HTTP_200_OK)

    if request.method == 'DELETE':
        record.delete()
        return Response({
            'success': True,
            'message': 'Database structure record deleted successfully',
        }, status=status.HTTP_200_OK)

    serializer = DatabaseStructureRecordSerializer(record, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Invalid input',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        acting_user = getattr(request, 'authenticated_user', None)
        with transaction.atomic():
            record = serializer.save(updated_by=acting_user)
            if record.is_current:
                DatabaseStructureRecord.objects.exclude(id=record.id).update(is_current=False)
        return Response({
            'success': True,
            'message': 'Database structure record updated successfully',
            'record': DatabaseStructureRecordSerializer(record).data,
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error updating structure record: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@require_admin_only
def admin_database_backups_view(request):
    """
    GET /api/admin/database-backups/ - List all backup records
    POST /api/admin/database-backups/ - Create a backup record
    """
    if request.method == 'GET':
        records = DatabaseBackupRecord.objects.all().order_by('-updated_at', '-created_at')
        serializer = DatabaseBackupRecordSerializer(records, many=True)
        return Response({
            'success': True,
            'records': serializer.data,
            'count': records.count(),
        }, status=status.HTTP_200_OK)

    serializer = DatabaseBackupRecordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Invalid input',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        acting_user = getattr(request, 'authenticated_user', None)
        record = serializer.save(created_by=acting_user, updated_by=acting_user)
        return Response({
            'success': True,
            'message': 'Database backup record created successfully',
            'record': DatabaseBackupRecordSerializer(record).data,
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error creating backup record: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PATCH', 'DELETE'])
@require_admin_only
def admin_database_backup_detail_view(request, backup_id):
    """
    GET /api/admin/database-backups/<backup_id>/ - Get one backup record
    PATCH /api/admin/database-backups/<backup_id>/ - Update one backup record
    DELETE /api/admin/database-backups/<backup_id>/ - Delete one backup record
    """
    try:
        record = DatabaseBackupRecord.objects.get(id=backup_id)
    except DatabaseBackupRecord.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Database backup record not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({
            'success': True,
            'record': DatabaseBackupRecordSerializer(record).data,
        }, status=status.HTTP_200_OK)

    if request.method == 'DELETE':
        record.delete()
        return Response({
            'success': True,
            'message': 'Database backup record deleted successfully',
        }, status=status.HTTP_200_OK)

    serializer = DatabaseBackupRecordSerializer(record, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Invalid input',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        acting_user = getattr(request, 'authenticated_user', None)
        record = serializer.save(updated_by=acting_user)

        # Keep lifecycle timestamps consistent with state transitions.
        if record.status == 'running' and not record.backup_started_at:
            record.backup_started_at = timezone.now()
            record.save(update_fields=['backup_started_at', 'updated_at'])
        elif record.status == 'completed' and not record.backup_completed_at:
            now = timezone.now()
            record.backup_started_at = record.backup_started_at or now
            record.backup_completed_at = now
            record.save(update_fields=['backup_started_at', 'backup_completed_at', 'updated_at'])

        return Response({
            'success': True,
            'message': 'Database backup record updated successfully',
            'record': DatabaseBackupRecordSerializer(record).data,
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error updating backup record: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@require_admin_only
def admin_security_auth_policies_view(request):
    """GET/POST /api/admin/security-authentication-policies/ - List or create policies."""
    if request.method == 'GET':
        records = SecurityAuthenticationPolicy.objects.all().order_by('-updated_at', '-created_at')
        serializer = SecurityAuthenticationPolicySerializer(records, many=True)
        return Response({
            'success': True,
            'records': serializer.data,
            'count': records.count(),
        }, status=status.HTTP_200_OK)

    serializer = SecurityAuthenticationPolicySerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Invalid input',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        acting_user = getattr(request, 'authenticated_user', None)
        record = serializer.save(created_by=acting_user, updated_by=acting_user)
        return Response({
            'success': True,
            'message': 'Authentication policy created successfully',
            'record': SecurityAuthenticationPolicySerializer(record).data,
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error creating authentication policy: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PATCH', 'DELETE'])
@require_admin_only
def admin_security_auth_policy_detail_view(request, policy_id):
    """GET/PATCH/DELETE /api/admin/security-authentication-policies/<id>/"""
    try:
        record = SecurityAuthenticationPolicy.objects.get(id=policy_id)
    except SecurityAuthenticationPolicy.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Authentication policy not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({
            'success': True,
            'record': SecurityAuthenticationPolicySerializer(record).data,
        }, status=status.HTTP_200_OK)

    if request.method == 'DELETE':
        record.delete()
        return Response({
            'success': True,
            'message': 'Authentication policy deleted successfully',
        }, status=status.HTTP_200_OK)

    serializer = SecurityAuthenticationPolicySerializer(record, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Invalid input',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        acting_user = getattr(request, 'authenticated_user', None)
        record = serializer.save(updated_by=acting_user)
        return Response({
            'success': True,
            'message': 'Authentication policy updated successfully',
            'record': SecurityAuthenticationPolicySerializer(record).data,
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error updating authentication policy: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@require_admin_only
def admin_security_access_rules_view(request):
    """GET/POST /api/admin/security-access-control-rules/ - List or create access rules."""
    if request.method == 'GET':
        records = SecurityAccessControlRule.objects.all().order_by('-updated_at', '-created_at')
        serializer = SecurityAccessControlRuleSerializer(records, many=True)
        return Response({
            'success': True,
            'records': serializer.data,
            'count': records.count(),
        }, status=status.HTTP_200_OK)

    serializer = SecurityAccessControlRuleSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Invalid input',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        acting_user = getattr(request, 'authenticated_user', None)
        record = serializer.save(created_by=acting_user, updated_by=acting_user)
        return Response({
            'success': True,
            'message': 'Access control rule created successfully',
            'record': SecurityAccessControlRuleSerializer(record).data,
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error creating access rule: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PATCH', 'DELETE'])
@require_admin_only
def admin_security_access_rule_detail_view(request, rule_id):
    """GET/PATCH/DELETE /api/admin/security-access-control-rules/<id>/"""
    try:
        record = SecurityAccessControlRule.objects.get(id=rule_id)
    except SecurityAccessControlRule.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Access control rule not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({
            'success': True,
            'record': SecurityAccessControlRuleSerializer(record).data,
        }, status=status.HTTP_200_OK)

    if request.method == 'DELETE':
        record.delete()
        return Response({
            'success': True,
            'message': 'Access control rule deleted successfully',
        }, status=status.HTTP_200_OK)

    serializer = SecurityAccessControlRuleSerializer(record, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Invalid input',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        acting_user = getattr(request, 'authenticated_user', None)
        record = serializer.save(updated_by=acting_user)
        return Response({
            'success': True,
            'message': 'Access control rule updated successfully',
            'record': SecurityAccessControlRuleSerializer(record).data,
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error updating access rule: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@require_admin_only
def admin_security_audit_logs_view(request):
    """GET/POST /api/admin/security-audit-logs/ - List or create audit entries."""
    if request.method == 'GET':
        records = SecurityAuditLogEntry.objects.all().order_by('-occurred_at', '-updated_at', '-created_at')
        serializer = SecurityAuditLogEntrySerializer(records, many=True)
        return Response({
            'success': True,
            'records': serializer.data,
            'count': records.count(),
        }, status=status.HTTP_200_OK)

    serializer = SecurityAuditLogEntrySerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Invalid input',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        acting_user = getattr(request, 'authenticated_user', None)
        record = serializer.save(created_by=acting_user, updated_by=acting_user)
        return Response({
            'success': True,
            'message': 'Audit log entry created successfully',
            'record': SecurityAuditLogEntrySerializer(record).data,
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error creating audit log entry: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PATCH', 'DELETE'])
@require_admin_only
def admin_security_audit_log_detail_view(request, log_id):
    """GET/PATCH/DELETE /api/admin/security-audit-logs/<id>/"""
    try:
        record = SecurityAuditLogEntry.objects.get(id=log_id)
    except SecurityAuditLogEntry.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Audit log entry not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({
            'success': True,
            'record': SecurityAuditLogEntrySerializer(record).data,
        }, status=status.HTTP_200_OK)

    if request.method == 'DELETE':
        record.delete()
        return Response({
            'success': True,
            'message': 'Audit log entry deleted successfully',
        }, status=status.HTTP_200_OK)

    serializer = SecurityAuditLogEntrySerializer(record, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Invalid input',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        acting_user = getattr(request, 'authenticated_user', None)
        record = serializer.save(updated_by=acting_user)
        return Response({
            'success': True,
            'message': 'Audit log entry updated successfully',
            'record': SecurityAuditLogEntrySerializer(record).data,
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error updating audit log entry: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
