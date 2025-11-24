// src/components/user/QRCheckInModal.jsx
import React, { useRef } from "react";
import { Modal, Button, message, Tooltip } from "antd";
import { QRCodeSVG } from "qrcode.react";
import { FiDownload, FiCopy, FiLink } from "react-icons/fi";

const QRCheckInModal = ({ open, onClose, checkinCode, meetingTitle }) => {
  const qrRef = useRef();

  // 1. Tạo Magic Link (URL đầy đủ để quét là mở luôn)
  // Ví dụ: http://localhost:5173/check-in/550e8400-e29b...
  const checkInUrl = checkinCode 
    ? `${window.location.origin}/check-in/${checkinCode}` 
    : "";

  // Hàm tải xuống QR code
  const handleDownloadQR = () => {
    if (!checkinCode) return;
    try {
      const svg = qrRef.current.querySelector("svg");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const scale = 4; // Tăng độ phân giải
      canvas.width = 300 * scale;
      canvas.height = 300 * scale;

      // Vẽ nền trắng (để tránh trong suốt khi in)
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          const link = document.createElement("a");
          link.download = `QR-CheckIn-${meetingTitle || "Meeting"}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(url);
          message.success("Đã tải xuống mã QR!");
        });
      };
      img.src = url;
    } catch (error) {
      console.error("Lỗi tải QR:", error);
      message.error("Không thể tải xuống mã QR!");
    }
  };

  // Copy mã code (để nhập thủ công)
  const handleCopyCode = () => {
    navigator.clipboard.writeText(checkinCode).then(() => {
      message.success("Đã sao chép mã check-in!");
    });
  };

  // Copy đường dẫn (để gửi cho người khác)
  const handleCopyLink = () => {
    navigator.clipboard.writeText(checkInUrl).then(() => {
      message.success("Đã sao chép đường dẫn check-in!");
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      title={
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
            Mã QR Check-in
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
            Quét mã để điểm danh tự động vào cuộc họp
          </p>
        </div>
      }
      className="qr-checkin-modal"
    >
      <div className="border-t border-gray-200 dark:border-slate-600 my-5"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        {/* Cột trái: Mã QR */}
        <div className="flex flex-col items-center justify-center">
          <div 
            ref={qrRef}
            className="bg-white p-4 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-700"
          >
            {checkinCode ? (
                <QRCodeSVG
                  value={checkInUrl} // <-- QUAN TRỌNG: Dùng URL thay vì mã code thô
                  size={220}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                      // Đảm bảo bạn có file logo này trong thư mục public
                      src: "/logo-meetflow.png", 
                      height: 30,
                      width: 47,
                      excavate: true,
                  }}
                />
            ) : (
              <div className="w-[220px] h-[220px] flex items-center justify-center bg-gray-100 rounded-lg">
                <span className="text-gray-400 text-xs">Đang tạo mã...</span>
              </div>
            )}
          </div>

          {meetingTitle && (
            <div className="text-center mt-4 mb-3 px-4">
              <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100 line-clamp-2">
                {meetingTitle}
              </h4>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
                onClick={handleDownloadQR} 
                disabled={!checkinCode}
                icon={<FiDownload />}
            >
                Lưu ảnh
            </Button>
            <Tooltip title="Sao chép đường dẫn check-in">
                <Button 
                    onClick={handleCopyLink} 
                    disabled={!checkinCode}
                    icon={<FiLink />}
                >
                    Copy Link
                </Button>
            </Tooltip>
          </div>
        </div>

        {/* Cột phải: Thông tin & Hướng dẫn */}
        <div className="flex flex-col gap-5 justify-center">
          
          {/* Box hiển thị Mã Text */}
          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-bold tracking-wider">
              Mã nhập thủ công
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 px-3 py-2 rounded border border-gray-200 dark:border-slate-600 break-all">
                {checkinCode || "..."}
              </code>
              <Tooltip title="Sao chép mã">
                <Button
                    icon={<FiCopy />}
                    onClick={handleCopyCode}
                    disabled={!checkinCode}
                />
              </Tooltip>
            </div>
          </div>

          {/* Hướng dẫn */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
            <h5 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3">
              Hướng dẫn điểm danh
            </h5>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-2.5">
              <li className="flex gap-2">
                <span className="font-bold">1.</span>
                <span>Mở Camera điện thoại hoặc ứng dụng quét QR.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">2.</span>
                <span>Quét mã bên cạnh để mở trang Check-in.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold">3.</span>
                <span>Nếu không quét được, hãy truy cập đường dẫn hoặc nhập mã thủ công ở trên.</span>
              </li>
            </ul>
          </div>
          
          <p className="text-xs text-center text-gray-400 italic">
             Mã này chỉ hiệu lực trong thời gian diễn ra cuộc họp.
          </p>
        </div>
      </div>

      <style jsx global>{`
        .qr-checkin-modal .ant-modal-content {
          padding: 0;
          border-radius: 16px;
          overflow: hidden;
        }
        .qr-checkin-modal .ant-modal-header {
          padding: 20px 24px 0;
          border-bottom: none;
          margin-bottom: 0;
        }
        .qr-checkin-modal .ant-modal-body {
          padding: 0 24px 24px;
        }
        html.dark .qr-checkin-modal .ant-modal-content,
        html.dark .qr-checkin-modal .ant-modal-header {
          background-color: #1e293b;
        }
        html.dark .qr-checkin-modal .ant-modal-title {
             color: white;
        }
      `}</style>
    </Modal>
  );
};

export default QRCheckInModal;