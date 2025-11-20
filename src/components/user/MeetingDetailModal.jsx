// src/components/user/MeetingDetailModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { FiX, FiCalendar, FiClock, FiMapPin, FiCpu, FiUsers, FiInfo } from "react-icons/fi";
import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

const MeetingDetailModal = ({ open, onClose, meeting, children }) => {
  const modalOverlayRef = useRef(null);
  const modalContentRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Inject CSS animations once
  useEffect(() => {
    const styleId = 'meeting-detail-modal-animations';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      @keyframes modalFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes modalFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      @keyframes modalScaleIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      @keyframes modalScaleOut {
        from {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
        to {
          opacity: 0;
          transform: scale(0.95) translateY(-10px);
        }
      }
      
      .modal-overlay-enter {
        animation: modalFadeIn 0.2s ease-out forwards;
      }
      
      .modal-overlay-exit {
        animation: modalFadeOut 0.2s ease-in forwards;
      }
      
      .modal-content-enter {
        animation: modalScaleIn 0.25s ease-out forwards;
      }
      
      .modal-content-exit {
        animation: modalScaleOut 0.2s ease-in forwards;
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Handle open/close with proper timing
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setIsClosing(false);
    } else if (isVisible) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open, isVisible]);

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isVisible &&
        !isClosing &&
        modalOverlayRef.current &&
        modalContentRef.current &&
        modalOverlayRef.current === event.target
      ) {
        handleClose();
      }
    };
    
    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isVisible, isClosing]);

  // Don't render if not visible
  if (!isVisible) return null;
  if (!meeting) return null;

  // Helper function for participant status
  const getStatus = (status) => {
    const statusMap = {
      PENDING: {
        color: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/50",
        label: "Chờ xác nhận"
      },
      ACCEPTED: {
        color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/50",
        label: "Đã chấp nhận"
      },
      DECLINED: {
        color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/50",
        label: "Từ chối"
      }
    };

    return statusMap[status] || {
      color: "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-700",
      label: status || "Không rõ"
    };
  };

  // Helper function for meeting status
  const getMeetingStatus = (status) => {
    const statusMap = {
      CONFIRMED: {
        color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50",
        label: "Đã xác nhận"
      },
      CANCELLED: {
        color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/50",
        label: "Đã hủy"
      },
      PENDING_APPROVAL: {
        color: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/50",
        label: "Chờ duyệt"
      }
    };

    return statusMap[status] || {
      color: "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-700",
      label: status || "Không rõ"
    };
  };

  // Render participants list
  const renderParticipants = () => {
    let organizer = meeting.organizer;
    let participants = Array.isArray(meeting.participants)
      ? [...meeting.participants]
      : [];
    
    if (!organizer) {
      organizer = participants.find(
        (p) => p.role === "ORGANIZER" || p.isOrganizer === true
      );
      if (organizer) {
        participants = participants.filter((p) => p !== organizer);
      }
    } else {
      participants = participants.filter((p) => p.id !== organizer.id);
    }

    return (
      <>
        {organizer && (
          <li
            key={organizer.id || "organizer"}
            className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 p-2.5 rounded-lg"
          >
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {organizer.fullName || "Không rõ"}
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-200 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">
                Người tổ chức
              </span>
              {organizer.status && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatus(organizer.status).color}`}>
                  {getStatus(organizer.status).label}
                </span>
              )}
            </div>
          </li>
        )}
        
        {participants.length > 0 ? (
          participants.map((p) => {
            const status = getStatus(p.status);
            return (
              <li
                key={p.id}
                className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 p-2.5 rounded-lg"
              >
                <span className="text-gray-900 dark:text-gray-100">
                  {p.fullName || "Không rõ"}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              </li>
            );
          })
        ) : !organizer ? (
          <li className="italic text-gray-500 dark:text-gray-400 text-center py-2">
            Không có người tham gia
          </li>
        ) : null}
      </>
    );
  };

  const meetingStatus = getMeetingStatus(meeting.status);

  return (
    <div
      className={`fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] ${
        isClosing ? 'modal-overlay-exit' : 'modal-overlay-enter'
      }`}
      ref={modalOverlayRef}
    >
      <div
        ref={modalContentRef}
        className={`
          bg-white dark:bg-slate-800 p-0 rounded-2xl w-full max-w-2xl shadow-2xl relative
          flex flex-col max-h-[90vh]
          ${isClosing ? 'modal-content-exit' : 'modal-content-enter'}
        `}
        style={{ minHeight: 0 }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white z-10 transition-colors duration-200"
          tabIndex={0}
          aria-label="Đóng"
        >
          <FiX size={22} />
        </button>

        {/* Modal content */}
        <div className="flex-1 overflow-y-auto p-7 pt-5">
          {/* Title */}
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 pr-8">
            {meeting.title}
          </h2>

          {/* Info Section - Date, Time, Room, Status */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {/* Date */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 shrink-0">
                  <FiCalendar className="text-blue-600 dark:text-blue-400" size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">Ngày</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {dayjs(meeting.startTime).format("DD/MM/YYYY")}
                  </p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 shrink-0">
                  <FiClock className="text-green-600 dark:text-green-400" size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">Giờ</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {dayjs(meeting.startTime).format("HH:mm")} – {dayjs(meeting.endTime).format("HH:mm")}
                  </p>
                </div>
              </div>

              {/* Room */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 shrink-0">
                  <FiMapPin className="text-purple-600 dark:text-purple-400" size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">Phòng</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {meeting.room?.name || "Chưa xác định"}
                  </p>
                </div>
              </div>

              {/* Meeting Status */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
                  <FiInfo className="text-indigo-600 dark:text-indigo-400" size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">Trạng thái</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${meetingStatus.color}`}>
                    {meetingStatus.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-slate-600 my-5"></div>

          {/* Devices Section */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                <FiCpu className="text-pink-600 dark:text-pink-400" size={16} />
              </div>
              <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                Thiết bị sử dụng
              </span>
            </div>
            {
              (meeting.devices && meeting.devices.length > 0) ? (
                <ul className="flex flex-wrap gap-2">
                  {meeting.devices.map((device, idx) => (
                    <li
                      key={device.id || idx}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 font-medium text-xs"
                    >
                      {device.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="italic text-gray-400 dark:text-gray-500 text-sm">
                  Không có thiết bị sử dụng
                </p>
              )
            }
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-slate-600 my-5"></div>

          {/* Participants Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <FiUsers className="text-orange-600 dark:text-orange-400" size={16} />
              </div>
              <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                Người tham gia
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {renderParticipants()}
            </ul>
          </div>
        </div>

        {/* Footer with custom buttons */}
        {children && (
          <div className="border-t border-gray-200 dark:border-slate-700 p-4 flex justify-end gap-2 bg-gray-50 dark:bg-slate-800/50">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingDetailModal;