import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { lazy, Suspense } from "react";

const Login = lazy(() => import("@/erp/features/auth/pages/login"));
const Register = lazy(() => import("@/erp/features/auth/pages/registration"));
const ForgotPassword = lazy(() => import("@/erp/features/auth/pages/forgotPassword"));
const ResetPassword = lazy(() => import("@/erp/features/auth/pages/resetPassword"));
const SetAccountDetail = lazy(() => import("@/erp/features/auth/pages/setAccountDetail"));
const JoinCommunity = lazy(() => import("@/erp/features/auth/pages/joinCommunity"));
const OrgSwitcher = lazy(() => import("@/erp/features/auth/pages/orgSwitcher"));

const Dashboard = lazy(() => import("@/erp/features/dashboard/pages/Dashboard"));
const UserManagement = lazy(() => import("@/erp/features/user-management/pages/userManagement"));
const UserProfile = lazy(() => import("@/erp/features/user-management/pages/userProfile"));
const ACLManagement = lazy(() => import("@/erp/features/acl-management/pages/acl-managment"));
const NotificationSettings = lazy(() => import("@/erp/features/notification/pages/NotificationSettings"));

const Explore = lazy(() => import("@/features/member/pages/explore"));
const CreateActivity = lazy(() => import("@/features/member/pages/createActivity"));
const ActivityDetail = lazy(() => import("@/features/member/pages/activityDetail"));
const MyActivities = lazy(() => import("@/features/member/pages/myActivities"));
const Directory = lazy(() => import("@/features/member/pages/directory"));
const CommunityCalendar = lazy(() => import("@/features/member/pages/calendar"));
const OrgDashboard = lazy(() => import("@/features/member/pages/orgDashboard"));
const PlatformDashboard = lazy(() => import("@/features/member/pages/platformDashboard"));
const CreateOrganization = lazy(() => import("@/features/member/pages/createOrganization"));
const Reports = lazy(() => import("@/features/member/pages/reports"));

const GuestLanding = lazy(() => import("@/features/guest/pages/GuestLanding"));
const GuestActivity = lazy(() => import("@/features/guest/pages/GuestActivity"));
const GuestConfirmation = lazy(() => import("@/features/guest/pages/GuestConfirmation"));

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
        {/* /join is reachable both pre-login (fresh phone verification) and
            post-login (joining an additional community) */}
        <Route path="/join" element={<JoinCommunity />} />

        {/* Guest surface: always public, regardless of auth state, since a
            logged-in member browsing another org's public page is still a
            guest there — no membership implied. */}
        <Route path="/g/:subdomain" element={<GuestLanding />} />
        <Route path="/g/:subdomain/events/:id" element={<GuestActivity />} />
        <Route path="/g/:subdomain/thank-you" element={<GuestConfirmation />} />

        {/* Authenticated routes */}
        {isAuthenticated ? (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/switch-org" element={<OrgSwitcher />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/create-activity" element={<CreateActivity />} />
            <Route path="/events/:id" element={<ActivityDetail />} />
            <Route path="/my-activities" element={<MyActivities />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/calendar" element={<CommunityCalendar />} />
            <Route path="/org-dashboard" element={<OrgDashboard />} />
            <Route path="/platform-dashboard" element={<PlatformDashboard />} />
            <Route path="/organizations/new" element={<CreateOrganization />} />
            <Route path="/reports" element={<Reports />} />
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
