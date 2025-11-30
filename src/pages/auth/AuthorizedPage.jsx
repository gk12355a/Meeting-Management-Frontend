// src/pages/auth/AuthorizedPage.jsx
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Result, Button, Spin, message } from "antd";
import { exchangeCodeForToken } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { jwtDecode } from "jwt-decode";

const AuthorizedPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth(); // Chỉ lấy checkAuth từ context

  useEffect(() => {
    const processLogin = async () => {
      const code = searchParams.get("code");

      // Không có code → redirect về login
      if (!code) {
        message.error("Lỗi: Không tìm thấy mã xác thực từ SSO!");
        navigate("/login");
        return;
      }

      try {
        // 1. Đổi code lấy token từ backend
        const data = await exchangeCodeForToken(code);
        const accessToken = data.access_token;

        if (!accessToken) {
          throw new Error("Không nhận được access_token từ server");
        }

        // 2. Lưu token + đánh dấu đây là đăng nhập bằng SSO
        localStorage.setItem("token", accessToken);
        localStorage.setItem("authProvider", "sso"); // THÊM DÒNG QUAN TRỌNG

        // 3. Cập nhật trạng thái auth trong Context (gọi API /me hoặc decode token)
        if (checkAuth) {
          await checkAuth();
        }

        // 4. Thông báo thành công
        message.success("Đăng nhập SSO thành công!");

        // 5. Điều hướng theo role
        const decoded = jwtDecode(accessToken);
        const roles = decoded.roles || decoded.authorities || [];

        if (roles.includes("ROLE_ADMIN") || roles.includes("ADMIN")) {
          window.location.href = "/admin/dashboard";
        } else {
          window.location.href = "/user/dashboard";
        }
      } catch (error) {
        console.error("SSO Login Error:", error);
        message.error("Đăng nhập SSO thất bại. Vui lòng thử lại.");
        localStorage.removeItem("token");
        localStorage.removeItem("authProvider");
        navigate("/login");
      }
    };

    processLogin();
  }, [searchParams, navigate, checkAuth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900">
      <Spin size="large" />
      <h2 className="mt-6 text-xl font-semibold text-gray-700 dark:text-gray-200">
        Đang xác thực với hệ thống SSO...
      </h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Vui lòng chờ trong giây lát
      </p>
    </div>
  );
};

export default AuthorizedPage;