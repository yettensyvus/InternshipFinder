import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import FloatingBackButton from './components/FloatingBackButton';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp from './pages/VerifyOtp';
import ResetPassword from './pages/ResetPassword';
import VerifyEmailOtp from './pages/VerifyEmailOtp';
import Settings from './pages/Settings';

// 🧑‍🎓 Student
import StudentDashboard from './pages/student/Dashboard';
import Profile from './pages/student/Profile';
import ResumeUpload from './pages/student/ResumeUpload';
import JobList from './pages/student/JobList';
import Applications from './pages/student/Applications';
import CvBuilder from './pages/student/CvBuilder';

// 🧑‍💼 Recruiter
import RecruiterDashboard from './pages/recruiter/Dashboard';
import PostJob from './pages/recruiter/PostJob';
import MyJobs from './pages/recruiter/MyJobs';
import RecruiterApplications from './pages/recruiter/Applications';
import RecruiterProfile from './pages/recruiter/Profile';
import JobManage from './pages/recruiter/JobManage';

// 🛠️ Admin
import AdminDashboard from './pages/admin/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import AdminProfile from './pages/admin/Profile';
import AdminUserDetails from './pages/admin/UserDetails';

import ProfileRedirect from './pages/ProfileRedirect';
import Notifications from './pages/Notifications';
import JobDetails from './pages/JobDetails';
import AccountBlocked from './pages/AccountBlocked';

export default function App() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = t('common.appName');
  }, [t, i18n.language]);

  return (
    <>
      <Navbar />
      <FloatingBackButton />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<ProfileRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/verify-email-otp" element={<VerifyEmailOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/account-blocked" element={<AccountBlocked />} />

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
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/resume"
          element={
            <ProtectedRoute role="STUDENT">
              <ResumeUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/jobs"
          element={
            <ProtectedRoute role="STUDENT">
              <JobList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/applications"
          element={
            <ProtectedRoute role="STUDENT">
              <Applications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/cv-builder"
          element={
            <ProtectedRoute role="STUDENT">
              <CvBuilder />
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
      </Routes>
    </>
  );
}
