import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { MainLayout } from './shared/ui/templates';

import ProtectedRoute from './shared/guards/ProtectedRoute';
import GuestRoute from './shared/guards/GuestRoute';

import Home from './features/home/pages/HomePage';
import Login from './features/auth/pages/LoginPage';
import Register from './features/auth/pages/RegisterPage';
import NotFound from './features/common/pages/NotFoundPage';
import ForgotPassword from './features/auth/pages/ForgotPasswordPage';
import VerifyOtp from './features/auth/pages/VerifyOtpPage';
import ResetPassword from './features/auth/pages/ResetPasswordPage';
import VerifyEmailOtp from './features/auth/pages/VerifyEmailOtpPage';
import Settings from './features/common/pages/SettingsPage';

import StudentDashboard from './features/student/pages/DashboardPage';
import StudentProfile from './features/student/pages/ProfilePage';
import StudentResumeUpload from './features/student/pages/ResumeUploadPage';
import StudentJobList from './features/student/pages/JobListPage';
import StudentApplications from './features/student/pages/ApplicationsPage';
import StudentCvBuilder from './features/student/pages/CvBuilderPage';

import RecruiterDashboard from './features/recruiter/pages/DashboardPage';
import PostJob from './features/recruiter/pages/PostJobPage';
import MyJobs from './features/recruiter/pages/MyJobsPage';
import RecruiterApplications from './features/recruiter/pages/ApplicationsPage';
import RecruiterProfile from './features/recruiter/pages/ProfilePage';
import JobManage from './features/recruiter/pages/JobManagePage';

import AdminDashboard from './features/admin/pages/DashboardPage';
import ManageUsers from './features/admin/pages/ManageUsersPage';
import AdminProfile from './features/admin/pages/ProfilePage';
import AdminUserDetails from './features/admin/pages/UserDetailsPage';

import ProfileRedirect from './features/common/pages/ProfileRedirectPage';
import Notifications from './features/common/pages/NotificationsPage';
import JobDetails from './features/common/pages/JobDetailsPage';
import AccountBlocked from './features/common/pages/AccountBlockedPage';
import Unauthorized from './features/common/pages/UnauthorizedPage';

export default function App() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = t('common.appName');
  }, [t, i18n.language]);

  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<ProfileRedirect />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/verify-email-otp" element={<VerifyEmailOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/account-blocked" element={<AccountBlocked />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route
          path="/settings"
          element={
            <ProtectedRoute role={["STUDENT", "RECRUITER", "ADMIN"]}>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute role="STUDENT">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute role="STUDENT">
              <StudentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/resume"
          element={
            <ProtectedRoute role="STUDENT">
              <StudentResumeUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/jobs"
          element={
            <ProtectedRoute role="STUDENT">
              <StudentJobList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/applications"
          element={
            <ProtectedRoute role="STUDENT">
              <StudentApplications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/cv-builder"
          element={
            <ProtectedRoute role="STUDENT">
              <StudentCvBuilder />
            </ProtectedRoute>
          }
        />

        {/* Recruiter Routes */}
        <Route
          path="/recruiter/dashboard"
          element={
            <ProtectedRoute role="RECRUITER">
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/post-job"
          element={
            <ProtectedRoute role="RECRUITER">
              <PostJob />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/my-jobs"
          element={
            <ProtectedRoute role="RECRUITER">
              <MyJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/applications"
          element={
            <ProtectedRoute role="RECRUITER">
              <RecruiterApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/profile"
          element={
            <ProtectedRoute role="RECRUITER">
              <RecruiterProfile />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute role="ADMIN">
              <ManageUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users/:id"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminUserDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute role={["STUDENT", "RECRUITER", "ADMIN"]}>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/jobs/:id"
          element={
            <ProtectedRoute role={["STUDENT", "RECRUITER", "ADMIN"]}>
              <JobDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/jobs/:id"
          element={
            <ProtectedRoute role={["RECRUITER"]}>
              <JobManage />
            </ProtectedRoute>
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
