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

  // === HÀM QUAN TRỌNG: CHECK AUTH VÀ LẤY PROFILE MỚI NHẤT ===
  const checkAuth = async (current_token) => {
    if (!current_token) return []; // Trả về mảng rỗng nếu không có token

    try {
      const decoded = jwtDecode(current_token);
      const expired = decoded.exp * 1000 < Date.now();

      if (expired) {
        logout(true);
        return [];
      }

      api.defaults.headers.common["Authorization"] = current_token;

      // 1. GỌI API ĐỂ LẤY ROLE MỚI NHẤT TỪ DATABASE 8080
      const profileRes = await userService.getMyProfile();
      const userProfile = profileRes.data; 

      // 2. Ưu tiên dùng Role từ API, nếu không có mới fallback về Token
      const finalRoles = userProfile.roles && userProfile.roles.length > 0 
                         ? userProfile.roles 
                         : (decoded.roles || []);

      setUser({
        id: userProfile.id,
        username: userProfile.username || decoded.sub,
        fullName: userProfile.fullName,
        roles: finalRoles, // Lưu Role chuẩn vào State
      });

      // 3. QUAN TRỌNG: Return Role ra ngoài để logic điều hướng sử dụng
      return finalRoles; 

    } catch (err) {
      console.error("AuthCheck failed:", err);
      logout(true);
      return [];
    }
  };

  useEffect(() => {
    if (!token) {
      setInitializing(false);
      return;
    }
    checkAuth(token).then(() => setInitializing(false));
  }, [token]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(username, password);
      const { accessToken, tokenType } = res.data;
      const fullToken = `${tokenType || "Bearer"} ${accessToken}`;

      localStorage.setItem("token", fullToken);
      localStorage.setItem("authProvider", "local");
      setToken(fullToken);

      // Gọi checkAuth để lấy Role chuẩn từ DB thay vì decode token cũ
      const roles = await checkAuth(fullToken); 
      return roles; // Trả về role chuẩn cho LoginPage
    } catch (error) {
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  const logout = (silent = false) => {
    const provider = localStorage.getItem("authProvider");
    const idToken = localStorage.getItem("id_token"); // <--- Lấy ID Token

    localStorage.removeItem("token");
    localStorage.removeItem("authProvider");
    localStorage.removeItem("id_token"); // <--- Xóa ID Token
    delete api.defaults.headers.common["Authorization"];
    
    setUser(null);
    setToken(null);

    if (provider === "sso" && !silent) {
       // Truyền idToken vào hàm để tạo URL đúng chuẩn OIDC
       // Hàm getSSOLogoutUrl sẽ trả về URL tới Auth Service (port 9000)
       window.location.href = authApi.getSSOLogoutUrl(idToken);
    } else if (!silent) {
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
      value={{ user, token, login, logout, loading, isAuthenticated, isAdmin, checkAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);