import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRoleLabel, ROLE_PATHS } from '../../lib/roleLabels';

const sections = [
    {
        title: 'Manage User Accounts',
        items: ['Create', 'Edit', 'Deactivate', 'Assign roles']
    },
    {
        title: 'Configure System Settings',
        items: ['AI model parameters', 'Recommendation logic thresholds', 'APIs']
    },
    {
        title: 'Database Structure and Backups',
        items: ['Manage schema', 'Run backups', 'Restore backups']
    },
    {
        title: 'System Security',
        items: ['Authentication', 'Access control', 'Audit logs']
    },
    {
        title: 'System Integrations',
        items: ['OPAC', 'Institutional repositories', 'Chatbot integration']
    },
    {
        title: 'Operations',
        items: ['Monitor performance', 'Monitor uptime', 'Deploy updates, bug fixes, and new features']
    }
];

const ITAdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const roleLabel = getRoleLabel(user?.role);

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef2ff_40%,_#e2e8f0_100%)] text-slate-900">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">System Console</p>
                        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">IT Administrator</h1>
                        <p className="mt-2 max-w-3xl text-sm text-slate-600">
                            Centralized controls for platform governance, security, integrations, and operational oversight.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Signed in as</p>
                            <p className="text-sm font-semibold text-slate-900">{user?.full_name || user?.username || 'IT Administrator'}</p>
                            <p className="text-xs text-slate-500">{roleLabel}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(ROLE_PATHS.STAFF_DASHBOARD)}
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                        >
                            Open Library Dashboard
                        </button>
                        <button
                            type="button"
                            onClick={logout}
                            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {sections.map((section) => (
                        <article key={section.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                            <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
                            <ul className="mt-4 space-y-2 text-sm text-slate-600">
                                {section.items.map((item) => (
                                    <li key={item} className="flex items-start gap-3">
                                        <span className="mt-2 h-2 w-2 rounded-full bg-slate-900" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ITAdminDashboard;