// src/utils/api.js
import axios from "axios";
import { toast } from "react-toastify";

// Helper function to get environment variables (Runtime > Build time)
const getEnv = (key) => window.ENV?.[key] || import.meta.env[key];

// 1. Lấy cấu hình môi trường
const API_URL = getEnv("VITE_BACKEND_URL");
const AUTH_SERVICE_URL = getEnv("VITE_AUTH_SERVICE_URL") || "http://oauth-meeting.co";

// Export URL Chatbot để dùng ở các file khác
export const AI_SERVICE_URL = getEnv("VITE_AI_SERVICE_URL") || "http://ai-meeting.co/api/chat";
export const TEXT_SEARCH_API = getEnv("VITE_TEXT_SEARCH_API");
export const MULTIMEDIA_SEARCH_API = getEnv("VITE_MULTIMEDIA_SEARCH_API");

if (!API_URL) {
  console.error("❌ VITE_BACKEND_URL chưa được định nghĩa (kiểm tra window.ENV hoặc .env)");
}

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Danh sách các API không cần gửi Token
const PUBLIC_AUTH_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

// ============================================================
// 2. REQUEST INTERCEPTOR (Gửi Token đi)
// ============================================================
api.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage
    let token = localStorage.getItem("token");

    // Kiểm tra xem URL hiện tại có thuộc danh sách Public không
    const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some((route) =>
      config.url.includes(route)
    );

    if (token && !isPublicAuthRoute) {
      token = token.trim(); // Xóa khoảng trắng thừa
      
      // Kiểm tra và thêm tiền tố Bearer nếu thiếu (Quan trọng cho Backend Java)
      if (!token.startsWith("Bearer ")) {
        token = `Bearer ${token}`;
      }
      
      config.headers.Authorization = token;
    } else {
      // Xóa header nếu không cần thiết để tránh gửi rác
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// 3. RESPONSE INTERCEPTOR (Xử lý lỗi trả về)
// ============================================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;

    // Trường hợp mất mạng hoặc Server sập
    if (!response) {
      // toast.error("Không thể kết nối đến máy chủ.");
      return Promise.reject(error);
    }

    const status = response.status;
    const errorData = response.data; // Body JSON lỗi từ Backend

    // === XỬ LÝ LỖI 401 (UNAUTHORIZED) ===
    if (status === 401) {
      
      // 🔴 CASE 1: TÀI KHOẢN BỊ KHÓA (Backend trả mã: USER_DISABLED)
      if (errorData?.error === "USER_DISABLED") {
        console.error("⛔ TÀI KHOẢN BỊ KHÓA - ĐANG ĐĂNG XUẤT...");

        // 1. Dọn dẹp dữ liệu ở Frontend
        localStorage.clear(); 
        
        // 2. Thông báo cho người dùng
        toast.error("Tài khoản đã bị vô hiệu hóa. Đang đăng xuất...", {
          toastId: "account-disabled" // Tránh hiện trùng lặp
        });

        // 3. Force Redirect sang trang Logout của SSO (Port 9000)
        // Backend (9000) sẽ xóa Cookie và tự động đá về trang Login (5173)
        const logoutUrl = `${AUTH_SERVICE_URL}/logout`;
        window.location.href = logoutUrl;

        // 4. Treo Promise để chặn các xử lý tiếp theo của React (tránh lỗi render)
        return new Promise(() => {}); 
      }

      // ⚠️ CASE 2: TOKEN HẾT HẠN HOẶC KHÔNG HỢP LỆ
      // Chỉ xử lý nếu user KHÔNG đang ở trang Login (để tránh vòng lặp vô tận tại trang login)
      if (!window.location.pathname.startsWith("/login")) {
        console.warn("⚠️ Token hết hạn. Vui lòng đăng nhập lại.");
        
        // Xóa token cũ
        localStorage.removeItem("token");
        localStorage.removeItem("authProvider");
        localStorage.removeItem("id_token");
        
        // Chuyển về trang login nội bộ
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;