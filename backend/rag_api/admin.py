from django.contrib import admin
from .models import (
	SystemSettings,
	DatabaseStructureRecord,
	DatabaseBackupRecord,
	SecurityAuthenticationPolicy,
	SecurityAccessControlRule,
	SecurityAuditLogEntry,
)

@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
	list_display = ('id', 'updated_at', 'updated_by')
	readonly_fields = ('updated_at',)


@admin.register(DatabaseStructureRecord)
class DatabaseStructureRecordAdmin(admin.ModelAdmin):
	list_display = ('name', 'schema_version', 'migration_label', 'is_current', 'updated_at')
	list_filter = ('is_current',)
	search_fields = ('name', 'schema_version', 'migration_label')


@admin.register(DatabaseBackupRecord)
class DatabaseBackupRecordAdmin(admin.ModelAdmin):
	list_display = ('name', 'backup_type', 'status', 'retention_days', 'updated_at')
	list_filter = ('backup_type', 'status')
	search_fields = ('name', 'target_environment', 'storage_location')


@admin.register(SecurityAuthenticationPolicy)
class SecurityAuthenticationPolicyAdmin(admin.ModelAdmin):
	list_display = ('name', 'authentication_mode', 'require_mfa', 'is_active', 'updated_at')
	list_filter = ('authentication_mode', 'require_mfa', 'is_active')
	search_fields = ('name', 'notes')


@admin.register(SecurityAccessControlRule)
class SecurityAccessControlRuleAdmin(admin.ModelAdmin):
	list_display = ('name', 'subject_type', 'subject_name', 'resource_name', 'permission_level', 'is_active', 'updated_at')
	list_filter = ('subject_type', 'permission_level', 'is_active')
	search_fields = ('name', 'subject_name', 'resource_name', 'scope')


@admin.register(SecurityAuditLogEntry)
class SecurityAuditLogEntryAdmin(admin.ModelAdmin):
	list_display = ('event_type', 'actor_label', 'severity', 'outcome', 'occurred_at')
	list_filter = ('event_type', 'severity', 'outcome')
	search_fields = ('actor_label', 'target_label', 'action_summary', 'notes')
