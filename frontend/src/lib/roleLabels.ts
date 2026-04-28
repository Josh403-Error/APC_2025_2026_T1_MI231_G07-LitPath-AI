export const ROLE_PATHS = {
    STAFF_DASHBOARD: '/library-admin/dashboard',
    ADMIN_DASHBOARD: '/it-admin/dashboard'
} as const;

export function getRoleLabel(role?: string | null): string {
    switch (role) {
        case 'staff':
            return 'Library Administrator';
        case 'admin':
            return 'IT Administrator';
        case 'user':
            return 'User';
        case 'guest':
            return 'Guest';
        default:
            return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Guest';
    }
}

export function getDashboardPathForRole(role?: string | null): string {
    if (role === 'admin') {
        return ROLE_PATHS.ADMIN_DASHBOARD;
    }

    if (role === 'staff') {
        return ROLE_PATHS.STAFF_DASHBOARD;
    }

    return '/search';
}