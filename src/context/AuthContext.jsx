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

  // === HÀM HỖ TRỢ: XÓA COOKIES CLIENT ===
  const clearAllCookies = () => {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      // Đặt ngày hết hạn về quá khứ để trình duyệt tự xóa
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
  };

  // === CHECK AUTH ===
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

      // Gọi API lấy thông tin chi tiết (để lấy ID chuẩn từ Backend)
      try {
        const profileRes = await userService.getMyProfile();
        const userProfile = profileRes.data;

        setUser({
          id: userProfile.id,
          username: userProfile.username || decoded.sub,
          fullName: userProfile.fullName,
          roles: userProfile.roles || decoded.roles || [],
        });
        
        return userProfile.roles || decoded.roles || [];
      } catch (profileErr) {
        console.error("Lỗi lấy profile:", profileErr);
        // Fallback tạm thời nếu API profile lỗi
        setUser({
            username: decoded.sub,
            roles: decoded.roles || []
        });
      }

    } catch (err) {
      console.error("Token invalid:", err);
      logout(true);
    }
  };

  useEffect(() => {
    if (!token) {
      setInitializing(false);
      return;
    }
    checkAuth(token).finally(() => setInitializing(false));
  }, [token]);

  // 🟢 LOGIN
  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(username, password);
      const { accessToken, tokenType } = res.data;
      const fullToken = `${tokenType || "Bearer"} ${accessToken}`;

      localStorage.setItem("token", fullToken);
      localStorage.setItem("authProvider", "local");
      setToken(fullToken);

      const roles = await checkAuth(fullToken);
      return roles || [];

    } catch (error) {
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  // 🔴 LOGOUT (Nâng cấp)
  const logout = (silent = false) => {
    // 1. Lấy thông tin cần thiết trước khi xóa
    const provider = localStorage.getItem("authProvider");
    const idToken = localStorage.getItem("id_token");

    // 2. Dọn dẹp LocalStorage (Frontend)
    localStorage.removeItem("token");
    localStorage.removeItem("authProvider");
    localStorage.removeItem("id_token");
    
    // 3. Dọn dẹp Cookies (Frontend - nếu có)
    clearAllCookies();

    // 4. Reset State
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    setToken(null);

    // 5. Điều hướng & Dọn dẹp Session Server (Backend)
    if (provider === "sso" && !silent) {
       // Redirect sang Auth Service để xóa Cookie Server
       window.location.href = authApi.getSSOLogoutUrl(idToken);
    } else if (!silent) {
       // Nếu là Local Login -> Về trang Login
       navigate("/login");
    }
  };

  const isAuthenticated = !!token;
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  if (initializing) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-lg">
        Đang tải dữ liệu...
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