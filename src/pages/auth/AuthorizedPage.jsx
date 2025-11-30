// src/pages/auth/AuthorizedPage.jsx
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Spin, message } from "antd";
import { exchangeCodeForToken } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { jwtDecode } from "jwt-decode"; 

const AuthorizedPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
        const data = await exchangeCodeForToken(code);
        
        // Lấy cả access_token và id_token
        const { access_token, id_token } = data;

        if (access_token) {
          localStorage.setItem("token", access_token);
          localStorage.setItem("authProvider", "sso");

          // === QUAN TRỌNG: Lưu id_token để dùng khi logout ===
          if (id_token) {
            localStorage.setItem("id_token", id_token);
          }
          
          if (checkAuth) {
             await checkAuth();
          }

          message.success("Đăng nhập SSO thành công!");
          
          const decoded = jwtDecode(access_token);
          const roles = decoded.roles || [];
          
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
      <Spin size="large" />
      <h2 className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
        Đang xác thực với hệ thống SSO...
      </h2>
    </div>
  );
};

export default AuthorizedPage;