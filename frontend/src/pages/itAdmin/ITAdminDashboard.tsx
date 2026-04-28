// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    AlertCircle,
    CheckCircle2,
    Edit2,
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

const formatDateTime = (value?: string | null) => {
    if (!value) return 'Never';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Never';
    return date.toLocaleString();
};

const getBadgeClasses = (role: string, isActive: boolean) => {
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

const ITAdminDashboard = () => {
    const { user, logout } = useAuth();

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pageError, setPageError] = useState('');
    const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [form, setForm] = useState(emptyForm);

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
            const data = await response.json();

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

    useEffect(() => {
        loadAccounts();
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

            const data = await response.json();
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

            const data = await response.json();
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

    const passwordChecks = getPasswordRequirementChecks(form.password || '');

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

                    <div className="grid gap-4 border-b border-slate-200/70 bg-slate-50/60 p-6 md:grid-cols-4">
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-slate-600">Total accounts</p>
                                <Users className="h-5 w-5 text-slate-400" />
                            </div>
                            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{metrics.total}</p>
                        </div>
                        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-emerald-700">Active accounts</p>
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <p className="mt-3 text-3xl font-black tracking-tight text-emerald-900">{metrics.active}</p>
                        </div>
                        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-rose-700">IT admins</p>
                                <ShieldCheck className="h-5 w-5 text-rose-600" />
                            </div>
                            <p className="mt-3 text-3xl font-black tracking-tight text-rose-900">{metrics.admins}</p>
                        </div>
                        <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-sky-700">Library admins</p>
                                <UserRoundCog className="h-5 w-5 text-sky-600" />
                            </div>
                            <p className="mt-3 text-3xl font-black tracking-tight text-sky-900">{metrics.staff}</p>
                        </div>
                    </div>

                    <div className="p-6">
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