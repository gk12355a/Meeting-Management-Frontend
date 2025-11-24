// src/pages/user/CheckInProcessingPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Result, Button, Spin, Card } from "antd";
import { FiCheckCircle, FiXCircle, FiLogIn } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { checkInWithQRCode } from "../../services/meetingService";

const CheckInProcessingPage = () => {
  const { code } = useParams(); // Lấy mã từ URL /check-in/:code
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth(); // Giả sử AuthContext có isAuthenticated

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("Đang xử lý check-in...");
  const [subMessage, setSubMessage] = useState("");

  useEffect(() => {
    // 1. Kiểm tra Login [cite: 12]
    // Lưu ý: Kiểm tra token trong localStorage nếu isAuthenticated chưa kịp cập nhật
    const token = localStorage.getItem("token"); 
    
    if (!token) {
      // Chưa đăng nhập -> Redirect sang Login kèm URL để quay lại
      const returnUrl = encodeURIComponent(location.pathname);
      navigate(`/login?redirect=${returnUrl}`);
      return;
    }

    // 2. Gọi API Check-in [cite: 13]
    const handleCheckIn = async () => {
      try {
        await checkInWithQRCode(code);
        
        // [cite: 8] Check-in thành công
        setStatus("success");
        setMessage("Check-in thành công!");
        setSubMessage("Bạn đã được ghi nhận tham gia cuộc họp.");
      } catch (err) {
        // [cite: 14] Xử lý lỗi
        setStatus("error");
        const errorMsg = err.response?.data?.message || "Lỗi không xác định";
        const statusCode = err.response?.status;

        if (statusCode === 400) {
            // [cite: 19] Chưa đến giờ hoặc đã check-in
            setMessage("Không thể check-in");
            setSubMessage(errorMsg); // VD: "Chưa đến giờ điểm danh"
        } else if (statusCode === 403) {
            // [cite: 20] Không có trong danh sách
            setMessage("Không có quyền tham gia");
            setSubMessage("Bạn không có tên trong danh sách khách mời của cuộc họp này.");
        } else if (statusCode === 404) {
            // [cite: 21] Mã sai
            setMessage("Mã QR không hợp lệ");
            setSubMessage("Vui lòng kiểm tra lại mã QR hoặc liên hệ người tổ chức.");
        } else {
            setMessage("Lỗi hệ thống");
            setSubMessage(errorMsg);
        }
      }
    };

    if (code) {
      handleCheckIn();
    } else {
      setStatus("error");
      setMessage("Mã QR bị thiếu");
    }
  }, [code, navigate, location]);

  // --- RENDER UI [cite: 14] ---

  // 1. Màn hình Loading
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

  // 2. Màn hình Kết quả (Thành công hoặc Lỗi)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl dark:bg-slate-800 dark:border-slate-700">
        <Result
          status={status === "success" ? "success" : "error"}
          title={
            <span className="dark:text-white">
              {message}
            </span>
          }
          subTitle={
            <span className="dark:text-gray-400 text-base">
              {subMessage}
            </span>
          }
          extra={[
            <Button 
              type="primary" 
              key="home" 
              size="large"
              onClick={() => navigate('/user/my-meetings')}
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