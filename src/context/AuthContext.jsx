import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as authApi from "../services/authService";
import api from "../utils/api";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [initializing, setInitializing] = useState(true); 
  const [loading, setLoading] = useState(false);

  // 🔁 Load token khi reload trang
  useEffect(() => {
    if (!token) {
      setInitializing(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const expired = decoded.exp * 1000 < Date.now();

      if (expired) {
        logout(true);
      } else {
        api.defaults.headers.common["Authorization"] = token;
        setUser({
          id: decoded.userId,
          username: decoded.sub,
          roles: decoded.roles || [],
        });
      }
    } catch (err) {
      logout(true);
    }

    setInitializing(false);
  }, [token]);

  // 🟢 Login (Fix lỗi sau khi logout → login sai không hiện toast)
  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(username, password);
      const { accessToken, tokenType } = res.data;
      const fullToken = `${tokenType} ${accessToken}`;

      // Lưu token
      localStorage.setItem("token", fullToken);
      api.defaults.headers.common["Authorization"] = fullToken;
      setToken(fullToken);

      const decoded = jwtDecode(fullToken);
      setUser({
        id: decoded.userId,
        username: decoded.sub,
        roles: decoded.roles || [],
      });

      return decoded.roles || [];
    } catch (error) {
      return Promise.reject(error); // ❗ luôn trả lỗi để LoginPage nhận toast
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
