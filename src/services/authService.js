// src/services/authService.js
import api from "../utils/api";
import axios from "axios";

const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || "http://localhost:9000";
const CLIENT_ID = import.meta.env.VITE_OAUTH2_CLIENT_ID || "meeting-client";
const CLIENT_SECRET = import.meta.env.VITE_OAUTH2_CLIENT_SECRET || "secret";
const REDIRECT_URI = import.meta.env.VITE_OAUTH2_REDIRECT_URI || "http://localhost:5173/authorized";

/**
 * [CẬP NHẬT] Lấy URL đăng xuất chuẩn Spring Security (/logout)
 * Thay vì dùng OIDC (/connect/logout) để đảm bảo xóa cookie triệt để.
 */
export const getSSOLogoutUrl = () => {
  // Gửi kèm post_logout_redirect_uri nếu Backend có hỗ trợ đọc tham số này tại endpoint /logout
  // Nếu Backend set cứng logoutSuccessUrl thì tham số này có thể thừa nhưng không gây lỗi.
  return `${AUTH_SERVICE_URL}/logout`;
};

/**
 * [KIỂM TRA] Hàm này đã đúng chuẩn OAuth2 như Backend yêu cầu
 */
export const loginWithSSO = () => {
  const authUrl = `${AUTH_SERVICE_URL}/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&scope=openid profile meeting:read meeting:write&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  window.location.href = authUrl;
};

// ... (Các hàm exchangeCodeForToken, login, register... Giữ nguyên không đổi)
export const exchangeCodeForToken = async (code) => {
    const tokenUrl = `${AUTH_SERVICE_URL}/oauth2/token`;
    const basicAuth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", REDIRECT_URI);
  
    try {
      const response = await axios.post(tokenUrl, params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${basicAuth}`
        }
      });
      return response.data; 
    } catch (error) {
      console.error("SSO Token Exchange Error:", error);
      throw error;
    }
};

export const login = (username, password) => {
  return api.post("/auth/login", { username, password });
};
export const register = (data) => api.post("/auth/register", data);
export const forgotPassword = (data) => api.post("/auth/forgot-password", data);
export const resetPassword = (data) => api.post("/auth/reset-password", data);
export const changePassword = (oldPassword, newPassword) => {
  return api.post('/auth/change-password', { oldPassword, newPassword });
};