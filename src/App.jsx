import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// ===== Layouts =====
import AdminLayout from "./layouts/AdminLayout";
import UserLayout from "./layouts/UserLayout";
import PublicLayout from "./layouts/PublicLayout";

// ===== Public Pages =====
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// ===== Admin Pages =====
import Dashboard from "./pages/admin/DashboardPage";
import Users from "./pages/admin/UsersPage";
import Rooms from "./pages/admin/RoomsPage";
import Devices from "./pages/admin/DevicesPage";
import Reports from "./pages/admin/ReportsPage";
import ChangePasswordPageAdmin from "./pages/admin/ChangePasswordPage";
import AdminProfilePage from "./pages/admin/ProfilePage";
// ===== User Pages =====
import UserDashboard from "./pages/user/DashboardPage";
import MyMeetingsPage from "./pages/user/MyMeetingsPage";
import CreateMeetingPage from "./pages/user/CreateMeetingPage";
import ContactGroupsPage from "./pages/user/ContactGroupsPage";
import UserRoomsPage from "./pages/user/RoomsPage";
import HistoryPage from "./pages/user/HistoryPage";
import ProfilePage from "./pages/user/ProfilePage";
import ChangePasswordPageUser from "./pages/user/ChangePasswordPage";
import DevicePage from "./pages/user/DevicePage";
import CheckInProcessingPage from "./pages/user/CheckInProcessingPage";
import VideoPage from "./pages/user/VideoPage";
import ImageSearchPage from "./pages/user/ImageSearchPage";
// ===== Guards =====
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminOnlyRoute from "./routes/AdminOnlyRoute";
import AuthorizedPage from "./pages/auth/AuthorizedPage";
// ===== Google OAuth Callback Page =====
import GoogleCallbackPage from "./pages/GoogleCallbackPage";

import "./i18n";

export default function App() {
  const { isAuthenticated, isAdmin, user, loading } = useAuth();

  return (
    <>
      <Routes>
        {/* === PUBLIC ROUTES === */}
        <Route element={<PublicLayout />}>
          <Route path="/authorized" element={<AuthorizedPage />} />
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <LoginPage key={isAuthenticated ? "auth" : "guest"} />
              ) : (
                // Nếu đang loading hoặc chưa có user profile -> Chờ, tránh redirect nhầm
                loading || !user ? (
                  <div className="flex items-center justify-center p-4">Đang xử lý...</div>
                ) : (
                  <Navigate
                    to={isAdmin ? "/admin/dashboard" : "/user/dashboard"}
                    replace
                  />
                )
              )
            }
          />
          <Route
            path="/forgot-password"
            element={
              !isAuthenticated ? (
                <ForgotPasswordPage />
              ) : (
                <Navigate
                  to={isAdmin ? "/admin/dashboard" : "/user/dashboard"}
                  replace
                />
              )
            }
          />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* === ADMIN ROUTES === */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <AdminLayout />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="devices" element={<Devices />} />
          <Route path="reports" element={<Reports />} />
          <Route path="change-password" element={<ChangePasswordPageAdmin />} />
          <Route path="profile" element={<AdminProfilePage />} />
        </Route>

        {/* === USER ROUTES === */}
        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="my-meetings" element={<MyMeetingsPage />} />
          <Route path="create-meeting" element={<CreateMeetingPage />} />
          <Route path="contact-groups" element={<ContactGroupsPage />} />
          <Route path="rooms" element={<UserRoomsPage />} />
          <Route path="devices" element={<DevicePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="change-password" element={<ChangePasswordPageUser />} />
          <Route path="image-search" element={<ImageSearchPage />} />
        </Route>
        <Route path="/meeting/:meetingId" element={<VideoPage />} />
        {/* === GOOGLE OAUTH CALLBACK === */}
        <Route path="/google-callback" element={<GoogleCallbackPage />} />

        {/* === ROOT REDIRECT === */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate
                to={isAdmin ? "/admin/dashboard" : "/user/dashboard"}
                replace
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* === CATCH-ALL (404) === */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                isAuthenticated
                  ? isAdmin
                    ? "/admin/dashboard"
                    : "/user/dashboard"
                  : "/login"
              }
              replace
            />
          }
        />
        <Route path="/check-in/:code" element={<CheckInProcessingPage />} />
      </Routes>
    </>
  );
}
