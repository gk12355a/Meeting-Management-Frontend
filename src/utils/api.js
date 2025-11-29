// src/utils/api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL;

// === 1. THÊM URL CỦA AI SERVICE ===
// Lấy từ biến môi trường hoặc dùng mặc định localhost:8000
export const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8000/api/chat";

if (!API_URL) {
  console.error("❌ VITE_BACKEND_URL is not defined! Check your .env file.");
}

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// 2. Liệt kê các route public (không cần token)
const PUBLIC_AUTH_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    // Kiểm tra route public
    const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some((route) =>
      config.url.endsWith(route)
    );

    // Logic đính kèm token
    if (token && !isPublicAuthRoute) {
      config.headers.Authorization = token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;