import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LitPathAI from './pages/search/LitPathAI';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ITAdminDashboard from './pages/itAdmin/ITAdminDashboard';
import FeedbackForm from './pages/FeedbackForm';
import FeedbackDetail from './pages/admin/FeedbackDetail';
import ResetPassword from './pages/ResetPassword';
import TermsAndConditions from './pages/TermsAndConditions.tsx';
import AccountProfile from './pages/AccountProfile';
import { getDashboardPathForRole, ROLE_PATHS } from './lib/roleLabels';

// ------------------------------------------------------------
//  Protected Route
// ------------------------------------------------------------
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: Array<'staff' | 'admin'> }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && (!user || !allowedRoles.includes(user.role as 'staff' | 'admin'))) {
        return <Navigate to="/search" replace />;
    }

    return children;
};

// ------------------------------------------------------------
//  Auth Route – redirect if already logged in
// ------------------------------------------------------------
const AuthRoute = ({ children }: { children: React.ReactNode }) => {

    const { user, loading } = useAuth();
    const location = useLocation();
    // Check for ?mode=login in URL using useLocation
    const urlParams = new URLSearchParams(location.search);
    const isLoginMode = urlParams.get('mode') === 'login';

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (user) {
        // Allow guest to see login form if ?mode=login
        if (user.role === 'guest' && isLoginMode) {
            return children;
        }
        return <Navigate to={getDashboardPathForRole(user.role)} replace />;
    }

    return children;
};

const LegacyAdminDashboardRedirect = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center text-gray-600">Loading...</div>
            </div>
        );
    }

    return <Navigate to={getDashboardPathForRole(user?.role)} replace />;
};

// ------------------------------------------------------------
//  Redirect from old /admin/feedback (list) to dashboard with state
// ------------------------------------------------------------
const RedirectToFeedbackTab = () => {
    return <Navigate to={ROLE_PATHS.STAFF_DASHBOARD} replace state={{ activeTab: 'feedback' }} />;
};

// ------------------------------------------------------------
//  Main Routes
// ------------------------------------------------------------
const AppContent = () => {
    return (
        <Routes>
            {/* Auth page */}
            <Route path="/" element={<AuthRoute><AuthPage /></AuthRoute>} />

            {/* Legacy login redirect */}
            <Route path="/login" element={<Navigate to="/" replace />} />

            {/* Search page – requires auth (including guest) */}
            <Route path="/search" element={<ProtectedRoute><LitPathAI /></ProtectedRoute>} />

            {/* Staff dashboard – Library Administrator hub */}
            <Route path="/library-admin/dashboard" element={<ProtectedRoute allowedRoles={['staff']}><AdminDashboard /></ProtectedRoute>} />

            {/* IT admin dashboard */}
            <Route path="/it-admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><ITAdminDashboard /></ProtectedRoute>} />

            {/* Backward-compatible redirect from the old path */}
            <Route path="/admin/dashboard" element={<ProtectedRoute><LegacyAdminDashboardRedirect /></ProtectedRoute>} />

            {/* Redirect old /admin/feedback (list) to dashboard with feedback tab active */}
            <Route path="/admin/feedback" element={<ProtectedRoute allowedRoles={['staff']}><RedirectToFeedbackTab /></ProtectedRoute>} />

            {/* ✅ DETAIL PAGE – still exists, back button returns to dashboard */}
            <Route path="/admin/feedback/:id" element={<ProtectedRoute allowedRoles={['staff']}><FeedbackDetail /></ProtectedRoute>} />

            {/* CSM Feedback Form */}
            <Route path="/feedback-form" element={<ProtectedRoute><FeedbackForm /></ProtectedRoute>} />

            {/* Account profile */}
            <Route path="/account-profile" element={<ProtectedRoute><AccountProfile /></ProtectedRoute>} />

            {/* Reset password */}
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Terms and conditions */}
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

// ------------------------------------------------------------
//  App
// ------------------------------------------------------------
function App() {
    return (
        <Router>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </Router>
    );
}

export default App;