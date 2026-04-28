from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import AdminUser, UserAccount
from .admin_serializers import (
    AdminLoginSerializer,
    AdminUserSerializer,
    AdminCreateSerializer,
    UserAccountAdminSerializer,
    UserAccountAdminCreateSerializer,
    UserAccountAdminUpdateSerializer,
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
