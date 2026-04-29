// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    AlertCircle,
    CheckCircle2,
    Database,
    Edit2,
    HardDriveDownload,
    KeyRound,
    Loader2,
    LogOut,
    RefreshCw,
    Save,
    Search,
    ShieldCheck,
    UserRoundCog,
    UserRoundPlus,
    UserX,
    Users,
    X,
    Trash2,
} from 'lucide-react';
import { API_BASE_URL, apiHeaders } from '../../services/api';
import { getPasswordRequirementChecks, validatePasswordStrength } from '../../lib/passwordValidation';
import { getRoleLabel } from '../../lib/roleLabels';

const roleOptions = [
    { value: 'user', label: 'User' },
    { value: 'staff', label: 'Library Administrator' },
    { value: 'admin', label: 'IT Administrator' },
];

const emptyForm = {
    email: '',
    username: '',
    full_name: '',
    role: 'user',
    is_active: true,
    password: '',
    confirmPassword: '',
};

const emptyStructureForm = {
    name: '',
    schema_version: '',
    migration_label: '',
    change_summary: '',
    rollback_script: '',
    applied_at: '',
    is_current: false,
};

const emptyBackupForm = {
    name: '',
    backup_type: 'full',
    target_environment: '',
    storage_location: '',
    retention_days: 30,
    size_mb: '',
    status: 'planned',
    notes: '',
    backup_started_at: '',
    backup_completed_at: '',
};

const emptySecurityPolicyForm = {
    name: '',
    authentication_mode: 'password_mfa',
    password_min_length: 12,
    password_history_count: 5,
    session_timeout_minutes: 60,
    max_failed_attempts: 5,
    lockout_minutes: 15,
    require_mfa: true,
    is_active: true,
    notes: '',
};

const emptySecurityAccessRuleForm = {
    name: '',
    subject_type: 'role',
    subject_name: '',
    resource_name: '',
    permission_level: 'read',
    scope: '',
    conditions: '',
    is_active: true,
    notes: '',
};

const emptySecurityAuditLogForm = {
    event_type: 'manual_note',
    actor_label: '',
    target_label: '',
    action_summary: '',
    severity: 'info',
    outcome: 'success',
    ip_address: '',
    occurred_at: '',
    notes: '',
};

const defaultSystemSettings = {
    ai_model_settings: {
        provider: 'gemini',
        generation_model: 'gemini-3-flash',
        rerank_model: 'gemini-2.5-flash',
        rewrite_model: 'gemini-2.5-flash-lite',
        temperature: 0.2,
        top_p: 0.8,
        max_output_tokens: 1024,
    },
    search_settings: {
        ranking_strategy: 'hybrid',
        result_limit: 10,
        rerank_top_k: 15,
        distance_threshold: 1.2,
        enable_subject_filters: false,
        enable_year_filters: true,
        enable_strict_matching: true,
        relevance_floor: 0.5,
    },
    environment_config: {
        database_url: '',
        email_host_user: '',
        email_host_password: '',
        gemini_api_key: '',
        hf_token: '',
    },
};

const normalizeSystemSettings = (rawSettings = {}) => ({
    ai_model_settings: {
        ...defaultSystemSettings.ai_model_settings,
        ...(rawSettings.ai_model_settings || {}),
    },
    search_settings: {
        ...defaultSystemSettings.search_settings,
        ...(rawSettings.search_settings || {}),
    },
    environment_config: {
        ...defaultSystemSettings.environment_config,
        ...(rawSettings.environment_config || {}),
    },
});

const parseApiResponse = async (response, fallbackMessage) => {
    const responseText = await response.text();
    if (!responseText) {
        return {};
    }

    try {
        return JSON.parse(responseText);
    } catch {
        const responseType = response.headers.get('content-type') || 'unknown content type';
        throw new Error(`${fallbackMessage} The server returned ${responseType} instead of JSON.`);
    }
};

const formatDateTime = (value) => {
    if (!value) return 'Never';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Never';
    return date.toLocaleString();
};

const getBadgeClasses = (role, isActive) => {
    if (!isActive) {
        return 'border-slate-200 bg-slate-100 text-slate-600';
    }

    if (role === 'admin') {
        return 'border-rose-200 bg-rose-50 text-rose-700';
    }

    if (role === 'staff') {
        return 'border-sky-200 bg-sky-50 text-sky-700';
    }

    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
};

const formatChoiceLabel = (value) => value ? value.replace(/_/g, ' ') : 'Unknown';

const ITAdminDashboard = () => {
    const { user, logout } = useAuth();

    const tabs = [
        { key: 'accounts', label: 'Account Management' },
        { key: 'database', label: 'Manage Database Structure & Backups' },
        { key: 'security', label: 'System Security' },
        { key: 'system', label: 'System Settings' },
    ];
    const [activeTab, setActiveTab] = useState('accounts');

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [pageError, setPageError] = useState('');
    const [settingsError, setSettingsError] = useState('');
    const [settingsUpdatedAt, setSettingsUpdatedAt] = useState('');
    const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [systemSettings, setSystemSettings] = useState(defaultSystemSettings);
    const [databaseLoading, setDatabaseLoading] = useState(true);
    const [databaseSaving, setDatabaseSaving] = useState(false);
    const [databaseError, setDatabaseError] = useState('');
    const [databaseStructures, setDatabaseStructures] = useState([]);
    const [backupRecords, setBackupRecords] = useState([]);
    const [structureForm, setStructureForm] = useState(emptyStructureForm);
    const [backupForm, setBackupForm] = useState(emptyBackupForm);
    const [editingStructureId, setEditingStructureId] = useState(null);
    const [editingBackupId, setEditingBackupId] = useState(null);
    const [securityLoading, setSecurityLoading] = useState(true);
    const [securitySaving, setSecuritySaving] = useState(false);
    const [securityError, setSecurityError] = useState('');
    const [securityPolicies, setSecurityPolicies] = useState([]);
    const [securityAccessRules, setSecurityAccessRules] = useState([]);
    const [securityAuditLogs, setSecurityAuditLogs] = useState([]);
    const [securityPolicyForm, setSecurityPolicyForm] = useState(emptySecurityPolicyForm);
    const [securityAccessRuleForm, setSecurityAccessRuleForm] = useState(emptySecurityAccessRuleForm);
    const [securityAuditLogForm, setSecurityAuditLogForm] = useState(emptySecurityAuditLogForm);
    const [editingSecurityPolicyId, setEditingSecurityPolicyId] = useState(null);
    const [editingSecurityAccessRuleId, setEditingSecurityAccessRuleId] = useState(null);
    const [editingSecurityAuditLogId, setEditingSecurityAuditLogId] = useState(null);

    const showToast = (type, message) => {
        setToast({ show: true, type, message });
        window.setTimeout(() => {
            setToast((current) => (current.message === message ? { show: false, type: 'success', message: '' } : current));
        }, 3000);
    };

    const loadAccounts = async () => {
        setLoading(true);
        setPageError('');

        try {
            const response = await fetch(`${API_BASE_URL}/admin/user-accounts/`, {
                headers: apiHeaders(true),
            });
            const data = await parseApiResponse(response, 'Unable to load user accounts.');

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to load user accounts.');
            }

            setAccounts(data.accounts || []);
        } catch (error) {
            setPageError(error.message || 'Unable to load user accounts.');
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        setSettingsLoading(true);
        setSettingsError('');

        try {
            const response = await fetch(`${API_BASE_URL}/admin/system-settings/`, {
                headers: apiHeaders(true),
            });
            const data = await parseApiResponse(response, 'Unable to load system settings.');

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to load system settings.');
            }

            setSettingsUpdatedAt(data.settings?.updated_at || '');
            setSystemSettings(normalizeSystemSettings(data.settings || {}));
        } catch (error) {
            setSettingsError(error.message || 'Unable to load system settings.');
        } finally {
            setSettingsLoading(false);
        }
    };

    const loadDatabaseAdminData = async () => {
        setDatabaseLoading(true);
        setDatabaseError('');

        try {
            const [structuresResponse, backupsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/database-structures/`, { headers: apiHeaders(true) }),
                fetch(`${API_BASE_URL}/admin/database-backups/`, { headers: apiHeaders(true) }),
            ]);

            const structuresData = await parseApiResponse(structuresResponse, 'Unable to load database structures.');
            const backupsData = await parseApiResponse(backupsResponse, 'Unable to load database backups.');

            if (!structuresResponse.ok || !structuresData.success) {
                throw new Error(structuresData.message || 'Unable to load database structures.');
            }
            if (!backupsResponse.ok || !backupsData.success) {
                throw new Error(backupsData.message || 'Unable to load database backups.');
            }

            setDatabaseStructures(structuresData.records || []);
            setBackupRecords(backupsData.records || []);
        } catch (error) {
            setDatabaseError(error.message || 'Unable to load database admin data.');
        } finally {
            setDatabaseLoading(false);
        }
    };

    const loadSecurityAdminData = async () => {
        setSecurityLoading(true);
        setSecurityError('');

        try {
            const [policiesResponse, rulesResponse, logsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/security-authentication-policies/`, { headers: apiHeaders(true) }),
                fetch(`${API_BASE_URL}/admin/security-access-control-rules/`, { headers: apiHeaders(true) }),
                fetch(`${API_BASE_URL}/admin/security-audit-logs/`, { headers: apiHeaders(true) }),
            ]);

            const policiesData = await parseApiResponse(policiesResponse, 'Unable to load authentication policies.');
            const rulesData = await parseApiResponse(rulesResponse, 'Unable to load access control rules.');
            const logsData = await parseApiResponse(logsResponse, 'Unable to load audit log entries.');

            if (!policiesResponse.ok || !policiesData.success) {
                throw new Error(policiesData.message || 'Unable to load authentication policies.');
            }
            if (!rulesResponse.ok || !rulesData.success) {
                throw new Error(rulesData.message || 'Unable to load access control rules.');
            }
            if (!logsResponse.ok || !logsData.success) {
                throw new Error(logsData.message || 'Unable to load audit log entries.');
            }

            setSecurityPolicies(policiesData.records || []);
            setSecurityAccessRules(rulesData.records || []);
            setSecurityAuditLogs(logsData.records || []);
        } catch (error) {
            setSecurityError(error.message || 'Unable to load security administration data.');
        } finally {
            setSecurityLoading(false);
        }
    };

    useEffect(() => {
        loadAccounts();
        loadSettings();
        loadDatabaseAdminData();
        loadSecurityAdminData();
    }, []);

    useEffect(() => {
        if (!toast.show) return undefined;
        const timer = window.setTimeout(() => {
            setToast({ show: false, type: 'success', message: '' });
        }, 3000);
        return () => window.clearTimeout(timer);
    }, [toast.show]);

    const resetForm = () => {
        setForm(emptyForm);
        setEditingAccount(null);
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (account) => {
        setEditingAccount(account);
        setForm({
            email: account.email || '',
            username: account.username || '',
            full_name: account.full_name || '',
            role: account.role || 'user',
            is_active: Boolean(account.is_active),
            password: '',
            confirmPassword: '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const updateSystemSection = (section, key, value) => {
        setSystemSettings((current) => ({
            ...current,
            [section]: {
                ...current[section],
                [key]: value,
            },
        }));
    };

    const validateUrl = (value, label) => {
        if (!value) return '';
        try {
            const parsed = new URL(value);
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return `${label} must use http or https.`;
            }
        } catch {
            return `${label} must be a valid URL.`;
        }
        return '';
    };

    const submitSystemSettings = async (event) => {
        event.preventDefault();
        setSettingsSaving(true);
        setSettingsError('');

        const ai = systemSettings.ai_model_settings;
        const search = systemSettings.search_settings;

        if (!ai.provider.trim()) {
            setSettingsError('AI provider is required.');
            setSettingsSaving(false);
            return;
        }
        if (!ai.generation_model.trim()) {
            setSettingsError('Generation model is required.');
            setSettingsSaving(false);
            return;
        }
        if (!ai.rewrite_model.trim()) {
            setSettingsError('Rewrite model is required.');
            setSettingsSaving(false);
            return;
        }
        if (!ai.rerank_model.trim()) {
            setSettingsError('Rerank model is required.');
            setSettingsSaving(false);
            return;
        }
        if (ai.temperature < 0 || ai.temperature > 2) {
            setSettingsError('Temperature must be between 0 and 2.');
            setSettingsSaving(false);
            return;
        }
        if (ai.top_p <= 0 || ai.top_p > 1) {
            setSettingsError('Top-p must be greater than 0 and at most 1.');
            setSettingsSaving(false);
            return;
        }
        if (search.result_limit < 1 || search.result_limit > 50) {
            setSettingsError('Result limit must be between 1 and 50.');
            setSettingsSaving(false);
            return;
        }
        if (search.rerank_top_k < 1 || search.rerank_top_k > 50) {
            setSettingsError('Rerank top-k must be between 1 and 50.');
            setSettingsSaving(false);
            return;
        }
        if (search.distance_threshold < 0 || search.distance_threshold > 5) {
            setSettingsError('Distance threshold must be between 0 and 5.');
            setSettingsSaving(false);
            return;
        }

        // Validate DATABASE_URL format if provided
        if (systemSettings.environment_config.database_url) {
            const dbUrlError = validateUrl(systemSettings.environment_config.database_url, 'Database URL');
            if (dbUrlError) {
                setSettingsError(dbUrlError);
                setSettingsSaving(false);
                return;
            }
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/system-settings/`, {
                method: 'PATCH',
                headers: apiHeaders(true),
                body: JSON.stringify(systemSettings),
            });

            const data = await parseApiResponse(response, 'Unable to save account.');
            if (!response.ok || !data.success) {
                const errors = data.errors
                    ? Object.values(data.errors).flat().join(' ')
                    : data.message || 'Unable to save system settings.';
                throw new Error(errors);
            }

            setSettingsUpdatedAt(data.settings?.updated_at || settingsUpdatedAt);
            setSystemSettings(normalizeSystemSettings(data.settings || systemSettings));
            showToast('success', 'System settings updated.');
            await loadSettings();
        } catch (error) {
            setSettingsError(error.message || 'Unable to save system settings.');
        } finally {
            setSettingsSaving(false);
        }
    };

    const filteredAccounts = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        return accounts.filter((account) => {
            const matchesSearch = !normalizedSearch || [account.full_name, account.username, account.email]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(normalizedSearch));
            const matchesRole = roleFilter === 'all' || account.role === roleFilter;
            const matchesStatus = statusFilter === 'all'
                || (statusFilter === 'active' && account.is_active)
                || (statusFilter === 'inactive' && !account.is_active);

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [accounts, roleFilter, searchTerm, statusFilter]);

    const metrics = useMemo(() => {
        const total = accounts.length;
        const active = accounts.filter((account) => account.is_active).length;
        const admins = accounts.filter((account) => account.role === 'admin').length;
        const staff = accounts.filter((account) => account.role === 'staff').length;

        return { total, active, admins, staff };
    }, [accounts]);

    const submitForm = async (event) => {
        event.preventDefault();
        setSaving(true);
        setPageError('');

        const isCreateMode = !editingAccount;
        if (form.password) {
            const passwordError = validatePasswordStrength(form.password);
            if (passwordError) {
                setPageError(passwordError);
                setSaving(false);
                return;
            }
            if (form.password !== form.confirmPassword) {
                setPageError('Password confirmation does not match.');
                setSaving(false);
                return;
            }
        } else if (isCreateMode) {
            setPageError('Password is required when creating a new account.');
            setSaving(false);
            return;
        }

        const payload = {
            email: form.email.trim().toLowerCase(),
            username: form.username.trim(),
            full_name: form.full_name.trim(),
            role: form.role,
            is_active: form.is_active,
        };

        if (form.password) {
            payload.password = form.password;
        }

        try {
            const response = await fetch(
                isCreateMode
                    ? `${API_BASE_URL}/admin/user-accounts/`
                    : `${API_BASE_URL}/admin/user-accounts/${editingAccount.id}/`,
                {
                    method: isCreateMode ? 'POST' : 'PATCH',
                    headers: apiHeaders(true),
                    body: JSON.stringify(payload),
                }
            );

            const data = await parseApiResponse(response, 'Unable to update account status.');
            if (!response.ok || !data.success) {
                const errors = data.errors
                    ? Object.values(data.errors).flat().join(' ')
                    : data.message || 'Unable to save account.';
                throw new Error(errors);
            }

            showToast('success', isCreateMode ? 'User account created.' : 'User account updated.');
            closeModal();
            await loadAccounts();
        } catch (error) {
            setPageError(error.message || 'Unable to save account.');
        } finally {
            setSaving(false);
        }
    };

    const toggleAccountState = async (account) => {
        if (!window.confirm(`${account.is_active ? 'Deactivate' : 'Reactivate'} ${account.username}?`)) {
            return;
        }

        setSaving(true);
        setPageError('');

        try {
            const response = await fetch(`${API_BASE_URL}/admin/user-accounts/${account.id}/`, {
                method: 'PATCH',
                headers: apiHeaders(true),
                body: JSON.stringify({ is_active: !account.is_active }),
            });

            const data = await parseApiResponse(response, 'Unable to save system settings.');
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to update account status.');
            }

            showToast('success', account.is_active ? 'Account deactivated.' : 'Account reactivated.');
            await loadAccounts();
        } catch (error) {
            setPageError(error.message || 'Unable to update account status.');
        } finally {
            setSaving(false);
        }
    };

    const resetStructureForm = () => {
        setStructureForm(emptyStructureForm);
        setEditingStructureId(null);
    };

    const resetBackupForm = () => {
        setBackupForm(emptyBackupForm);
        setEditingBackupId(null);
    };

    const editStructure = (record) => {
        setEditingStructureId(record.id);
        setStructureForm({
            name: record.name || '',
            schema_version: record.schema_version || '',
            migration_label: record.migration_label || '',
            change_summary: record.change_summary || '',
            rollback_script: record.rollback_script || '',
            applied_at: record.applied_at ? new Date(record.applied_at).toISOString().slice(0, 16) : '',
            is_current: Boolean(record.is_current),
        });
    };

    const editBackup = (record) => {
        setEditingBackupId(record.id);
        setBackupForm({
            name: record.name || '',
            backup_type: record.backup_type || 'full',
            target_environment: record.target_environment || '',
            storage_location: record.storage_location || '',
            retention_days: Number(record.retention_days || 30),
            size_mb: record.size_mb ?? '',
            status: record.status || 'planned',
            notes: record.notes || '',
            backup_started_at: record.backup_started_at ? new Date(record.backup_started_at).toISOString().slice(0, 16) : '',
            backup_completed_at: record.backup_completed_at ? new Date(record.backup_completed_at).toISOString().slice(0, 16) : '',
        });
    };

    const submitStructure = async (event) => {
        event.preventDefault();
        setDatabaseSaving(true);
        setDatabaseError('');

        try {
            const payload = {
                ...structureForm,
                applied_at: structureForm.applied_at ? new Date(structureForm.applied_at).toISOString() : null,
            };

            const response = await fetch(
                editingStructureId
                    ? `${API_BASE_URL}/admin/database-structures/${editingStructureId}/`
                    : `${API_BASE_URL}/admin/database-structures/`,
                {
                    method: editingStructureId ? 'PATCH' : 'POST',
                    headers: apiHeaders(true),
                    body: JSON.stringify(payload),
                }
            );

            const data = await parseApiResponse(response, 'Unable to save structure record.');
            if (!response.ok || !data.success) {
                const errors = data.errors
                    ? Object.values(data.errors).flat().join(' ')
                    : data.message || 'Unable to save structure record.';
                throw new Error(errors);
            }

            showToast('success', editingStructureId ? 'Structure record updated.' : 'Structure record created.');
            resetStructureForm();
            await loadDatabaseAdminData();
        } catch (error) {
            setDatabaseError(error.message || 'Unable to save structure record.');
        } finally {
            setDatabaseSaving(false);
        }
    };

    const submitBackup = async (event) => {
        event.preventDefault();
        setDatabaseSaving(true);
        setDatabaseError('');

        try {
            const payload = {
                ...backupForm,
                retention_days: Number(backupForm.retention_days),
                size_mb: backupForm.size_mb === '' ? null : Number(backupForm.size_mb),
                backup_started_at: backupForm.backup_started_at ? new Date(backupForm.backup_started_at).toISOString() : null,
                backup_completed_at: backupForm.backup_completed_at ? new Date(backupForm.backup_completed_at).toISOString() : null,
            };

            const response = await fetch(
                editingBackupId
                    ? `${API_BASE_URL}/admin/database-backups/${editingBackupId}/`
                    : `${API_BASE_URL}/admin/database-backups/`,
                {
                    method: editingBackupId ? 'PATCH' : 'POST',
                    headers: apiHeaders(true),
                    body: JSON.stringify(payload),
                }
            );

            const data = await parseApiResponse(response, 'Unable to save backup record.');
            if (!response.ok || !data.success) {
                const errors = data.errors
                    ? Object.values(data.errors).flat().join(' ')
                    : data.message || 'Unable to save backup record.';
                throw new Error(errors);
            }

            showToast('success', editingBackupId ? 'Backup record updated.' : 'Backup record created.');
            resetBackupForm();
            await loadDatabaseAdminData();
        } catch (error) {
            setDatabaseError(error.message || 'Unable to save backup record.');
        } finally {
            setDatabaseSaving(false);
        }
    };

    const deleteStructure = async (recordId) => {
        if (!window.confirm('Delete this structure record?')) return;

        setDatabaseSaving(true);
        setDatabaseError('');
        try {
            const response = await fetch(`${API_BASE_URL}/admin/database-structures/${recordId}/`, {
                method: 'DELETE',
                headers: apiHeaders(true),
            });
            const data = await parseApiResponse(response, 'Unable to delete structure record.');
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to delete structure record.');
            }
            showToast('success', 'Structure record deleted.');
            await loadDatabaseAdminData();
        } catch (error) {
            setDatabaseError(error.message || 'Unable to delete structure record.');
        } finally {
            setDatabaseSaving(false);
        }
    };

    const deleteBackup = async (recordId) => {
        if (!window.confirm('Delete this backup record?')) return;

        setDatabaseSaving(true);
        setDatabaseError('');
        try {
            const response = await fetch(`${API_BASE_URL}/admin/database-backups/${recordId}/`, {
                method: 'DELETE',
                headers: apiHeaders(true),
            });
            const data = await parseApiResponse(response, 'Unable to delete backup record.');
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to delete backup record.');
            }
            showToast('success', 'Backup record deleted.');
            await loadDatabaseAdminData();
        } catch (error) {
            setDatabaseError(error.message || 'Unable to delete backup record.');
        } finally {
            setDatabaseSaving(false);
        }
    };

    const resetSecurityPolicyForm = () => {
        setSecurityPolicyForm(emptySecurityPolicyForm);
        setEditingSecurityPolicyId(null);
    };

    const resetSecurityAccessRuleForm = () => {
        setSecurityAccessRuleForm(emptySecurityAccessRuleForm);
        setEditingSecurityAccessRuleId(null);
    };

    const resetSecurityAuditLogForm = () => {
        setSecurityAuditLogForm(emptySecurityAuditLogForm);
        setEditingSecurityAuditLogId(null);
    };

    const editSecurityPolicy = (record) => {
        setEditingSecurityPolicyId(record.id);
        setSecurityPolicyForm({
            name: record.name || '',
            authentication_mode: record.authentication_mode || 'password_mfa',
            password_min_length: Number(record.password_min_length || 12),
            password_history_count: Number(record.password_history_count || 5),
            session_timeout_minutes: Number(record.session_timeout_minutes || 60),
            max_failed_attempts: Number(record.max_failed_attempts || 5),
            lockout_minutes: Number(record.lockout_minutes || 15),
            require_mfa: Boolean(record.require_mfa),
            is_active: Boolean(record.is_active),
            notes: record.notes || '',
        });
    };

    const editSecurityAccessRule = (record) => {
        setEditingSecurityAccessRuleId(record.id);
        setSecurityAccessRuleForm({
            name: record.name || '',
            subject_type: record.subject_type || 'role',
            subject_name: record.subject_name || '',
            resource_name: record.resource_name || '',
            permission_level: record.permission_level || 'read',
            scope: record.scope || '',
            conditions: record.conditions || '',
            is_active: Boolean(record.is_active),
            notes: record.notes || '',
        });
    };

    const editSecurityAuditLog = (record) => {
        setEditingSecurityAuditLogId(record.id);
        setSecurityAuditLogForm({
            event_type: record.event_type || 'manual_note',
            actor_label: record.actor_label || '',
            target_label: record.target_label || '',
            action_summary: record.action_summary || '',
            severity: record.severity || 'info',
            outcome: record.outcome || 'success',
            ip_address: record.ip_address || '',
            occurred_at: record.occurred_at ? new Date(record.occurred_at).toISOString().slice(0, 16) : '',
            notes: record.notes || '',
        });
    };

    const submitSecurityPolicy = async (event) => {
        event.preventDefault();
        setSecuritySaving(true);
        setSecurityError('');

        try {
            const response = await fetch(
                editingSecurityPolicyId
                    ? `${API_BASE_URL}/admin/security-authentication-policies/${editingSecurityPolicyId}/`
                    : `${API_BASE_URL}/admin/security-authentication-policies/`,
                {
                    method: editingSecurityPolicyId ? 'PATCH' : 'POST',
                    headers: apiHeaders(true),
                    body: JSON.stringify({
                        ...securityPolicyForm,
                        password_min_length: Number(securityPolicyForm.password_min_length),
                        password_history_count: Number(securityPolicyForm.password_history_count),
                        session_timeout_minutes: Number(securityPolicyForm.session_timeout_minutes),
                        max_failed_attempts: Number(securityPolicyForm.max_failed_attempts),
                        lockout_minutes: Number(securityPolicyForm.lockout_minutes),
                    }),
                }
            );

            const data = await parseApiResponse(response, 'Unable to save authentication policy.');
            if (!response.ok || !data.success) {
                const errors = data.errors
                    ? Object.values(data.errors).flat().join(' ')
                    : data.message || 'Unable to save authentication policy.';
                throw new Error(errors);
            }

            showToast('success', editingSecurityPolicyId ? 'Authentication policy updated.' : 'Authentication policy created.');
            resetSecurityPolicyForm();
            await loadSecurityAdminData();
        } catch (error) {
            setSecurityError(error.message || 'Unable to save authentication policy.');
        } finally {
            setSecuritySaving(false);
        }
    };

    const submitSecurityAccessRule = async (event) => {
        event.preventDefault();
        setSecuritySaving(true);
        setSecurityError('');

        try {
            const response = await fetch(
                editingSecurityAccessRuleId
                    ? `${API_BASE_URL}/admin/security-access-control-rules/${editingSecurityAccessRuleId}/`
                    : `${API_BASE_URL}/admin/security-access-control-rules/`,
                {
                    method: editingSecurityAccessRuleId ? 'PATCH' : 'POST',
                    headers: apiHeaders(true),
                    body: JSON.stringify(securityAccessRuleForm),
                }
            );

            const data = await parseApiResponse(response, 'Unable to save access control rule.');
            if (!response.ok || !data.success) {
                const errors = data.errors
                    ? Object.values(data.errors).flat().join(' ')
                    : data.message || 'Unable to save access control rule.';
                throw new Error(errors);
            }

            showToast('success', editingSecurityAccessRuleId ? 'Access control rule updated.' : 'Access control rule created.');
            resetSecurityAccessRuleForm();
            await loadSecurityAdminData();
        } catch (error) {
            setSecurityError(error.message || 'Unable to save access control rule.');
        } finally {
            setSecuritySaving(false);
        }
    };

    const submitSecurityAuditLog = async (event) => {
        event.preventDefault();
        setSecuritySaving(true);
        setSecurityError('');

        try {
            const payload = {
                ...securityAuditLogForm,
                occurred_at: securityAuditLogForm.occurred_at ? new Date(securityAuditLogForm.occurred_at).toISOString() : undefined,
            };

            const response = await fetch(
                editingSecurityAuditLogId
                    ? `${API_BASE_URL}/admin/security-audit-logs/${editingSecurityAuditLogId}/`
                    : `${API_BASE_URL}/admin/security-audit-logs/`,
                {
                    method: editingSecurityAuditLogId ? 'PATCH' : 'POST',
                    headers: apiHeaders(true),
                    body: JSON.stringify(payload),
                }
            );

            const data = await parseApiResponse(response, 'Unable to save audit log entry.');
            if (!response.ok || !data.success) {
                const errors = data.errors
                    ? Object.values(data.errors).flat().join(' ')
                    : data.message || 'Unable to save audit log entry.';
                throw new Error(errors);
            }

            showToast('success', editingSecurityAuditLogId ? 'Audit log entry updated.' : 'Audit log entry created.');
            resetSecurityAuditLogForm();
            await loadSecurityAdminData();
        } catch (error) {
            setSecurityError(error.message || 'Unable to save audit log entry.');
        } finally {
            setSecuritySaving(false);
        }
    };

    const deleteSecurityPolicy = async (recordId) => {
        if (!window.confirm('Delete this authentication policy?')) return;

        setSecuritySaving(true);
        setSecurityError('');
        try {
            const response = await fetch(`${API_BASE_URL}/admin/security-authentication-policies/${recordId}/`, {
                method: 'DELETE',
                headers: apiHeaders(true),
            });
            const data = await parseApiResponse(response, 'Unable to delete authentication policy.');
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to delete authentication policy.');
            }
            showToast('success', 'Authentication policy deleted.');
            await loadSecurityAdminData();
        } catch (error) {
            setSecurityError(error.message || 'Unable to delete authentication policy.');
        } finally {
            setSecuritySaving(false);
        }
    };

    const deleteSecurityAccessRule = async (recordId) => {
        if (!window.confirm('Delete this access control rule?')) return;

        setSecuritySaving(true);
        setSecurityError('');
        try {
            const response = await fetch(`${API_BASE_URL}/admin/security-access-control-rules/${recordId}/`, {
                method: 'DELETE',
                headers: apiHeaders(true),
            });
            const data = await parseApiResponse(response, 'Unable to delete access control rule.');
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to delete access control rule.');
            }
            showToast('success', 'Access control rule deleted.');
            await loadSecurityAdminData();
        } catch (error) {
            setSecurityError(error.message || 'Unable to delete access control rule.');
        } finally {
            setSecuritySaving(false);
        }
    };

    const deleteSecurityAuditLog = async (recordId) => {
        if (!window.confirm('Delete this audit log entry?')) return;

        setSecuritySaving(true);
        setSecurityError('');
        try {
            const response = await fetch(`${API_BASE_URL}/admin/security-audit-logs/${recordId}/`, {
                method: 'DELETE',
                headers: apiHeaders(true),
            });
            const data = await parseApiResponse(response, 'Unable to delete audit log entry.');
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Unable to delete audit log entry.');
            }
            showToast('success', 'Audit log entry deleted.');
            await loadSecurityAdminData();
        } catch (error) {
            setSecurityError(error.message || 'Unable to delete audit log entry.');
        } finally {
            setSecuritySaving(false);
        }
    };

    const passwordChecks = getPasswordRequirementChecks(form.password || '');
    const configuredIntegrations = Object.values(systemSettings.environment_config || {}).filter(Boolean).length;
    const currentStructure = databaseStructures.find((record) => record.is_current);
    const completedBackups = backupRecords.filter((record) => record.status === 'completed').length;
    const activeSecurityPolicies = securityPolicies.filter((record) => record.is_active).length;
    const activeAccessRules = securityAccessRules.filter((record) => record.is_active).length;
    const criticalAuditEvents = securityAuditLogs.filter((record) => record.severity === 'critical').length;

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef2ff_38%,_#e2e8f0_100%)] text-slate-900">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur">
                    <div className="flex flex-col gap-6 border-b border-slate-200/70 p-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">System Console</p>
                            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">IT Administrator</h1>
                            <p className="mt-3 max-w-3xl text-sm text-slate-600">
                                Manage user accounts, assign roles, reset access, and control activation from a single admin surface.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Signed in as</p>
                                <p className="text-sm font-semibold text-slate-900">{user?.full_name || user?.username || 'IT Administrator'}</p>
                                <p className="text-xs text-slate-500">{getRoleLabel(user?.role)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={logout}
                                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    </div>

                    <div className="border-b border-slate-200/70 bg-white px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === tab.key
                                        ? 'bg-slate-900 text-white'
                                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border-b border-slate-200/70 bg-slate-50/60 px-6 py-4">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                            {activeTab === 'accounts' ? (
                                <>
                                    <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
                                        <Users className="h-4 w-4 text-slate-400" />
                                        Total {metrics.total}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="inline-flex items-center gap-2 font-semibold text-emerald-800">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        Active {metrics.active}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="inline-flex items-center gap-2 font-semibold text-rose-800">
                                        <ShieldCheck className="h-4 w-4 text-rose-600" />
                                        IT admins {metrics.admins}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="inline-flex items-center gap-2 font-semibold text-sky-800">
                                        <UserRoundCog className="h-4 w-4 text-sky-600" />
                                        Library admins {metrics.staff}
                                    </span>
                                </>
                            ) : activeTab === 'database' ? (
                                <>
                                    <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
                                        <Database className="h-4 w-4 text-slate-400" />
                                        Structures {databaseStructures.length}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="inline-flex items-center gap-2 font-semibold text-sky-800">
                                        <HardDriveDownload className="h-4 w-4 text-sky-600" />
                                        Backups {backupRecords.length}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="inline-flex items-center gap-2 font-semibold text-emerald-800">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        Completed {completedBackups}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="font-semibold text-slate-700">
                                        Current schema: {currentStructure?.schema_version || 'Not set'}
                                    </span>
                                </>
                            ) : activeTab === 'security' ? (
                                <>
                                    <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
                                        <ShieldCheck className="h-4 w-4 text-slate-400" />
                                        Policies {securityPolicies.length}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="inline-flex items-center gap-2 font-semibold text-emerald-800">
                                        <KeyRound className="h-4 w-4 text-emerald-600" />
                                        Active policies {activeSecurityPolicies}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="inline-flex items-center gap-2 font-semibold text-sky-800">
                                        <UserRoundCog className="h-4 w-4 text-sky-600" />
                                        Access rules {securityAccessRules.length}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="inline-flex items-center gap-2 font-semibold text-emerald-800">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        Active rules {activeAccessRules}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="inline-flex items-center gap-2 font-semibold text-rose-800">
                                        <AlertCircle className="h-4 w-4 text-rose-600" />
                                        Critical events {criticalAuditEvents}
                                    </span>
                                </>
                            ) : (
                                <span className="font-semibold text-slate-700">System settings administration</span>
                            )}
                        </div>
                    </div>

                    <div className="p-6">
                        {activeTab === 'accounts' ? (
                            <>
                                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight text-slate-900">Manage User Accounts</h2>
                                        <p className="mt-1 text-sm text-slate-600">Create, edit, deactivate, and assign roles for every registered account.</p>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={loadAccounts}
                                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                            Refresh
                                        </button>
                                        <button
                                            type="button"
                                            onClick={openCreateModal}
                                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                                        >
                                            <UserRoundPlus className="h-4 w-4" />
                                            Add user
                                        </button>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-3">
                                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                                        <Search className="h-4 w-4 text-slate-400" />
                                        <input
                                            value={searchTerm}
                                            onChange={(event) => setSearchTerm(event.target.value)}
                                            placeholder="Search by name, email, or username"
                                            className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                                        />
                                    </label>
                                    <select
                                        value={roleFilter}
                                        onChange={(event) => setRoleFilter(event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none"
                                    >
                                        <option value="all">All roles</option>
                                        {roleOptions.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={statusFilter}
                                        onChange={(event) => setStatusFilter(event.target.value)}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none"
                                    >
                                        <option value="all">All statuses</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                        {pageError ? (
                            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{pageError}</span>
                            </div>
                        ) : null}

                                <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                                    {loading ? (
                                        <div className="flex min-h-[280px] items-center justify-center">
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Loading user accounts...
                                            </div>
                                        </div>
                                    ) : filteredAccounts.length === 0 ? (
                                        <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
                                            <div className="rounded-full bg-slate-100 p-4 text-slate-500">
                                                <Users className="h-8 w-8" />
                                            </div>
                                            <h3 className="mt-4 text-lg font-bold text-slate-900">No matching accounts</h3>
                                            <p className="mt-2 max-w-md text-sm text-slate-500">
                                                Adjust your filters or create a new user account to start populating the table.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                                                    <tr>
                                                        <th className="px-6 py-4">User</th>
                                                        <th className="px-6 py-4">Role</th>
                                                        <th className="px-6 py-4">Status</th>
                                                        <th className="px-6 py-4">Created</th>
                                                        <th className="px-6 py-4">Last login</th>
                                                        <th className="px-6 py-4 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {filteredAccounts.map((account) => {
                                                        const isSelf = String(user?.id) === String(account.id);
                                                        return (
                                                            <tr key={account.id} className="transition hover:bg-slate-50/70">
                                                                <td className="px-6 py-5 align-top">
                                                                    <div className="flex items-start gap-4">
                                                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                                                                            {(account.full_name || account.username || '?').slice(0, 1).toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-bold text-slate-900">{account.full_name || 'Unnamed user'}</p>
                                                                            <p className="text-sm text-slate-500">@{account.username}</p>
                                                                            <p className="text-sm text-slate-500">{account.email}</p>
                                                                            {isSelf ? (
                                                                                <span className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                                                    Current account
                                                                                </span>
                                                                            ) : null}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5 align-top">
                                                                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getBadgeClasses(account.role, account.is_active)}`}>
                                                                        {account.role_label || getRoleLabel(account.role)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-5 align-top">
                                                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${account.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                                                                        {account.is_active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                                                        {account.is_active ? 'Active' : 'Inactive'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-5 align-top text-sm text-slate-600">{formatDateTime(account.created_at)}</td>
                                                                <td className="px-6 py-5 align-top text-sm text-slate-600">{formatDateTime(account.last_login)}</td>
                                                                <td className="px-6 py-5 align-top">
                                                                    <div className="flex justify-end gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openEditModal(account)}
                                                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                                                        >
                                                                            <Edit2 className="h-4 w-4" />
                                                                            Edit
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleAccountState(account)}
                                                                            disabled={saving || isSelf}
                                                                            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${account.is_active ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100 disabled:opacity-60' : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-60'}`}
                                                                        >
                                                                            {account.is_active ? <UserX className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                                                            {account.is_active ? 'Deactivate' : 'Reactivate'}
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : activeTab === 'database' ? (
                            <>
                                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight text-slate-900">Manage Database Structure and Backups</h2>
                                        <p className="mt-1 text-sm text-slate-600">
                                            Maintain schema history records and backup lifecycle entries from one operational console.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={loadDatabaseAdminData}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${databaseLoading ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </button>
                                </div>

                                {databaseError ? (
                                    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                        <span>{databaseError}</span>
                                    </div>
                                ) : null}

                                {databaseLoading ? (
                                    <div className="mt-2 flex min-h-[320px] items-center justify-center rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Loading database records...
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid gap-6 xl:grid-cols-2">
                                        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                                            <div className="mb-4">
                                                <h3 className="text-lg font-black tracking-tight text-slate-900">Database Structure Registry</h3>
                                                <p className="mt-1 text-sm text-slate-600">Track schema versions, migration labels, and rollback notes.</p>
                                            </div>

                                            <form onSubmit={submitStructure} className="grid gap-3">
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <input
                                                        value={structureForm.name}
                                                        onChange={(event) => setStructureForm({ ...structureForm, name: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="Record name"
                                                        required
                                                    />
                                                    <input
                                                        value={structureForm.schema_version}
                                                        onChange={(event) => setStructureForm({ ...structureForm, schema_version: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="Schema version"
                                                        required
                                                    />
                                                </div>
                                                <input
                                                    value={structureForm.migration_label}
                                                    onChange={(event) => setStructureForm({ ...structureForm, migration_label: event.target.value })}
                                                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                    placeholder="Migration label (optional)"
                                                />
                                                <textarea
                                                    value={structureForm.change_summary}
                                                    onChange={(event) => setStructureForm({ ...structureForm, change_summary: event.target.value })}
                                                    className="min-h-[90px] rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                    placeholder="Change summary"
                                                />
                                                <textarea
                                                    value={structureForm.rollback_script}
                                                    onChange={(event) => setStructureForm({ ...structureForm, rollback_script: event.target.value })}
                                                    className="min-h-[90px] rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                    placeholder="Rollback script notes"
                                                />
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <input
                                                        type="datetime-local"
                                                        value={structureForm.applied_at}
                                                        onChange={(event) => setStructureForm({ ...structureForm, applied_at: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                    />
                                                    <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                                                        Mark as current schema
                                                        <input
                                                            type="checkbox"
                                                            checked={structureForm.is_current}
                                                            onChange={(event) => setStructureForm({ ...structureForm, is_current: event.target.checked })}
                                                            className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                                        />
                                                    </label>
                                                </div>

                                                <div className="flex flex-wrap justify-end gap-2">
                                                    {editingStructureId ? (
                                                        <button
                                                            type="button"
                                                            onClick={resetStructureForm}
                                                            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                                        >
                                                            Cancel edit
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        type="submit"
                                                        disabled={databaseSaving}
                                                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                                                    >
                                                        {databaseSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                        {editingStructureId ? 'Update record' : 'Create record'}
                                                    </button>
                                                </div>
                                            </form>

                                            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                                                {databaseStructures.length === 0 ? (
                                                    <div className="flex min-h-[180px] flex-col items-center justify-center px-6 py-10 text-center">
                                                        <div className="rounded-full bg-slate-100 p-3 text-slate-500">
                                                            <Database className="h-6 w-6" />
                                                        </div>
                                                        <h4 className="mt-4 text-base font-bold text-slate-900">No database structure records yet</h4>
                                                        <p className="mt-1 max-w-md text-sm text-slate-500">
                                                            Create the first schema entry to start tracking version history, migration labels, and rollback notes.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                                        <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                                            <tr>
                                                                <th className="px-4 py-3">Version</th>
                                                                <th className="px-4 py-3">Migration</th>
                                                                <th className="px-4 py-3">Current</th>
                                                                <th className="px-4 py-3 text-right">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 bg-white">
                                                            {databaseStructures.map((record) => (
                                                                <tr key={record.id}>
                                                                    <td className="px-4 py-3">
                                                                        <p className="font-semibold text-slate-900">{record.schema_version}</p>
                                                                        <p className="text-xs text-slate-500">{record.name}</p>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-slate-600">{record.migration_label || '-'}</td>
                                                                    <td className="px-4 py-3">
                                                                        {record.is_current ? (
                                                                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Current</span>
                                                                        ) : (
                                                                            <span className="text-xs text-slate-500">No</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex justify-end gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => editStructure(record)}
                                                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                                            >
                                                                                <Edit2 className="h-3.5 w-3.5" />
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => deleteStructure(record.id)}
                                                                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                                                            >
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </section>

                                        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                                            <div className="mb-4">
                                                <h3 className="text-lg font-black tracking-tight text-slate-900">Backup Lifecycle Records</h3>
                                                <p className="mt-1 text-sm text-slate-600">Define and update backup policies, targets, and execution states.</p>
                                            </div>

                                            <form onSubmit={submitBackup} className="grid gap-3">
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <input
                                                        value={backupForm.name}
                                                        onChange={(event) => setBackupForm({ ...backupForm, name: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="Backup name"
                                                        required
                                                    />
                                                    <select
                                                        value={backupForm.backup_type}
                                                        onChange={(event) => setBackupForm({ ...backupForm, backup_type: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none"
                                                    >
                                                        <option value="full">Full</option>
                                                        <option value="incremental">Incremental</option>
                                                        <option value="schema">Schema only</option>
                                                    </select>
                                                </div>
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <input
                                                        value={backupForm.target_environment}
                                                        onChange={(event) => setBackupForm({ ...backupForm, target_environment: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="Environment (prod/staging/local)"
                                                    />
                                                    <input
                                                        value={backupForm.storage_location}
                                                        onChange={(event) => setBackupForm({ ...backupForm, storage_location: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="Storage location"
                                                        required
                                                    />
                                                </div>
                                                <div className="grid gap-3 sm:grid-cols-3">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="3650"
                                                        value={backupForm.retention_days}
                                                        onChange={(event) => setBackupForm({ ...backupForm, retention_days: Number(event.target.value) })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="Retention days"
                                                    />
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={backupForm.size_mb}
                                                        onChange={(event) => setBackupForm({ ...backupForm, size_mb: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="Size (MB)"
                                                    />
                                                    <select
                                                        value={backupForm.status}
                                                        onChange={(event) => setBackupForm({ ...backupForm, status: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none"
                                                    >
                                                        <option value="planned">Planned</option>
                                                        <option value="running">Running</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="failed">Failed</option>
                                                    </select>
                                                </div>
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <input
                                                        type="datetime-local"
                                                        value={backupForm.backup_started_at}
                                                        onChange={(event) => setBackupForm({ ...backupForm, backup_started_at: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                    />
                                                    <input
                                                        type="datetime-local"
                                                        value={backupForm.backup_completed_at}
                                                        onChange={(event) => setBackupForm({ ...backupForm, backup_completed_at: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                    />
                                                </div>
                                                <textarea
                                                    value={backupForm.notes}
                                                    onChange={(event) => setBackupForm({ ...backupForm, notes: event.target.value })}
                                                    className="min-h-[90px] rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                    placeholder="Notes"
                                                />

                                                <div className="flex flex-wrap justify-end gap-2">
                                                    {editingBackupId ? (
                                                        <button
                                                            type="button"
                                                            onClick={resetBackupForm}
                                                            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                                        >
                                                            Cancel edit
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        type="submit"
                                                        disabled={databaseSaving}
                                                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                                                    >
                                                        {databaseSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                        {editingBackupId ? 'Update record' : 'Create record'}
                                                    </button>
                                                </div>
                                            </form>

                                            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                                                {backupRecords.length === 0 ? (
                                                    <div className="flex min-h-[180px] flex-col items-center justify-center px-6 py-10 text-center">
                                                        <div className="rounded-full bg-slate-100 p-3 text-slate-500">
                                                            <HardDriveDownload className="h-6 w-6" />
                                                        </div>
                                                        <h4 className="mt-4 text-base font-bold text-slate-900">No backup records yet</h4>
                                                        <p className="mt-1 max-w-md text-sm text-slate-500">
                                                            Create the first backup entry to document your backup plan, retention policy, and execution status.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                                        <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                                            <tr>
                                                                <th className="px-4 py-3">Backup</th>
                                                                <th className="px-4 py-3">Type</th>
                                                                <th className="px-4 py-3">Status</th>
                                                                <th className="px-4 py-3 text-right">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 bg-white">
                                                            {backupRecords.map((record) => (
                                                                <tr key={record.id}>
                                                                    <td className="px-4 py-3">
                                                                        <p className="font-semibold text-slate-900">{record.name}</p>
                                                                        <p className="text-xs text-slate-500">{record.storage_location}</p>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-slate-600">{record.backup_type}</td>
                                                                    <td className="px-4 py-3">
                                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${record.status === 'completed' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : record.status === 'failed' ? 'border border-rose-200 bg-rose-50 text-rose-700' : 'border border-slate-200 bg-slate-50 text-slate-700'}`}>
                                                                            {record.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex justify-end gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => editBackup(record)}
                                                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                                            >
                                                                                <Edit2 className="h-3.5 w-3.5" />
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => deleteBackup(record.id)}
                                                                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                                                            >
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </section>
                                    </div>
                                )}
                            </>
                        ) : activeTab === 'security' ? (
                            <>
                                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight text-slate-900">Oversee System Security</h2>
                                        <p className="mt-1 text-sm text-slate-600">
                                            Manage authentication policies, access control rules, and audit trail entries from one security console.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={loadSecurityAdminData}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${securityLoading ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </button>
                                </div>

                                {securityError ? (
                                    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                        <span>{securityError}</span>
                                    </div>
                                ) : null}

                                {securityLoading ? (
                                    <div className="mt-2 flex min-h-[320px] items-center justify-center rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Loading security records...
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                                            <div className="mb-4">
                                                <h3 className="text-lg font-black tracking-tight text-slate-900">Authentication Policies</h3>
                                                <p className="mt-1 text-sm text-slate-600">Define password, MFA, session, and lockout posture for the system.</p>
                                            </div>

                                            <form onSubmit={submitSecurityPolicy} className="grid gap-3">
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <input
                                                        value={securityPolicyForm.name}
                                                        onChange={(event) => setSecurityPolicyForm({ ...securityPolicyForm, name: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="Policy name"
                                                        required
                                                    />
                                                    <select
                                                        value={securityPolicyForm.authentication_mode}
                                                        onChange={(event) => setSecurityPolicyForm({ ...securityPolicyForm, authentication_mode: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none"
                                                    >
                                                        <option value="password">Password only</option>
                                                        <option value="password_mfa">Password + MFA</option>
                                                        <option value="sso">Single sign-on</option>
                                                        <option value="hybrid">Hybrid</option>
                                                    </select>
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                                    <input
                                                        type="number"
                                                        min="8"
                                                        max="128"
                                                        value={securityPolicyForm.password_min_length}
                                                        onChange={(event) => setSecurityPolicyForm({ ...securityPolicyForm, password_min_length: Number(event.target.value) })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="Password length"
                                                    />
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="24"
                                                        value={securityPolicyForm.password_history_count}
                                                        onChange={(event) => setSecurityPolicyForm({ ...securityPolicyForm, password_history_count: Number(event.target.value) })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="History count"
                                                    />
                                                    <input
                                                        type="number"
                                                        min="5"
                                                        max="1440"
                                                        value={securityPolicyForm.session_timeout_minutes}
                                                        onChange={(event) => setSecurityPolicyForm({ ...securityPolicyForm, session_timeout_minutes: Number(event.target.value) })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="Session timeout"
                                                    />
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="25"
                                                        value={securityPolicyForm.max_failed_attempts}
                                                        onChange={(event) => setSecurityPolicyForm({ ...securityPolicyForm, max_failed_attempts: Number(event.target.value) })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="Failed attempts"
                                                    />
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="1440"
                                                        value={securityPolicyForm.lockout_minutes}
                                                        onChange={(event) => setSecurityPolicyForm({ ...securityPolicyForm, lockout_minutes: Number(event.target.value) })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="Lockout minutes"
                                                    />
                                                    <div className="grid gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                                                        <label className="flex items-center justify-between gap-4 font-semibold">
                                                            Require MFA
                                                            <input
                                                                type="checkbox"
                                                                checked={securityPolicyForm.require_mfa}
                                                                onChange={(event) => setSecurityPolicyForm({ ...securityPolicyForm, require_mfa: event.target.checked })}
                                                                className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                                            />
                                                        </label>
                                                        <label className="flex items-center justify-between gap-4 font-semibold">
                                                            Policy active
                                                            <input
                                                                type="checkbox"
                                                                checked={securityPolicyForm.is_active}
                                                                onChange={(event) => setSecurityPolicyForm({ ...securityPolicyForm, is_active: event.target.checked })}
                                                                className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                                            />
                                                        </label>
                                                    </div>
                                                </div>

                                                <textarea
                                                    value={securityPolicyForm.notes}
                                                    onChange={(event) => setSecurityPolicyForm({ ...securityPolicyForm, notes: event.target.value })}
                                                    className="min-h-[90px] rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                    placeholder="Notes"
                                                />

                                                <div className="flex flex-wrap justify-end gap-2">
                                                    {editingSecurityPolicyId ? (
                                                        <button
                                                            type="button"
                                                            onClick={resetSecurityPolicyForm}
                                                            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                                        >
                                                            Cancel edit
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        type="submit"
                                                        disabled={securitySaving}
                                                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                                                    >
                                                        {securitySaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                        {editingSecurityPolicyId ? 'Update policy' : 'Create policy'}
                                                    </button>
                                                </div>
                                            </form>

                                            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                                                {securityPolicies.length === 0 ? (
                                                    <div className="flex min-h-[180px] flex-col items-center justify-center px-6 py-10 text-center">
                                                        <div className="rounded-full bg-slate-100 p-3 text-slate-500">
                                                            <ShieldCheck className="h-6 w-6" />
                                                        </div>
                                                        <h4 className="mt-4 text-base font-bold text-slate-900">No authentication policies yet</h4>
                                                        <p className="mt-1 max-w-md text-sm text-slate-500">
                                                            Add the first policy to define password, MFA, lockout, and session controls.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                                        <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                                            <tr>
                                                                <th className="px-4 py-3">Policy</th>
                                                                <th className="px-4 py-3">Mode</th>
                                                                <th className="px-4 py-3">Status</th>
                                                                <th className="px-4 py-3 text-right">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 bg-white">
                                                            {securityPolicies.map((record) => (
                                                                <tr key={record.id}>
                                                                    <td className="px-4 py-3">
                                                                        <p className="font-semibold text-slate-900">{record.name}</p>
                                                                        <p className="text-xs text-slate-500">
                                                                            Min length {record.password_min_length} · Timeout {record.session_timeout_minutes} min
                                                                        </p>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-slate-600">{formatChoiceLabel(record.authentication_mode)}</td>
                                                                    <td className="px-4 py-3">
                                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${record.is_active ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-slate-200 bg-slate-50 text-slate-700'}`}>
                                                                            {record.is_active ? 'Active' : 'Inactive'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex justify-end gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => editSecurityPolicy(record)}
                                                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                                            >
                                                                                <Edit2 className="h-3.5 w-3.5" />
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => deleteSecurityPolicy(record.id)}
                                                                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                                                            >
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </section>

                                        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                                            <div className="mb-4">
                                                <h3 className="text-lg font-black tracking-tight text-slate-900">Access Control Rules</h3>
                                                <p className="mt-1 text-sm text-slate-600">Set role, user, or group-based access rules for sensitive resources.</p>
                                            </div>

                                            <form onSubmit={submitSecurityAccessRule} className="grid gap-3">
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <input
                                                        value={securityAccessRuleForm.name}
                                                        onChange={(event) => setSecurityAccessRuleForm({ ...securityAccessRuleForm, name: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="Rule name"
                                                        required
                                                    />
                                                    <select
                                                        value={securityAccessRuleForm.subject_type}
                                                        onChange={(event) => setSecurityAccessRuleForm({ ...securityAccessRuleForm, subject_type: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none"
                                                    >
                                                        <option value="role">Role</option>
                                                        <option value="user">User</option>
                                                        <option value="group">Group</option>
                                                    </select>
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <input
                                                        value={securityAccessRuleForm.subject_name}
                                                        onChange={(event) => setSecurityAccessRuleForm({ ...securityAccessRuleForm, subject_name: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="Subject name"
                                                        required
                                                    />
                                                    <input
                                                        value={securityAccessRuleForm.resource_name}
                                                        onChange={(event) => setSecurityAccessRuleForm({ ...securityAccessRuleForm, resource_name: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="Resource name"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <select
                                                        value={securityAccessRuleForm.permission_level}
                                                        onChange={(event) => setSecurityAccessRuleForm({ ...securityAccessRuleForm, permission_level: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none"
                                                    >
                                                        <option value="read">Read</option>
                                                        <option value="write">Write</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                    <input
                                                        value={securityAccessRuleForm.scope}
                                                        onChange={(event) => setSecurityAccessRuleForm({ ...securityAccessRuleForm, scope: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="Scope (optional)"
                                                    />
                                                </div>

                                                <textarea
                                                    value={securityAccessRuleForm.conditions}
                                                    onChange={(event) => setSecurityAccessRuleForm({ ...securityAccessRuleForm, conditions: event.target.value })}
                                                    className="min-h-[90px] rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                    placeholder="Conditions"
                                                />

                                                <div className="grid gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 sm:grid-cols-2">
                                                    <label className="flex items-center justify-between gap-4 font-semibold">
                                                        Active rule
                                                        <input
                                                            type="checkbox"
                                                            checked={securityAccessRuleForm.is_active}
                                                            onChange={(event) => setSecurityAccessRuleForm({ ...securityAccessRuleForm, is_active: event.target.checked })}
                                                            className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                                        />
                                                    </label>
                                                    <label className="flex items-center justify-between gap-4 font-semibold">
                                                        Notes available
                                                        <span className="text-xs text-slate-500">Use notes for review context</span>
                                                    </label>
                                                </div>

                                                <textarea
                                                    value={securityAccessRuleForm.notes}
                                                    onChange={(event) => setSecurityAccessRuleForm({ ...securityAccessRuleForm, notes: event.target.value })}
                                                    className="min-h-[90px] rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                    placeholder="Notes"
                                                />

                                                <div className="flex flex-wrap justify-end gap-2">
                                                    {editingSecurityAccessRuleId ? (
                                                        <button
                                                            type="button"
                                                            onClick={resetSecurityAccessRuleForm}
                                                            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                                        >
                                                            Cancel edit
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        type="submit"
                                                        disabled={securitySaving}
                                                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                                                    >
                                                        {securitySaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                        {editingSecurityAccessRuleId ? 'Update rule' : 'Create rule'}
                                                    </button>
                                                </div>
                                            </form>

                                            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                                                {securityAccessRules.length === 0 ? (
                                                    <div className="flex min-h-[180px] flex-col items-center justify-center px-6 py-10 text-center">
                                                        <div className="rounded-full bg-slate-100 p-3 text-slate-500">
                                                            <UserRoundCog className="h-6 w-6" />
                                                        </div>
                                                        <h4 className="mt-4 text-base font-bold text-slate-900">No access control rules yet</h4>
                                                        <p className="mt-1 max-w-md text-sm text-slate-500">
                                                            Create rules for roles, users, or groups to document who can access each resource.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                                        <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                                            <tr>
                                                                <th className="px-4 py-3">Rule</th>
                                                                <th className="px-4 py-3">Subject</th>
                                                                <th className="px-4 py-3">Permission</th>
                                                                <th className="px-4 py-3 text-right">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 bg-white">
                                                            {securityAccessRules.map((record) => (
                                                                <tr key={record.id}>
                                                                    <td className="px-4 py-3">
                                                                        <p className="font-semibold text-slate-900">{record.name}</p>
                                                                        <p className="text-xs text-slate-500">{record.resource_name}{record.scope ? ` · ${record.scope}` : ''}</p>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-slate-600">
                                                                        {formatChoiceLabel(record.subject_type)}: {record.subject_name}
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${record.permission_level === 'admin' ? 'border border-rose-200 bg-rose-50 text-rose-700' : record.permission_level === 'write' ? 'border border-amber-200 bg-amber-50 text-amber-700' : 'border border-sky-200 bg-sky-50 text-sky-700'}`}>
                                                                            {formatChoiceLabel(record.permission_level)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex justify-end gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => editSecurityAccessRule(record)}
                                                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                                            >
                                                                                <Edit2 className="h-3.5 w-3.5" />
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => deleteSecurityAccessRule(record.id)}
                                                                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                                                            >
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </section>

                                        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                                            <div className="mb-4">
                                                <h3 className="text-lg font-black tracking-tight text-slate-900">Audit Log Entries</h3>
                                                <p className="mt-1 text-sm text-slate-600">Record security events for authentication, role changes, and access actions.</p>
                                            </div>

                                            <form onSubmit={submitSecurityAuditLog} className="grid gap-3">
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <select
                                                        value={securityAuditLogForm.event_type}
                                                        onChange={(event) => setSecurityAuditLogForm({ ...securityAuditLogForm, event_type: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none"
                                                    >
                                                        <option value="manual_note">Manual note</option>
                                                        <option value="login_success">Login success</option>
                                                        <option value="login_failure">Login failure</option>
                                                        <option value="role_change">Role change</option>
                                                        <option value="access_change">Access change</option>
                                                        <option value="security_update">Security update</option>
                                                    </select>
                                                    <select
                                                        value={securityAuditLogForm.severity}
                                                        onChange={(event) => setSecurityAuditLogForm({ ...securityAuditLogForm, severity: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none"
                                                    >
                                                        <option value="info">Info</option>
                                                        <option value="warning">Warning</option>
                                                        <option value="critical">Critical</option>
                                                    </select>
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <input
                                                        value={securityAuditLogForm.actor_label}
                                                        onChange={(event) => setSecurityAuditLogForm({ ...securityAuditLogForm, actor_label: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="Actor"
                                                        required
                                                    />
                                                    <input
                                                        value={securityAuditLogForm.target_label}
                                                        onChange={(event) => setSecurityAuditLogForm({ ...securityAuditLogForm, target_label: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="Target (optional)"
                                                    />
                                                </div>

                                                <input
                                                    value={securityAuditLogForm.action_summary}
                                                    onChange={(event) => setSecurityAuditLogForm({ ...securityAuditLogForm, action_summary: event.target.value })}
                                                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                    placeholder="Action summary"
                                                    required
                                                />

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <select
                                                        value={securityAuditLogForm.outcome}
                                                        onChange={(event) => setSecurityAuditLogForm({ ...securityAuditLogForm, outcome: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none"
                                                    >
                                                        <option value="success">Success</option>
                                                        <option value="blocked">Blocked</option>
                                                        <option value="failure">Failure</option>
                                                    </select>
                                                    <input
                                                        value={securityAuditLogForm.ip_address}
                                                        onChange={(event) => setSecurityAuditLogForm({ ...securityAuditLogForm, ip_address: event.target.value })}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="IP address"
                                                    />
                                                </div>

                                                <input
                                                    type="datetime-local"
                                                    value={securityAuditLogForm.occurred_at}
                                                    onChange={(event) => setSecurityAuditLogForm({ ...securityAuditLogForm, occurred_at: event.target.value })}
                                                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                />

                                                <textarea
                                                    value={securityAuditLogForm.notes}
                                                    onChange={(event) => setSecurityAuditLogForm({ ...securityAuditLogForm, notes: event.target.value })}
                                                    className="min-h-[90px] rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                    placeholder="Notes"
                                                />

                                                <div className="flex flex-wrap justify-end gap-2">
                                                    {editingSecurityAuditLogId ? (
                                                        <button
                                                            type="button"
                                                            onClick={resetSecurityAuditLogForm}
                                                            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                                        >
                                                            Cancel edit
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        type="submit"
                                                        disabled={securitySaving}
                                                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                                                    >
                                                        {securitySaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                        {editingSecurityAuditLogId ? 'Update entry' : 'Create entry'}
                                                    </button>
                                                </div>
                                            </form>

                                            <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                                                {securityAuditLogs.length === 0 ? (
                                                    <div className="flex min-h-[180px] flex-col items-center justify-center px-6 py-10 text-center">
                                                        <div className="rounded-full bg-slate-100 p-3 text-slate-500">
                                                            <AlertCircle className="h-6 w-6" />
                                                        </div>
                                                        <h4 className="mt-4 text-base font-bold text-slate-900">No audit entries yet</h4>
                                                        <p className="mt-1 max-w-md text-sm text-slate-500">
                                                            Add audit records to track the security history of logins, role changes, and access decisions.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                                        <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                                            <tr>
                                                                <th className="px-4 py-3">Event</th>
                                                                <th className="px-4 py-3">Actor</th>
                                                                <th className="px-4 py-3">Severity</th>
                                                                <th className="px-4 py-3">When</th>
                                                                <th className="px-4 py-3 text-right">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 bg-white">
                                                            {securityAuditLogs.map((record) => (
                                                                <tr key={record.id}>
                                                                    <td className="px-4 py-3">
                                                                        <p className="font-semibold text-slate-900">{formatChoiceLabel(record.event_type)}</p>
                                                                        <p className="text-xs text-slate-500">{record.action_summary}</p>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-slate-600">
                                                                        <p>{record.actor_label}</p>
                                                                        {record.target_label ? <p className="text-xs text-slate-500">Target: {record.target_label}</p> : null}
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${record.severity === 'critical' ? 'border border-rose-200 bg-rose-50 text-rose-700' : record.severity === 'warning' ? 'border border-amber-200 bg-amber-50 text-amber-700' : 'border border-sky-200 bg-sky-50 text-sky-700'}`}>
                                                                            {formatChoiceLabel(record.severity)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-slate-600">{formatDateTime(record.occurred_at)}</td>
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex justify-end gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => editSecurityAuditLog(record)}
                                                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                                            >
                                                                                <Edit2 className="h-3.5 w-3.5" />
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => deleteSecurityAuditLog(record.id)}
                                                                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                                                            >
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </section>
                                    </div>
                                )}
                            </>
                        ) : activeTab === 'system' ? (
                            <>
                                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight text-slate-900">Configure System Settings</h2>
                                        <p className="mt-1 text-sm text-slate-600">
                                            Tune AI model parameters, ranking thresholds, filtering rules, and API integration endpoints.
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={loadSettings}
                                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${settingsLoading ? 'animate-spin' : ''}`} />
                                            Refresh
                                        </button>
                                        <button
                                            type="submit"
                                            form="system-settings-form"
                                            disabled={settingsSaving || settingsLoading}
                                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                                        >
                                            {settingsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            Save changes
                                        </button>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-3">
                                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI model</p>
                                        <p className="mt-2 text-lg font-black text-slate-900">{systemSettings.ai_model_settings.generation_model}</p>
                                        <p className="mt-1 text-sm text-slate-600">Provider: {systemSettings.ai_model_settings.provider}</p>
                                    </div>
                                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Ranking</p>
                                        <p className="mt-2 text-lg font-black text-slate-900">{systemSettings.search_settings.ranking_strategy}</p>
                                        <p className="mt-1 text-sm text-slate-600">Result limit {systemSettings.search_settings.result_limit} · Threshold {systemSettings.search_settings.distance_threshold}</p>
                                    </div>
                                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Environment Config</p>
                                        <p className="mt-2 text-lg font-black text-slate-900">{configuredIntegrations} configured</p>
                                        <p className="mt-1 text-sm text-slate-600">Last saved {formatDateTime(settingsUpdatedAt)}</p>
                                    </div>
                                </div>

                                {settingsLoading ? (
                                    <div className="mt-6 flex min-h-[320px] items-center justify-center rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Loading system settings...
                                        </div>
                                    </div>
                                ) : (
                                    <form id="system-settings-form" onSubmit={submitSystemSettings} className="mt-6 grid gap-6 xl:grid-cols-3">
                                        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm xl:col-span-1">
                                            <div>
                                                <h3 className="text-lg font-black tracking-tight text-slate-900">AI Model Parameters</h3>
                                                <p className="mt-1 text-sm text-slate-600">Set the generation and rewriting models used by the RAG pipeline.</p>
                                            </div>

                                            <div className="mt-5 grid gap-4">
                                                <label className="grid gap-2">
                                                    <span className="text-sm font-semibold text-slate-700">Provider</span>
                                                    <input
                                                        value={systemSettings.ai_model_settings.provider}
                                                        onChange={(event) => updateSystemSection('ai_model_settings', 'provider', event.target.value)}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="gemini"
                                                    />
                                                </label>

                                                <label className="grid gap-2">
                                                    <span className="text-sm font-semibold text-slate-700">Generation model</span>
                                                    <input
                                                        value={systemSettings.ai_model_settings.generation_model}
                                                        onChange={(event) => updateSystemSection('ai_model_settings', 'generation_model', event.target.value)}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="gemini-2.5-flash"
                                                    />
                                                </label>

                                                <label className="grid gap-2">
                                                    <span className="text-sm font-semibold text-slate-700">Rewrite model</span>
                                                    <input
                                                        value={systemSettings.ai_model_settings.rewrite_model}
                                                        onChange={(event) => updateSystemSection('ai_model_settings', 'rewrite_model', event.target.value)}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="gemini-2.5-flash-lite"
                                                    />
                                                </label>

                                                <label className="grid gap-2">
                                                    <span className="text-sm font-semibold text-slate-700">Rerank model</span>
                                                    <input
                                                        value={systemSettings.ai_model_settings.rerank_model}
                                                        onChange={(event) => updateSystemSection('ai_model_settings', 'rerank_model', event.target.value)}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="gemini-2.5-flash"
                                                    />
                                                </label>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <label className="grid gap-2">
                                                        <span className="text-sm font-semibold text-slate-700">Temperature</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="2"
                                                            step="0.1"
                                                            value={systemSettings.ai_model_settings.temperature}
                                                            onChange={(event) => updateSystemSection('ai_model_settings', 'temperature', Number(event.target.value))}
                                                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        />
                                                    </label>

                                                    <label className="grid gap-2">
                                                        <span className="text-sm font-semibold text-slate-700">Top-p</span>
                                                        <input
                                                            type="number"
                                                            min="0.1"
                                                            max="1"
                                                            step="0.05"
                                                            value={systemSettings.ai_model_settings.top_p}
                                                            onChange={(event) => updateSystemSection('ai_model_settings', 'top_p', Number(event.target.value))}
                                                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        />
                                                    </label>
                                                </div>

                                                <label className="grid gap-2">
                                                    <span className="text-sm font-semibold text-slate-700">Max output tokens</span>
                                                    <input
                                                        type="number"
                                                        min="64"
                                                        max="8192"
                                                        step="64"
                                                        value={systemSettings.ai_model_settings.max_output_tokens}
                                                        onChange={(event) => updateSystemSection('ai_model_settings', 'max_output_tokens', Number(event.target.value))}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                    />
                                                </label>
                                            </div>
                                        </section>

                                        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm xl:col-span-1">
                                            <div>
                                                <h3 className="text-lg font-black tracking-tight text-slate-900">Search & Recommendation Logic</h3>
                                                <p className="mt-1 text-sm text-slate-600">Control ranking strategy, result thresholds, and filtering rules.</p>
                                            </div>

                                            <div className="mt-5 grid gap-4">
                                                <label className="grid gap-2">
                                                    <span className="text-sm font-semibold text-slate-700">Ranking strategy</span>
                                                    <select
                                                        value={systemSettings.search_settings.ranking_strategy}
                                                        onChange={(event) => updateSystemSection('search_settings', 'ranking_strategy', event.target.value)}
                                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none"
                                                    >
                                                        <option value="hybrid">Hybrid</option>
                                                        <option value="semantic">Semantic</option>
                                                        <option value="keyword">Keyword</option>
                                                        <option value="rerank">Rerank only</option>
                                                    </select>
                                                </label>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <label className="grid gap-2">
                                                        <span className="text-sm font-semibold text-slate-700">Result limit</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="50"
                                                            step="1"
                                                            value={systemSettings.search_settings.result_limit}
                                                            onChange={(event) => updateSystemSection('search_settings', 'result_limit', Number(event.target.value))}
                                                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        />
                                                    </label>

                                                    <label className="grid gap-2">
                                                        <span className="text-sm font-semibold text-slate-700">Rerank top-k</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="50"
                                                            step="1"
                                                            value={systemSettings.search_settings.rerank_top_k}
                                                            onChange={(event) => updateSystemSection('search_settings', 'rerank_top_k', Number(event.target.value))}
                                                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        />
                                                    </label>
                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <label className="grid gap-2">
                                                        <span className="text-sm font-semibold text-slate-700">Distance threshold</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="5"
                                                            step="0.1"
                                                            value={systemSettings.search_settings.distance_threshold}
                                                            onChange={(event) => updateSystemSection('search_settings', 'distance_threshold', Number(event.target.value))}
                                                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        />
                                                    </label>

                                                    <label className="grid gap-2">
                                                        <span className="text-sm font-semibold text-slate-700">Relevance floor</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="1"
                                                            step="0.05"
                                                            value={systemSettings.search_settings.relevance_floor}
                                                            onChange={(event) => updateSystemSection('search_settings', 'relevance_floor', Number(event.target.value))}
                                                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        />
                                                    </label>
                                                </div>

                                                <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                                    <label className="flex items-center justify-between gap-4">
                                                        <div>
                                                            <span className="text-sm font-semibold text-slate-700">Enable subject filters</span>
                                                            <p className="text-xs text-slate-500">Use subject metadata when narrowing recommendations.</p>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(systemSettings.search_settings.enable_subject_filters)}
                                                            onChange={(event) => updateSystemSection('search_settings', 'enable_subject_filters', event.target.checked)}
                                                            className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                                        />
                                                    </label>
                                                    <label className="flex items-center justify-between gap-4">
                                                        <div>
                                                            <span className="text-sm font-semibold text-slate-700">Enable year filters</span>
                                                            <p className="text-xs text-slate-500">Allow date-range constraints in search and ranking.</p>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(systemSettings.search_settings.enable_year_filters)}
                                                            onChange={(event) => updateSystemSection('search_settings', 'enable_year_filters', event.target.checked)}
                                                            className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                                        />
                                                    </label>
                                                    <label className="flex items-center justify-between gap-4">
                                                        <div>
                                                            <span className="text-sm font-semibold text-slate-700">Enable strict matching</span>
                                                            <p className="text-xs text-slate-500">Keep the final relevance filter conservative for direct queries.</p>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(systemSettings.search_settings.enable_strict_matching)}
                                                            onChange={(event) => updateSystemSection('search_settings', 'enable_strict_matching', event.target.checked)}
                                                            className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm xl:col-span-1">
                                            <div>
                                                <h3 className="text-lg font-black tracking-tight text-slate-900">Environment Configuration</h3>
                                                <p className="mt-1 text-sm text-slate-600">Deployment secrets and API credentials. Keep sensitive values secure in production.</p>
                                            </div>

                                            <div className="mt-5 grid gap-4">
                                                <label className="grid gap-2">
                                                    <span className="text-sm font-semibold text-slate-700">Database URL</span>
                                                    <input
                                                        type="password"
                                                        value={systemSettings.environment_config.database_url}
                                                        onChange={(event) => updateSystemSection('environment_config', 'database_url', event.target.value)}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="postgresql://user:pass@host:port/db"
                                                    />
                                                    <p className="text-xs text-slate-500">⚠️ Change in code environment variable: DATABASE_URL</p>
                                                </label>

                                                <label className="grid gap-2">
                                                    <span className="text-sm font-semibold text-slate-700">Email Host User</span>
                                                    <input
                                                        type="password"
                                                        value={systemSettings.environment_config.email_host_user}
                                                        onChange={(event) => updateSystemSection('environment_config', 'email_host_user', event.target.value)}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="your-email@gmail.com"
                                                    />
                                                    <p className="text-xs text-slate-500">⚠️ Change in code environment variable: EMAIL_HOST_USER</p>
                                                </label>

                                                <label className="grid gap-2">
                                                    <span className="text-sm font-semibold text-slate-700">Email Host Password</span>
                                                    <input
                                                        type="password"
                                                        value={systemSettings.environment_config.email_host_password}
                                                        onChange={(event) => updateSystemSection('environment_config', 'email_host_password', event.target.value)}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="••••••••"
                                                    />
                                                    <p className="text-xs text-slate-500">⚠️ Change in code environment variable: EMAIL_HOST_PASSWORD</p>
                                                </label>

                                                <label className="grid gap-2">
                                                    <span className="text-sm font-semibold text-slate-700">Gemini API Key</span>
                                                    <input
                                                        type="password"
                                                        value={systemSettings.environment_config.gemini_api_key}
                                                        onChange={(event) => updateSystemSection('environment_config', 'gemini_api_key', event.target.value)}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="••••••••"
                                                    />
                                                    <p className="text-xs text-slate-500">⚠️ Change in code environment variable: GEMINI_API_KEY</p>
                                                </label>

                                                <label className="grid gap-2">
                                                    <span className="text-sm font-semibold text-slate-700">HuggingFace Token</span>
                                                    <input
                                                        type="password"
                                                        value={systemSettings.environment_config.hf_token}
                                                        onChange={(event) => updateSystemSection('environment_config', 'hf_token', event.target.value)}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                                        placeholder="••••••••"
                                                    />
                                                    <p className="text-xs text-slate-500">⚠️ Change in code environment variable: HF_TOKEN</p>
                                                </label>
                                            </div>

                                            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                                ⚠️ <strong>Security Note:</strong> These values are stored in the database. Update corresponding environment variables in your deployment configuration (e.g., Railway, Heroku, .env files) to ensure consistency.
                                            </p>
                                        </section>

                                        {settingsError ? (
                                            <div className="xl:col-span-3 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                                <span>{settingsError}</span>
                                            </div>
                                        ) : null}

                                        <div className="xl:col-span-3 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
                                            <button
                                                type="button"
                                                onClick={loadSettings}
                                                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                            >
                                                Reset from server
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={settingsSaving || settingsLoading}
                                                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                                            >
                                                {settingsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                Save settings
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
            </div>

            {toast.show ? (
                <div className={`fixed right-4 top-4 z-50 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4" />
                        <span className="text-sm font-medium">{toast.message}</span>
                    </div>
                </div>
            ) : null}

            {isModalOpen ? (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">User management</p>
                                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                                    {editingAccount ? 'Edit user account' : 'Create user account'}
                                </h3>
                                <p className="mt-1 text-sm text-slate-600">
                                    {editingAccount ? 'Update identity, role, status, or reset the password.' : 'Create a new account and assign the correct role from day one.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={submitForm} className="grid gap-5 px-6 py-6 md:grid-cols-2">
                            <label className="grid gap-2">
                                <span className="text-sm font-semibold text-slate-700">Full name</span>
                                <input
                                    value={form.full_name}
                                    onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                    placeholder="Jane Doe"
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm font-semibold text-slate-700">Username</span>
                                <input
                                    value={form.username}
                                    onChange={(event) => setForm({ ...form, username: event.target.value })}
                                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                    placeholder="jane.doe"
                                    required
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm font-semibold text-slate-700">Email</span>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                    placeholder="user@example.com"
                                    required
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm font-semibold text-slate-700">Role</span>
                                <select
                                    value={form.role}
                                    onChange={(event) => setForm({ ...form, role: event.target.value })}
                                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                >
                                    {roleOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </label>

                            <div className="md:col-span-2">
                                <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                                    <div>
                                        <span className="text-sm font-semibold text-slate-700">Account active</span>
                                        <p className="text-xs text-slate-500">Inactive accounts cannot sign in until reactivated.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                                        className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                    />
                                </label>
                            </div>

                            <div className="md:col-span-2 grid gap-2">
                                <label className="grid gap-2">
                                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <KeyRound className="h-4 w-4" />
                                        {editingAccount ? 'New password (optional)' : 'Password'}
                                    </span>
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={(event) => setForm({ ...form, password: event.target.value })}
                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                        placeholder="Enter a strong password"
                                        required={!editingAccount}
                                    />
                                </label>

                                <label className="grid gap-2">
                                    <span className="text-sm font-semibold text-slate-700">Confirm password</span>
                                    <input
                                        type="password"
                                        value={form.confirmPassword}
                                        onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                                        placeholder="Re-enter the password"
                                        required={!editingAccount || Boolean(form.password)}
                                    />
                                </label>
                            </div>

                            {form.password ? (
                                <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-sm font-semibold text-slate-700">Password requirements</p>
                                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                                        {passwordChecks.map((check) => (
                                            <li key={check.label} className={`flex items-start gap-2 text-sm ${check.isMet ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                <span className={`mt-1 h-2.5 w-2.5 rounded-full ${check.isMet ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                {check.label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}

                            {pageError ? (
                                <div className="md:col-span-2 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <span>{pageError}</span>
                                </div>
                            ) : null}

                            <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {editingAccount ? 'Save changes' : 'Create account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default ITAdminDashboard;