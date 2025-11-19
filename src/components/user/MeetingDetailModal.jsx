// src/components/user/MeetingDetailModal.jsx
import React, { useEffect, useRef } from "react";
import { FiX, FiCalendar, FiClock, FiMapPin, FiCpu, FiUsers } from "react-icons/fi";
import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

const MeetingDetailModal = ({ open, onClose, meeting, children }) => {
  const modalOverlayRef = useRef(null);
  const modalContentRef = useRef(null);

  // Xử lý click outside để đóng modal
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        open &&
        modalOverlayRef.current &&
        modalContentRef.current &&
        modalOverlayRef.current === event.target
      ) {
        onClose();
      }
    }
    
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose]);

  // Không render nếu modal không mở hoặc không có dữ liệu
  if (!open || !meeting) return null;

  // Helper lấy status display và màu (chỉ 3 trạng thái)
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

    // Mặc định cho trường hợp không khớp
    return statusMap[status] || {
      color: "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-700",
      label: status || "Không rõ"
    };
  };

  // Xử lý danh sách người tham gia
  const renderParticipants = () => {
    let organizer = meeting.organizer;
    let participants = Array.isArray(meeting.participants)
      ? [...meeting.participants]
      : [];
    
    // Tìm người tổ chức nếu chưa có
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
        {/* Người tổ chức */}
        {organizer && (
          <li
            key={organizer.id || "organizer"}
            className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 p-2 rounded-lg"
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
        
        {/* Danh sách người tham gia */}
        {participants.length > 0 ? (
          participants.map((p) => {
            const status = getStatus(p.status);
            return (
              <li
                key={p.id}
                className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 p-2 rounded-lg"
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
          <li className="italic text-gray-500 dark:text-gray-400">
            Không có người tham gia
          </li>
        ) : null}
      </>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      ref={modalOverlayRef}
    >
      <div
        ref={modalContentRef}
        className="
          bg-white dark:bg-slate-800 p-0 rounded-2xl w-full max-w-2xl shadow-2xl relative
          flex flex-col
          max-h-[90vh]
        "
        style={{
          minHeight: 0,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white z-10"
          tabIndex={0}
          aria-label="Đóng"
        >
          <FiX size={22} />
        </button>

        {/* Modal content with layout and scrollable */}
        <div className="flex-1 overflow-y-auto p-7 pt-5">
          {/* Title */}
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            {meeting.title}
          </h2>

          {/* Info - Ngày, Giờ, Phòng cùng 1 hàng */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
              {/* Ngày */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-slate-700 shrink-0">
                  <FiCalendar className="text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <span className="font-medium dark:text-gray-100">Ngày</span>
                  <p className="dark:text-gray-300">
                    {dayjs(meeting.startTime).format("DD/MM/YYYY")}
                  </p>
                </div>
              </div>

              {/* Giờ */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="p-2 rounded-xl bg-green-100 dark:bg-slate-700 shrink-0">
                  <FiClock className="text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <span className="font-medium dark:text-gray-100">Giờ</span>
                  <p className="dark:text-gray-300">
                    {dayjs(meeting.startTime).format("HH:mm")} – {dayjs(meeting.endTime).format("HH:mm")}
                  </p>
                </div>
              </div>

              {/* Phòng */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-slate-700 shrink-0">
                  <FiMapPin className="text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <span className="font-medium dark:text-gray-100">Phòng</span>
                  <p className="dark:text-gray-300">{meeting.room?.name || "Chưa xác định"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Thiết bị & người tham gia: Xếp dọc ở mobile, ngang ở md+ */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Thiết bị sử dụng */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-pink-100 dark:bg-slate-700 shrink-0">
                  <FiCpu className="text-pink-600 dark:text-pink-300" />
                </div>
                <span className="font-medium dark:text-gray-100">Thiết bị sử dụng</span>
              </div>
              {
                (meeting.devices && meeting.devices.length > 0) ? (
                  <ul className="dark:text-gray-300 text-gray-800 flex flex-wrap gap-2">
                    {meeting.devices.map((device, idx) => (
                      <li
                        key={device.id || idx}
                        className="px-3 py-1 rounded bg-gray-100 dark:bg-slate-700 font-semibold text-sm break-all"
                      >
                        {device.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="italic text-gray-500 dark:text-gray-400 mt-1">
                    Không có thiết bị sử dụng
                  </p>
                )
              }
            </div>

            {/* Người tham gia */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-orange-100 dark:bg-slate-700 shrink-0">
                  <FiUsers className="text-orange-600 dark:text-orange-300" />
                </div>
                <span className="font-medium dark:text-gray-100">
                  Người tham gia
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {renderParticipants()}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer - Hiển thị children nếu có (các buttons custom) */}
        {children && (
          <div className="border-t border-gray-200 dark:border-slate-700 p-4 flex justify-end gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingDetailModal;