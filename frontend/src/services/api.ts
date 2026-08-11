// ────────────────────────────────────────────────
//  Centralized API configuration & helper
// ────────────────────────────────────────────────

function normalizeApiBaseUrl(value: string | undefined): string | null {
    const trimmed = value?.trim();
    if (!trimmed) return null;

    const withoutTrailingSlash = trimmed.replace(/\/$/, '');
    if (withoutTrailingSlash.endsWith('/api')) {
        return withoutTrailingSlash;
    }

    return `${withoutTrailingSlash}/api`;
}

function resolveApiBaseUrl(): string {
    const configured = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL as string | undefined);
    if (configured) return configured;

    // Removed hardcoded fallback to localhost for Tailscale deployment.
    // In a Tailscale setup, VITE_API_BASE_URL must be set correctly.
    console.error("FATAL ERROR: VITE_API_BASE_URL is not set correctly in the environment.");
    return 'http://127.0.0.1:8080/api'; // Updated fallback to match the current backend server
}

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Get the current auth token from localStorage.
 * Returns null when no session exists.
 */
export function getAuthToken(): string | null {
    try {
        const raw = localStorage.getItem('litpath_session');
        if (!raw) return null;
        const session = JSON.parse(raw);
        return session?.session_token ?? null;
    } catch {
        return null;
    }
}

/**
 * Build standard headers for JSON API calls.
 * Includes Authorization when a session token is available.
 */
export function apiHeaders(includeAuth = false): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (includeAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return headers;
}