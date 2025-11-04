// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Layouts
import AdminLayout from "./layouts/AdminLayout";
import PublicLayout from "./layouts/PublicLayout";

// Pages
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardPage from "./pages/admin/DashboardPage";
import UsersPage from "./pages/admin/UsersPage";
import DevicesPage from "./pages/admin/DevicesPage";
import ReportsPage from "./pages/admin/ReportsPage";

// Guards
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminOnlyRoute from "./routes/AdminOnlyRoute";

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route element={<PublicLayout />}>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/admin" replace />} 
        />
        <Route 
          path="/forgot-password" 
          element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to="/admin" replace />} 
        />
      </Route>

      {/* ADMIN ROUTES */}
      <Route 
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route element={<AdminOnlyRoute />}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="devices" element={<DevicesPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Route>

      {/* DEFAULT REDIRECT - Chỉ redirect nếu chưa đăng nhập */}
      <Route 
        path="/" 
        element={
          isAuthenticated 
            ? <Navigate to="/admin" replace /> 
            : <Navigate to="/login" replace />
        } 
      />
      
      {/* 404 - Redirect về login nếu chưa đăng nhập, admin nếu đã đăng nhập */}
      <Route 
        path="*" 
        element={
          isAuthenticated 
            ? <Navigate to="/admin" replace /> 
            : <Navigate to="/login" replace />
        } 
      />
    </Routes>
  );
}