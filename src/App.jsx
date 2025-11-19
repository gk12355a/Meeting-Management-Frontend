import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
import ChangePasswordPageAdmin from './pages/admin/ChangePasswordPage';

// ===== User Pages =====
import UserDashboard from "./pages/user/DashboardPage";
import MyMeetingsPage from "./pages/user/MyMeetingsPage";
import CreateMeetingPage from "./pages/user/CreateMeetingPage";
import UserRoomsPage from "./pages/user/RoomsPage";
import HistoryPage from "./pages/user/HistoryPage";
import ProfilePage from "./pages/user/ProfilePage";
import ChangePasswordPageUser from './pages/user/ChangePasswordPage';
import DevicePage from "./pages/user/DevicePage";

// ===== Guards =====
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminOnlyRoute from "./routes/AdminOnlyRoute";

export default function App() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <>
      <Routes>
        {/* === 1️⃣ PUBLIC ROUTES === */}
        <Route element={<PublicLayout />}>
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <LoginPage key={isAuthenticated ? "auth" : "guest"} />
              ) : (
                <Navigate
                  to={isAdmin ? "/admin/dashboard" : "/user/dashboard"}
                  replace
                />
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

        {/* === 2️⃣ ADMIN ROUTES === */}
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
        </Route>

        {/* === 3️⃣ USER ROUTES === */}
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
          <Route path="rooms" element={<UserRoomsPage />} />
          <Route path="devices" element={<DevicePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="change-password" element={<ChangePasswordPageUser />} />
        </Route>

        {/* === 4️⃣ ROOT REDIRECT === */}
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

        {/* === 5️⃣ CATCH-ALL (404) === */}
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
      </Routes>

      {/* 🚀 ToastContainer thêm vào đây, không ảnh hưởng route */}
      <ToastContainer
        position="top-right"
        autoClose={2000}
        limit={3}
        pauseOnHover
        newestOnTop
        theme="light"
      />
    </>
  );
}
