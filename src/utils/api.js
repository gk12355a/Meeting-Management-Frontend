// src/utils/api.js
import axios from "axios";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_BACKEND_URL;
export const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000/api/chat";

if (!API_URL) {
  console.error("❌ VITE_BACKEND_URL is not defined! Check your .env file.");
}

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Danh sách các route không cần token
const PUBLIC_AUTH_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

// ============================================================
// 1. REQUEST INTERCEPTOR (SỬA THEO YÊU CẦU BACKEND)
// ============================================================
api.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage (Key là 'token' như đã thống nhất ở AuthContext)
    let token = localStorage.getItem("token");

    // Kiểm tra xem request này có cần token không
    const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some((route) =>
      config.url.includes(route)
    );

    if (token && !isPublicAuthRoute) {
      // --- 🎯 FIX LOGIC BEARER (QUAN TRỌNG) ---
      token = token.trim(); // Xóa khoảng trắng thừa (nếu có)

      // Luôn đảm bảo token bắt đầu bằng "Bearer "
      if (!token.startsWith("Bearer ")) {
        token = `Bearer ${token}`;
      }

      config.headers.Authorization = token;
    } else {
      // Nếu không có token hoặc là route public, xóa header để tránh lỗi
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// 2. RESPONSE INTERCEPTOR (GIỮ NGUYÊN LOGIC CHẶN LOOP)
// ============================================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    
    const errorData = error.response?.data;
    const errorMessage = (typeof errorData === 'string' ? errorData : errorData?.message || errorData?.error || "").toLowerCase();

    if (status === 401) {
      // Case 1: Tài khoản bị khóa (Disabled/Inactive)
      if (errorMessage.includes("disabled") || 
          errorMessage.includes("locked") || 
          errorMessage.includes("inactive") ||
          errorMessage.includes("vô hiệu") ||
          errorMessage.includes("bị khóa")) {
          
        console.error("⛔ Tài khoản bị khóa. Dừng redirect.");
        localStorage.removeItem("token");
        localStorage.removeItem("authProvider");
        localStorage.removeItem("id_token");
        
        toast.error("Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Admin.");
        window.location.href = "/login";
        
        return Promise.reject(error);
      }

      // Case 2: Token hết hạn -> Đá về login
      console.warn("⚠️ Token hết hạn hoặc không hợp lệ.");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;