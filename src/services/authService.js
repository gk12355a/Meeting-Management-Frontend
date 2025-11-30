// src/services/authService.js
import api from "../utils/api";
import axios from "axios";

// Lấy cấu hình từ biến môi trường (có giá trị mặc định để tránh lỗi nếu quên config)
const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || "http://localhost:9000";
const CLIENT_ID = import.meta.env.VITE_OAUTH2_CLIENT_ID || "meeting-client";
const CLIENT_SECRET = import.meta.env.VITE_OAUTH2_CLIENT_SECRET || "secret";
const REDIRECT_URI = import.meta.env.VITE_OAUTH2_REDIRECT_URI || "http://localhost:5173/authorized";
export const getSSOLogoutUrl = () => {
  // 1. Xác định địa chỉ muốn quay về (Trang Login của Frontend)

  
  // 2. Gửi kèm tham số redirect (thường là 'post_logout_redirect_uri' hoặc 'redirect_uri')
  // Tùy thuộc vào cấu hình Backend của bạn, hãy thử dòng dưới:
  return `http://localhost:5173/login`;
};
/**
 * [SSO] Chuyển hướng người dùng sang trang đăng nhập của Auth Service
 */
export const loginWithSSO = () => {
  // Xây dựng URL Authorization Code Flow
  const authUrl = `${AUTH_SERVICE_URL}/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&scope=openid profile meeting:read meeting:write&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  
  // Chuyển hướng trình duyệt
  window.location.href = authUrl;
};

/**
 * [SSO] Đổi Authorization Code lấy Access Token
 * @param {string} code - Mã code nhận được từ URL callback
 */
export const exchangeCodeForToken = async (code) => {
  const tokenUrl = `${AUTH_SERVICE_URL}/oauth2/token`;
  
  // Tạo Basic Auth Header (Base64 của client_id:client_secret)
  const basicAuth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);

  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", REDIRECT_URI);

  try {
    // Gọi trực tiếp bằng axios (không qua interceptor của api.js) vì đây là Auth Server
    const response = await axios.post(tokenUrl, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${basicAuth}`
      }
    });
    return response.data; // Trả về { access_token, refresh_token, ... }
  } catch (error) {
    console.error("SSO Token Exchange Error:", error);
    throw error;
  }
};

// === CÁC HÀM AUTH CŨ (Giữ nguyên) ===

// Đăng nhập thường (Username/Password)
export const login = (username, password) => {
  return api.post("/auth/login", { username, password });
};

export const register = (data) => api.post("/auth/register", data);
export const forgotPassword = (data) => api.post("/auth/forgot-password", data);
export const resetPassword = (data) => api.post("/auth/reset-password", data);
export const changePassword = (oldPassword, newPassword) => {
  return api.post('/auth/change-password', { 
    oldPassword,
    newPassword
  });
};