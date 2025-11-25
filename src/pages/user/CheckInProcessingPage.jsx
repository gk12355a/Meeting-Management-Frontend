// src/pages/user/CheckInProcessingPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Result, Button, Spin, Card } from "antd";
import { useAuth } from "../../context/AuthContext";
import { checkInWithQRCode } from "../../services/meetingService";

const CheckInProcessingPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [title, setTitle] = useState("Đang xử lý check-in...");
  const [subTitle, setSubTitle] = useState("");

  useEffect(() => {
    // Kiểm tra login
    const token = localStorage.getItem("token");
    if (!token) {
      const returnUrl = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${returnUrl}`);
      return;
    }

    const handleCheckIn = async () => {
      if (!code) {
        setStatus("error");
        setTitle("Check-in không thành công");
        setSubTitle("Mã QR bị thiếu. Vui lòng quét lại hoặc liên hệ người tổ chức.");
        return;
      }

      try {
        await checkInWithQRCode(code);

        setStatus("success");
        setTitle("Check-in thành công!");
        setSubTitle("Bạn đã được ghi nhận tham gia cuộc họp.");
      } catch (err) {
        const statusCode = err?.response?.status;
        const backendMsg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Lỗi không xác định";

        setStatus("error");
        setTitle("Check-in không thành công");

        switch (statusCode) {
          case 400:
            setSubTitle(backendMsg);
            break;

          case 403:
            setSubTitle(
              backendMsg || "Bạn không nằm trong danh sách khách mời của cuộc họp này."
            );
            break;

          case 404:
            setSubTitle("Mã QR không hợp lệ. Vui lòng kiểm tra lại hoặc liên hệ người tổ chức.");
            break;

          default:
            setSubTitle(backendMsg);
        }
      }
    };

    handleCheckIn();
  }, [code, navigate, location, isAuthenticated]);

  // UI Loading
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
        <Spin size="large" />
        <h2 className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
          Đang xác thực check-in...
        </h2>
        <p className="text-gray-500">Vui lòng đợi trong giây lát</p>
      </div>
    );
  }

  const isSuccess = status === "success";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
<Card className="w-full max-w-md shadow-xl rounded-2xl dark:bg-slate-800 dark:border-slate-700">

        {/* ❌ ĐÃ XOÁ ICON TICK PHÍA TRÊN HOÀN TOÀN */}

        <Result
          status={isSuccess ? "success" : "error"}
          title={<span className="dark:text-white">{title}</span>}
          subTitle={<span className="dark:text-gray-400 text-base">{subTitle}</span>}
          extra={[
            <Button
              type="primary"
              key="home"
              size="large"
              onClick={() => navigate("/user/my-meetings")}
              className="bg-blue-600 hover:bg-blue-700 w-full"
            >
              Về trang Lịch họp của tôi
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
};

export default CheckInProcessingPage;
