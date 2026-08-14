import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { lazy, Suspense } from "react";

const Login = lazy(() => import("@/erp/features/auth/pages/login"));
const Register = lazy(() => import("@/erp/features/auth/pages/registration"));
const ForgotPassword = lazy(() => import("@/erp/features/auth/pages/forgotPassword"));
const ResetPassword = lazy(() => import("@/erp/features/auth/pages/resetPassword"));
const SetAccountDetail = lazy(() => import("@/erp/features/auth/pages/setAccountDetail"));

const Dashboard = lazy(() => import("@/erp/features/dashboard/pages/Dashboard"));
const OrganizationManagement = lazy(() => import("@/erp/features/organization-management/pages/OrganizationManagement"));
const UserManagement = lazy(() => import("@/erp/features/user-management/pages/userManagement"));
const UserProfile = lazy(() => import("@/erp/features/user-management/pages/userProfile"));
const ACLManagement = lazy(() => import("@/erp/features/acl-management/pages/acl-managment"));
const NotificationSettings = lazy(() => import("@/erp/features/notification/pages/NotificationSettings"));

const AppRouter = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/set-account-detail" element={<SetAccountDetail />} />

        {/* Authenticated routes */}
        {isAuthenticated ? (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/organizations" element={<OrganizationManagement />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/users/profile/:userId" element={<UserProfile />} />
            <Route path="/acl-managemnt" element={<ACLManagement />} />
            <Route path="/notifications" element={<NotificationSettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
