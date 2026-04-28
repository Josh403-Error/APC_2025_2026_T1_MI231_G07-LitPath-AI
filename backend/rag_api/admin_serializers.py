from rest_framework import serializers
from .models import AdminUser, UserAccount, UserRole
from .password_validation import validate_password_strength

class AdminLoginSerializer(serializers.Serializer):
    """Serializer for admin login"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for admin user data (excludes password)"""
    class Meta:
        model = AdminUser
        fields = ['id', 'email', 'full_name', 'is_active', 'created_at', 'last_login']
        read_only_fields = ['id', 'created_at', 'last_login']

class AdminCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating admin users"""
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = AdminUser
        fields = ['email', 'password', 'full_name', 'is_active']

    def validate_password(self, value):
        is_valid_password, password_error = validate_password_strength(value)
        if not is_valid_password:
            raise serializers.ValidationError(password_error)
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        admin = AdminUser(**validated_data)
        admin.set_password(password)
        admin.save()
        return admin


class UserAccountAdminSerializer(serializers.ModelSerializer):
    role_label = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = UserAccount
        fields = [
            'id', 'email', 'username', 'full_name', 'role', 'role_label',
            'is_active', 'created_at', 'last_login', 'school_level',
            'school_name', 'client_type', 'sex', 'age', 'region', 'category'
        ]
        read_only_fields = ['id', 'created_at', 'last_login', 'role_label']


class UserAccountAdminCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = UserAccount
        fields = [
            'email', 'username', 'full_name', 'role', 'password', 'is_active',
            'school_level', 'school_name', 'client_type', 'sex', 'age', 'region', 'category'
        ]

    def validate_password(self, value):
        is_valid_password, password_error = validate_password_strength(value)
        if not is_valid_password:
            raise serializers.ValidationError(password_error)
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = UserAccount(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserAccountAdminUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=False, min_length=8)

    class Meta:
        model = UserAccount
        fields = [
            'email', 'username', 'full_name', 'role', 'is_active', 'password',
            'school_level', 'school_name', 'client_type', 'sex', 'age', 'region', 'category'
        ]

    def validate_password(self, value):
        is_valid_password, password_error = validate_password_strength(value)
        if not is_valid_password:
            raise serializers.ValidationError(password_error)
        return value

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attribute, value in validated_data.items():
            setattr(instance, attribute, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
