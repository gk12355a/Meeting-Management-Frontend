// src/pages/user/HistoryPage.jsx
import React, { useEffect, useState } from "react";
import { FiCalendar, FiMapPin, FiClock, FiUsers, FiX } from "react-icons/fi";
import { Spin, message, Tag } from "antd"; // <-- THÊM Tag
import { getMyMeetings } from "../../services/meetingService";
import dayjs from "dayjs";
import "dayjs/locale/vi";
dayjs.locale("vi");

const HistoryPage = () => {
  const [activeTab, setActiveTab] = useState("joined"); // joined | cancelled
  const [joinedMeetings, setJoinedMeetings] = useState([]);
  const [cancelledMeetings, setCancelledMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  // === 1. TẢI DỮ LIỆU TỪ API (Logic này vẫn đúng) ===
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await getMyMeetings(0, 100); 
        const allMeetings = res.data?.content || [];
        const now = dayjs();

        // Lọc dữ liệu
        const pastMeetings = allMeetings.filter(m => 
          dayjs(m.endTime).isBefore(now)
        );
        
        const cancelled = allMeetings.filter(m => 
          m.status === 'CANCELLED'
        );

        // Tab "Đã tham gia" = Các cuộc họp đã qua VÀ không bị hủy
        setJoinedMeetings(
          pastMeetings.filter(m => m.status !== 'CANCELLED')
        );

        // Tab "Đã hủy" = Tất cả các cuộc họp bị hủy (cả quá khứ và tương lai)
        setCancelledMeetings(cancelled);

      } catch (err) {
        console.error("Lỗi tải lịch sử họp:", err);
        message.error("Không thể tải lịch sử cuộc họp.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []); // Chỉ chạy 1 lần

  const handleMeetingClick = (meeting) => {
    setSelectedMeeting(meeting);
  };

  const closeModal = () => {
    setSelectedMeeting(null);
  };

  // === 2. HÀM HELPER MỚI ĐỂ HIỂN THỊ TAG TRẠNG THÁI ===
  const getTag = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return <Tag color="success" className="ml-2">Đã chấp nhận</Tag>;
      case 'DECLINED':
        return <Tag color="error" className="ml-2">Đã từ chối</Tag>;
      case 'PENDING':
        return <Tag color="warning" className="ml-2">Chờ phản hồi</Tag>;
      default:
        return null;
    }
  };

  const meetings = activeTab === "joined" ? joinedMeetings : cancelledMeetings;

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        📖 Lịch sử họp
      </h1>

      {/* Tabs (Giữ nguyên) */}
      <div className="flex gap-3 mb-6">
        <button
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === "joined"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
          }`}
          onClick={() => setActiveTab("joined")}
        >
          Đã tham gia
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === "cancelled"
              ? "bg-red-600 text-white"
              : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
          }`}
          onClick={() => setActiveTab("cancelled")}
        >
          Đã hủy
        </button>
      </div>

      {/* Danh sách cuộc họp (Giữ nguyên) */}
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-2xl p-5 transition-colors duration-300">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Spin size="large" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            <FiCalendar size={32} className="mb-3" />
            <p>Không có cuộc họp nào trong danh sách này.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-slate-700">
            {meetings.map((item) => (
              <li
                key={item.id}
                className="py-4 px-2 hover:bg-gray-50 dark:hover:bg-slate-700/40 rounded-xl transition-colors duration-200 cursor-pointer"
                onClick={() => handleMeetingClick(item)}
              >
                <p
                  className={`font-semibold mb-1 ${
                    activeTab === "cancelled"
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-800 dark:text-gray-100"
                  }`}
                >
                  {item.title}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                  <span className="flex items-center gap-1">
                    <FiCalendar size={14} /> {dayjs(item.startTime).format("DD/MM/YYYY")}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiClock size={14} /> 
                    {`${dayjs(item.startTime).format("HH:mm")} - ${dayjs(item.endTime).format("HH:mm")}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiMapPin size={14} /> {item.room?.name || "N/A"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* === 4. MODAL CHI TIẾT (ĐÃ CẬP NHẬT) === */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-lg relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <FiX size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
              {selectedMeeting.title}
            </h2>

            <div className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
              <p className="flex items-center gap-2">
                <FiCalendar size={14} /> <strong>Ngày:</strong> 
                {dayjs(selectedMeeting.startTime).format("DD/MM/YYYY")}
              </p>
              <p className="flex items-center gap-2">
                <FiClock size={14} /> <strong>Giờ:</strong> 
                {`${dayjs(selectedMeeting.startTime).format("HH:mm")} - ${dayjs(selectedMeeting.endTime).format("HH:mm")}`}
              </p>
              <p className="flex items-center gap-2">
                <FiMapPin size={14} /> <strong>Phòng:</strong> 
                {selectedMeeting.room?.name || "N/A"}
              </p>

              {/* === SỬA LỖI LOGIC HIỂN THỊ NGƯỜI THAM GIA === */}
              {selectedMeeting.participants && (
                <div className="mt-3">
                  <p className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-100">
                    <FiUsers size={14} /> Người tham gia:
                  </p>
                  {/* Sử dụng list-none để căn chỉnh đẹp hơn */}
                  <ul className="mt-2 ml-2 list-none space-y-1 p-0">
                    {selectedMeeting.participants.map((p) => (
                      <li key={p.id} className="flex justify-between items-center py-1">
                        <span className="text-gray-800 dark:text-gray-100">{p.fullName}</span>
                        {/* Hiển thị trạng thái (nếu là tab "Đã tham gia") */}
                        {activeTab === "joined" && getTag(p.status)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* === KẾT THÚC SỬA LỖI === */}

              {activeTab === "cancelled" && (
                <p className="mt-3 text-red-600 dark:text-red-400">
                  <strong>Trạng thái:</strong> Đã hủy
                  {/* (API getMyMeetings không có lý do hủy, nên chúng ta chỉ hiển thị trạng thái) */}
                </p>
              )}

              {selectedMeeting.description && (
                <p className="mt-3 italic text-gray-500 dark:text-gray-400">
                  Ghi chú: {selectedMeeting.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;