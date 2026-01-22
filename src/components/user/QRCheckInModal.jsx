// src/components/user/QRCheckInModal.jsx
import React, { useRef } from "react";
import { Modal, Tooltip, message } from "antd";
import { QRCodeSVG } from "qrcode.react";
import { FiDownload, FiCopy, FiLink, FiInfo, FiCheckCircle, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

const QRCheckInModal = ({ open, onClose, checkinCode, meetingTitle }) => {
  const qrRef = useRef();
  const { t } = useTranslation(['qr', 'common']);

  // 1. Tạo Magic Link
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
      const scale = 4;
      canvas.width = 300 * scale;
      canvas.height = 300 * scale;

      // Vẽ nền trắng 
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
          message.success(t('qr:qr.messages.downloadSuccess'));
        });
      };
      img.src = url;
    } catch (error) {
      console.error("Lỗi tải QR:", error);
      message.error(t('qr:qr.messages.downloadError'));
    }
  };

  // Copy mã code (để nhập thủ công)
  const handleCopyCode = () => {
    navigator.clipboard.writeText(checkinCode).then(() => {
      message.success(t('qr:qr.messages.copyCodeSuccess'));
    });
  };

  // Copy đường dẫn (để gửi cho người khác)
  const handleCopyLink = () => {
    navigator.clipboard.writeText(checkInUrl).then(() => {
      message.success(t('qr:qr.messages.copyLinkSuccess'));
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={750}
      centered
      closeIcon={null}
      className="qr-checkin-modal"
      wrapClassName="backdrop-blur-sm"
      styles={{
        content: {
          padding: 0,
          borderRadius: "24px",
          overflow: "hidden",
          backgroundColor: "transparent",
          boxShadow: "none",
        }
      }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors z-10"
        >
          <FiX size={24} />
        </button>

        {/* Left Side: QR Code Area */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-emerald-500 to-teal-700 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Background Patterns */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white blur-xl"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-teal-300 blur-2xl"></div>
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="z-10 bg-white p-4 rounded-2xl shadow-2xl mb-6 transform transition-transform hover:scale-105 duration-300"
            ref={qrRef}
          >
            {checkinCode ? (
              <QRCodeSVG
                value={checkInUrl}
                size={180}
                level="H"
                includeMargin={true}
                imageSettings={{
                  src: "/logo-6X6.png",
                  height: 24,
                  width: 38,
                  excavate: true,
                }}
              />
            ) : (
              <div className="w-[180px] h-[180px] flex items-center justify-center bg-gray-50 rounded-lg">
                <span className="text-gray-400 text-xs animate-pulse">
                  {t('qr:qr.messages.generating')}
                </span>
              </div>
            )}
          </motion.div>

          <h3 className="text-white font-bold text-xl mb-1 z-10">{t('qr:qr.title')}</h3>
          <p className="text-emerald-100 text-sm opacity-90 z-10">{t('qr:qr.subtitle')}</p>
        </div>

        {/* Right Side: Content & Actions */}
        <div className="w-full md:w-7/12 p-8 flex flex-col">
          <div className="flex-1">
            {meetingTitle && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                  Check-in cho cuộc họp
                </h4>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                  {meetingTitle}
                </h2>
              </div>
            )}

            {/* Manual Code Section */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 block">
                {t('qr:qr.manualCode')}
              </label>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex-1 px-3 py-2 font-mono text-lg font-bold text-slate-700 dark:text-slate-200 tracking-wider text-center select-all">
                  {checkinCode || "..."}
                </div>
                <Tooltip title={t('qr:qr.buttons.copyCode')}>
                  <button
                    onClick={handleCopyCode}
                    disabled={!checkinCode}
                    className="p-2.5 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg shadow-sm hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <FiCopy size={18} />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={handleDownloadQR}
                disabled={!checkinCode}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold
                         bg-emerald-50 text-emerald-700 hover:bg-emerald-100 
                         dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50
                         transition-all duration-200"
              >
                <FiDownload size={18} />
                {t('qr:qr.buttons.download')}
              </button>

              <button
                onClick={handleCopyLink}
                disabled={!checkinCode}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold
                         bg-slate-100 text-slate-700 hover:bg-slate-200
                         dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700
                         transition-all duration-200"
              >
                <FiLink size={18} />
                {t('qr:qr.buttons.copyLink')}
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
              <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <FiInfo className="text-blue-500" />
                {t('qr:qr.instructions.title')}
              </h5>
              <ul className="space-y-2.5">
                {[
                  t('qr:qr.instructions.step1'),
                  t('qr:qr.instructions.step2'),
                  t('qr:qr.instructions.step3')
                ].map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-center text-amber-600 dark:text-amber-500 flex items-center justify-center gap-1.5">
              <FiInfo size={14} />
              {t('qr:qr.warning')}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default QRCheckInModal;