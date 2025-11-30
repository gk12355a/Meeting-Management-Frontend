// src/pages/auth/AuthorizedPage.jsx
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Result, Button, Spin, message } from "antd"; // Import Result, Button, Spin
import { exchangeCodeForToken } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { jwtDecode } from "jwt-decode"; 

const AuthorizedPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Sửa lỗi: Chỉ lấy checkAuth. Bỏ setUser và setIsAuthenticated khỏi destructuring.
  const { checkAuth } = useAuth(); 

  useEffect(() => {
    const processLogin = async () => {
      const code = searchParams.get("code");

      if (!code) {
        message.error("Lỗi: Không tìm thấy mã xác thực!");
        navigate("/login");
        return;
      }

      try {
        // 1. Đổi code lấy token
        const data = await exchangeCodeForToken(code);
        const accessToken = data.access_token;

        if (accessToken) {
          // 2. Lưu token
          localStorage.setItem("token", accessToken);
          
          // 3. Cập nhật Context (Gọi hàm tổng hợp)
          if (checkAuth) {
             await checkAuth();
          }

          message.success("Đăng nhập SSO thành công!");
          
          // 4. Điều hướng (Decode để lấy role)
          const decoded = jwtDecode(accessToken);
          const roles = decoded.roles || [];
          
          message.success("Đăng nhập SSO thành công!");
          
          if (roles.includes("ROLE_ADMIN")) {
            window.location.href = "/admin/dashboard";
          } else {
            window.location.href = "/user/dashboard";
          }
        }
      } catch (error) {
        console.error("SSO Error:", error);
        message.error("Đăng nhập SSO thất bại. Vui lòng thử lại.");
        navigate("/login");
      }
    };

    processLogin();
  }, [searchParams, navigate, checkAuth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900">
      {/* ⚠️ Cảnh báo: antd v5 yêu cầu tip chỉ dùng trong nest hoặc fullscreen */}
      {/* Để tránh cảnh báo, ta chỉ cần dùng Spin mà không dùng tip */}
      <Spin size="large" />
      <h2 className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
        Đang xác thực với hệ thống SSO...
      </h2>
    </div>
  );
};

export default AuthorizedPage;