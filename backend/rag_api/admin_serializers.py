from rest_framework import serializers
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
from .password_validation import validate_password_strength
from .system_settings import (
    ALLOWED_AI_PROVIDERS,
    ALLOWED_RANKING_STRATEGIES,
    clone_default_system_settings,
    deep_merge_dict,
    normalize_system_settings,
)

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


class SystemSettingsSerializer(serializers.ModelSerializer):
    ai_model_settings = serializers.JSONField()
    search_settings = serializers.JSONField()
    environment_config = serializers.JSONField()

    class Meta:
        model = SystemSettings
        fields = ['id', 'ai_model_settings', 'search_settings', 'environment_config', 'updated_at', 'updated_by']
        read_only_fields = ['id', 'updated_at', 'updated_by']

    def validate_ai_model_settings(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('AI model settings must be an object.')

        provider = value.get('provider')
        if provider and provider not in ALLOWED_AI_PROVIDERS:
            raise serializers.ValidationError('Unsupported AI provider.')

        temperature = value.get('temperature')
        if temperature is not None:
            try:
                temperature = float(temperature)
            except (TypeError, ValueError) as exc:
                raise serializers.ValidationError('Temperature must be a number.') from exc
            if temperature < 0 or temperature > 2:
                raise serializers.ValidationError('Temperature must be between 0 and 2.')

        top_p = value.get('top_p')
        if top_p is not None:
            try:
                top_p = float(top_p)
            except (TypeError, ValueError) as exc:
                raise serializers.ValidationError('Top-p must be a number.') from exc
            if top_p <= 0 or top_p > 1:
                raise serializers.ValidationError('Top-p must be greater than 0 and at most 1.')

        max_output_tokens = value.get('max_output_tokens')
        if max_output_tokens is not None:
            try:
                max_output_tokens = int(max_output_tokens)
            except (TypeError, ValueError) as exc:
                raise serializers.ValidationError('Max output tokens must be an integer.') from exc
            if max_output_tokens < 64 or max_output_tokens > 8192:
                raise serializers.ValidationError('Max output tokens must be between 64 and 8192.')

        return value

    def validate_search_settings(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('Search settings must be an object.')

        ranking_strategy = value.get('ranking_strategy')
        if ranking_strategy and ranking_strategy not in ALLOWED_RANKING_STRATEGIES:
            raise serializers.ValidationError('Unsupported ranking strategy.')

        result_limit = value.get('result_limit')
        if result_limit is not None:
            try:
                result_limit = int(result_limit)
            except (TypeError, ValueError) as exc:
                raise serializers.ValidationError('Result limit must be an integer.') from exc
            if result_limit < 1 or result_limit > 50:
                raise serializers.ValidationError('Result limit must be between 1 and 50.')

        rerank_top_k = value.get('rerank_top_k')
        if rerank_top_k is not None:
            try:
                rerank_top_k = int(rerank_top_k)
            except (TypeError, ValueError) as exc:
                raise serializers.ValidationError('Rerank top-k must be an integer.') from exc
            if rerank_top_k < 1 or rerank_top_k > 50:
                raise serializers.ValidationError('Rerank top-k must be between 1 and 50.')

        distance_threshold = value.get('distance_threshold')
        if distance_threshold is not None:
            try:
                distance_threshold = float(distance_threshold)
            except (TypeError, ValueError) as exc:
                raise serializers.ValidationError('Distance threshold must be a number.') from exc
            if distance_threshold < 0 or distance_threshold > 5:
                raise serializers.ValidationError('Distance threshold must be between 0 and 5.')

        return value

    def validate_environment_config(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('Environment configuration must be an object.')
        return value

    def create(self, validated_data):
        settings = clone_default_system_settings()
        settings = deep_merge_dict(settings, validated_data)
        return SystemSettings.objects.create(
            id=1,
            ai_model_settings=settings['ai_model_settings'],
            search_settings=settings['search_settings'],
            environment_config=settings['environment_config'],
        )

    def update(self, instance, validated_data):
        settings = {
            'ai_model_settings': instance.ai_model_settings,
            'search_settings': instance.search_settings,
            'environment_config': instance.environment_config,
        }
        settings = deep_merge_dict(settings, validated_data)
        settings = normalize_system_settings(settings)

        instance.ai_model_settings = settings['ai_model_settings']
        instance.search_settings = settings['search_settings']
        instance.environment_config = settings['environment_config']

        request = self.context.get('request')
        if request and hasattr(request, 'authenticated_user'):
            instance.updated_by = request.authenticated_user
        instance.save()
        return instance


class DatabaseStructureRecordSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)

    class Meta:
        model = DatabaseStructureRecord
        fields = [
            'id',
            'name',
            'schema_version',
            'migration_label',
            'change_summary',
            'rollback_script',
            'applied_at',
            'is_current',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'created_by_name',
            'updated_by_name',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'created_by_name',
            'updated_by_name',
        ]


class DatabaseBackupRecordSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)

    class Meta:
        model = DatabaseBackupRecord
        fields = [
            'id',
            'name',
            'backup_type',
            'target_environment',
            'storage_location',
            'retention_days',
            'size_mb',
            'status',
            'notes',
            'backup_started_at',
            'backup_completed_at',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'created_by_name',
            'updated_by_name',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'created_by_name',
            'updated_by_name',
        ]

    def validate_retention_days(self, value):
        if value < 1 or value > 3650:
            raise serializers.ValidationError('Retention days must be between 1 and 3650.')
        return value


class SecurityAuthenticationPolicySerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)

    class Meta:
        model = SecurityAuthenticationPolicy
        fields = [
            'id',
            'name',
            'authentication_mode',
            'password_min_length',
            'password_history_count',
            'session_timeout_minutes',
            'max_failed_attempts',
            'lockout_minutes',
            'require_mfa',
            'is_active',
            'notes',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'created_by_name',
            'updated_by_name',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'created_by_name',
            'updated_by_name',
        ]

    def validate_password_min_length(self, value):
        if value < 8 or value > 128:
            raise serializers.ValidationError('Password minimum length must be between 8 and 128.')
        return value

    def validate_password_history_count(self, value):
        if value < 1 or value > 24:
            raise serializers.ValidationError('Password history count must be between 1 and 24.')
        return value

    def validate_session_timeout_minutes(self, value):
        if value < 5 or value > 1440:
            raise serializers.ValidationError('Session timeout must be between 5 and 1440 minutes.')
        return value

    def validate_max_failed_attempts(self, value):
        if value < 1 or value > 25:
            raise serializers.ValidationError('Max failed attempts must be between 1 and 25.')
        return value

    def validate_lockout_minutes(self, value):
        if value < 1 or value > 1440:
            raise serializers.ValidationError('Lockout duration must be between 1 and 1440 minutes.')
        return value


class SecurityAccessControlRuleSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)

    class Meta:
        model = SecurityAccessControlRule
        fields = [
            'id',
            'name',
            'subject_type',
            'subject_name',
            'resource_name',
            'permission_level',
            'scope',
            'conditions',
            'is_active',
            'notes',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'created_by_name',
            'updated_by_name',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'created_by_name',
            'updated_by_name',
        ]


class SecurityAuditLogEntrySerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)

    class Meta:
        model = SecurityAuditLogEntry
        fields = [
            'id',
            'event_type',
            'actor_label',
            'target_label',
            'action_summary',
            'severity',
            'outcome',
            'ip_address',
            'occurred_at',
            'notes',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'created_by_name',
            'updated_by_name',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'created_by_name',
            'updated_by_name',
        ]
