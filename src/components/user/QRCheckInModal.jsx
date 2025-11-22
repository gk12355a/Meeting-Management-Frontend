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
      width={800}
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
        {/* Divider */}
          <div className="border-t border-gray-200 dark:border-slate-600 my-5"></div>
      {/* Main Content: 2 columns layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left Column: QR Code */}
        <div className="flex flex-col items-center justify-center">
          <div 
            ref={qrRef}
            className="bg-white p-6 rounded-2xl shadow-lg border-4 border-gray-100 dark:border-gray-700"
          >
            {checkinCode ? (
              <QRCodeSVG
                value={checkinCode}
                size={240}
                level="H"
                includeMargin={true}
              />
            ) : (
              <div className="w-[240px] h-[240px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-400 text-sm">Không có mã check-in</span>
              </div>
            )}
          </div>

          {/* Meeting Title under QR */}
          {meetingTitle && (
            <div className="text-center mt-4 mb-2">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {meetingTitle}
              </h4>
            </div>
          )}

          {/* Download Button under QR */}
          <Button
            type="primary"
            icon={<FiDownload />}
            onClick={handleDownloadQR}
            disabled={!checkinCode}
            className="mt-2 bg-blue-600 hover:bg-blue-700 max-w-[280px]"
          >
            Tải xuống QR
          </Button>
        </div>

        {/* Right Column: Info & Instructions */}
        <div className="flex flex-col gap-4">
          {/* Check-in Code Display */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3.5 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">
              Mã check-in:
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-mono font-semibold text-gray-800 dark:text-gray-100 break-all flex-1">
                {checkinCode || "N/A"}
              </p>
              <Button
                icon={<FiCopy />}
                onClick={handleCopyCode}
                disabled={!checkinCode}
                size="small"
                className="!px-1 !py-0.5 !min-w-0 !h-7 text-xs"
                style={{ borderRadius: 5, fontSize: 12, height: 22, lineHeight: "18px" }}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Hướng dẫn sử dụng
            </h5>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                <span><strong>Thời gian check-in:</strong> Từ 30 phút trước đến khi cuộc họp bắt đầu</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                <span><strong>Cách sử dụng:</strong> Hiển thị mã QR cho người tham gia quét bằng camera điện thoại hoặc ứng dụng QR reader</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                <span><strong>Chia sẻ mã:</strong> Bạn có thể sao chép và gửi mã check-in cho người tham gia để họ nhập thủ công</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400 mt-0.5">⚠</span>
                <span className="text-red-700 dark:text-red-400"><strong>Lưu ý:</strong> Nếu không có người check-in trong thời gian quy định, cuộc họp sẽ tự động bị hủy</span>
              </li>
            </ul>
          </div>

          {/* Tips */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <strong>💡 Mẹo:</strong> In hoặc tải mã QR để dán tại cửa phòng họp, giúp việc check-in nhanh chóng hơn!
            </p>
          </div>
        </div>
      </div>

      {/* Footer: Close Button */}
      {/* <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button onClick={onClose} size="large">
          Đóng
        </Button>
      </div> */}

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