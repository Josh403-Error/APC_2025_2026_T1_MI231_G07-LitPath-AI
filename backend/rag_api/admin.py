from django.contrib import admin
from .models import SystemSettings, DatabaseStructureRecord, DatabaseBackupRecord

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
