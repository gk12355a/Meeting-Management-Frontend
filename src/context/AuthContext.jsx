// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as authApi from "../services/authService";
import * as userService from "../services/userService"; 
import api from "../utils/api";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  // Hàm checkAuth (Giữ nguyên như file trước)
  const checkAuth = async (current_token) => {
    if (!current_token) return;
    try {
      const decoded = jwtDecode(current_token);
      const expired = decoded.exp * 1000 < Date.now();

      if (expired) {
        logout(true);
        return;
      }

      api.defaults.headers.common["Authorization"] = current_token;

      const profileRes = await userService.getMyProfile();
      const userProfile = profileRes.data;

      setUser({
        id: userProfile.id,
        username: userProfile.username || decoded.sub,
        fullName: userProfile.fullName,
        roles: userProfile.roles || decoded.roles || [],
      });

      return userProfile.roles || decoded.roles || [];
    } catch (err) {
      console.error("AuthCheck failed:", err);
      logout(true);
    }
  };

  useEffect(() => {
    if (!token) {
      setInitializing(false);
      return;
    }
    checkAuth(token).then(() => setInitializing(false));
  }, [token]);

  // === 🟢 SỬA HÀM LOGIN (Lưu thêm authProvider) ===
  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(username, password);
      const { accessToken, tokenType } = res.data;
      const fullToken = `${tokenType || "Bearer"} ${accessToken}`;

      localStorage.setItem("token", fullToken);
      localStorage.setItem("authProvider", "local"); // <-- LƯU CỜ NÀY
      
      setToken(fullToken);

      const decoded = jwtDecode(fullToken);
      await checkAuth(fullToken); // Load profile ngay

      return decoded.roles || [];
    } catch (error) {
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  // === 🔴 SỬA HÀM LOGOUT (Xử lý Redirect SSO) ===
  const logout = (silent = false) => {
    // 1. Kiểm tra loại đăng nhập trước khi xóa
    const provider = localStorage.getItem("authProvider");

    // 2. Xóa dữ liệu local
    localStorage.removeItem("token");
    localStorage.removeItem("authProvider");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    setToken(null);

    // 3. Điều hướng
    if (provider === "sso" && !silent) {
       // Nếu là SSO -> Chuyển hướng sang Auth Service để logout session bên đó
       window.location.href = authApi.getSSOLogoutUrl();
    } else if (!silent) {
       // Nếu là Local -> Về trang login bình thường
       navigate("/login");
    }
  };

  const isAuthenticated = !!token;
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  if (initializing) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-lg">
        Đang tải ứng dụng...
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        isAuthenticated,
        isAdmin,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);