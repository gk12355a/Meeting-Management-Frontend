import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as authApi from "../services/authService";
import * as userService from "../services/userService"; // <-- THÊM SERVICE
import api from "../utils/api";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  // === HÀM MỚI: KIỂM TRA VÀ TẢI PROFILE (Hỗ trợ SSO & Legacy) ===
  const checkAuth = async (current_token) => {
    if (!current_token) return;

    try {
      const decoded = jwtDecode(current_token);
      const expired = decoded.exp * 1000 < Date.now();

      if (expired) {
        logout(true);
        return;
      }

      // 1. Set token header
      api.defaults.headers.common["Authorization"] = current_token;

      // 2. GỌI API PROFILE MỚI (LẤY ID CHUẨN BACKEND)
      const profileRes = await userService.getMyProfile();
      const userProfile = profileRes.data; // { id, fullName, username, roles... }

      // 3. Set User object hoàn chỉnh
      setUser({
        id: userProfile.id, // <-- ID CHUẨN TỪ BACKEND
        username: userProfile.username || decoded.sub,
        fullName: userProfile.fullName,
        roles: userProfile.roles || decoded.roles || [],
      });

      return userProfile.roles || decoded.roles || [];
    } catch (err) {
      console.error("AuthCheck failed:", err);
      // Xóa token nếu không thể lấy profile (token lỗi hoặc không hợp lệ)
      logout(true);
    }
  };
  // ==========================================================

  // 🔁 Load token khi reload trang
  useEffect(() => {
    if (!token) {
      setInitializing(false);
      return;
    }

    // Nếu token tồn tại, chạy hàm kiểm tra/tải profile
    checkAuth(token).then(() => setInitializing(false));
  }, [token]);

  // 🟢 Login (Đã sửa để gọi API login và dùng useEffect để set user)
  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(username, password);
      const { accessToken, tokenType } = res.data;
      const fullToken = `${tokenType} ${accessToken}`;

      // Lưu token và set state (sẽ kích hoạt useEffect)
      localStorage.setItem("token", fullToken);
      setToken(fullToken);

      const decoded = jwtDecode(fullToken);
      return decoded.roles || [];

    } catch (error) {
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  // 🔴 Logout
  const logout = (silent = false) => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    setToken(null);
    if (!silent) navigate("/login");
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
        checkAuth, // <-- EXPORT checkAuth cho AuthorizedPage dùng
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);