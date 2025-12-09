// src/pages/user/CheckInProcessingPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Result, Button, Spin, Card } from "antd";
import { useAuth } from "../../context/AuthContext";
import { checkInWithQRCode } from "../../services/meetingService";
import { useTranslation } from "react-i18next";

const CheckInProcessingPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [status, setStatus] = useState("loading"); // loading | success | error
  // ({/* <span>Đang xử lý check-in...</span> */}
  //   <span>{t('checkIn:processing.loading')}</span>)
  const [title, setTitle] = useState(t('checkIn:processing.loading'));
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
        // ({/* <span>Check-in không thành công</span> */}
        //   <span>{t('checkIn:error.title')}</span>)
        setTitle(t('checkIn:error.title'));
        // ({/* <span>Mã QR bị thiếu. Vui lòng quét lại hoặc liên hệ người tổ chức.</span> */}
        //   <span>{t('checkIn:error.missingCode')}</span>)
        setSubTitle(t('checkIn:error.missingCode'));
        return;
      }

      try {
        await checkInWithQRCode(code);

        setStatus("success");
        // ({/* <span>Check-in thành công!</span> */}
        //   <span>{t('checkIn:success.title')}</span>)
        setTitle(t('checkIn:success.title'));
        // ({/* <span>Bạn đã được ghi nhận tham gia cuộc họp.</span> */}
        //   <span>{t('checkIn:success.message')}</span>)
        setSubTitle(t('checkIn:success.message'));
      } catch (err) {
        const statusCode = err?.response?.status;
        let backendMsg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Lỗi không xác định";

        // Nếu chuỗi có dạng HH:mm:ss.xxxxxx → cắt về HH:mm:ss
        backendMsg = backendMsg.replace(
          /(\d{2}:\d{2}:\d{2})\.\d+/,
          "$1"
        );

        setStatus("error");
        // ({/* <span>Check-in không thành công</span> */}
        //   <span>{t('checkIn:error.title')}</span>)
        setTitle(t('checkIn:error.title'));

        switch (statusCode) {
          case 400:
            setSubTitle(backendMsg);
            break;

          case 403:
            // ({/* <span>Bạn không nằm trong danh sách khách mời của cuộc họp này.</span> */}
            //   <span>{t('checkIn:error.notInvited')}</span>)
            setSubTitle(
              backendMsg || t('checkIn:error.notInvited')
            );
            break;

          case 404:
            // ({/* <span>Mã QR không hợp lệ. Vui lòng kiểm tra lại hoặc liên hệ người tổ chức.</span> */}
            //   <span>{t('checkIn:error.invalidCode')}</span>)
            setSubTitle(t('checkIn:error.invalidCode'));
            break;

          default:
            setSubTitle(backendMsg);
        }
      }
    };

    handleCheckIn();
  }, [code, navigate, location, isAuthenticated, t]);

  // UI Loading
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
        <Spin size="large" />
        <h2 className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
          {/* <span>Đang xác thực check-in...</span> */}
          <span>{t('checkIn:processing.verifying')}</span>
        </h2>
        {/* <span>Vui lòng đợi trong giây lát</span> */}
        <p className="text-gray-500">{t('checkIn:processing.pleaseWait')}</p>
      </div>
    );
  }

  const isSuccess = status === "success";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl dark:bg-slate-800 dark:border-slate-700">

        {/* ĐÃ XOÁ ICON TICK PHÍA TRÊN HOÀN TOÀN */}

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
              {/* <span>Về trang Lịch họp của tôi</span> */}
              <span>{t('checkIn:buttons.backToMeetings')}</span>
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
};

export default CheckInProcessingPage;