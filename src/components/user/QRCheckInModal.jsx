// src/components/user/QRCheckInModal.jsx
import React, { useRef } from "react";
import { Modal, Button, message } from "antd";
import { QRCodeSVG } from "qrcode.react";
import { FiDownload, FiCopy } from "react-icons/fi";

const QRCheckInModal = ({ open, onClose, checkinCode, meetingTitle }) => {
  const qrRef = useRef();

  // Hàm tải xuống QR code dưới dạng PNG
  const handleDownloadQR = () => {
    try {
      const svg = qrRef.current.querySelector("svg");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      // Tăng kích thước canvas để có chất lượng cao hơn
      const scale = 4;
      canvas.width = 300 * scale;
      canvas.height = 300 * scale;
      
      // Vẽ nền trắng
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Chuyển SVG thành image
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Tải xuống
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
      console.error("Lỗi khi tải xuống QR:", error);
      message.error("Không thể tải xuống mã QR!");
    }
  };

  // Hàm copy mã check-in
  const handleCopyCode = () => {
    navigator.clipboard.writeText(checkinCode).then(() => {
      message.success("Đã sao chép mã check-in!");
    }).catch(() => {
      message.error("Không thể sao chép mã!");
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
      centered
      title={
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
            Mã QR Check-in
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
            Quét mã để check-in vào cuộc họp
          </p>
        </div>
      }
      className="qr-checkin-modal"
    >
      <div className="flex flex-col items-center py-6">
        {/* QR Code Container */}
        <div 
          ref={qrRef}
          className="bg-white p-6 rounded-2xl shadow-lg mb-6 border-4 border-gray-100 dark:border-gray-700"
        >
          {checkinCode ? (
            <QRCodeSVG
              value={checkinCode}
              size={280}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "/logo.png", // Bạn có thể thêm logo vào giữa QR
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          ) : (
            <div className="w-[280px] h-[280px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-400">Không có mã check-in</span>
            </div>
          )}
        </div>

        {/* Meeting Title */}
        {meetingTitle && (
          <div className="text-center mb-4">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {meetingTitle}
            </h4>
          </div>
        )}

        {/* Check-in Code Display */}
        <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Mã check-in:
              </p>
              <p className="text-sm font-mono font-semibold text-gray-800 dark:text-gray-100 break-all">
                {checkinCode || "N/A"}
              </p>
            </div>
            <Button
              icon={<FiCopy />}
              onClick={handleCopyCode}
              className="ml-3"
              disabled={!checkinCode}
            >
              Sao chép
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="w-full bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-200 dark:border-blue-800">
          <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
            Hướng dẫn sử dụng:
          </h5>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
            <li>Hiển thị mã QR này cho người tham gia quét</li>
            <li>Người tham gia có thể quét mã bằng ứng dụng camera hoặc QR reader</li>
            <li>Sau khi quét, họ sẽ được check-in vào cuộc họp</li>
            <li>Bạn cũng có thể chia sẻ mã check-in trực tiếp</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full">
          <Button
            type="primary"
            icon={<FiDownload />}
            onClick={handleDownloadQR}
            disabled={!checkinCode}
            className="flex-1 h-10 bg-blue-600 hover:bg-blue-700"
          >
            Tải xuống QR
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 h-10"
          >
            Đóng
          </Button>
        </div>
      </div>

      <style jsx global>{`
        .qr-checkin-modal .ant-modal-header {
          border-bottom: none;
          padding-bottom: 0;
        }
        .qr-checkin-modal .ant-modal-body {
          padding-top: 0;
        }
        html.dark .qr-checkin-modal .ant-modal-content {
          background-color: #1e293b;
        }
        html.dark .qr-checkin-modal .ant-modal-header {
          background-color: #1e293b;
        }
      `}</style>
    </Modal>
  );
};

export default QRCheckInModal;