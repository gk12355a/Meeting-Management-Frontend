// src/pages/user/HistoryPage.jsx
import React, { useEffect, useState } from "react";
import { FiCalendar, FiMapPin, FiClock, FiUsers, FiX } from "react-icons/fi";
import { Spin, message } from "antd";
import { getMyMeetings } from "../../services/meetingService";
import dayjs from "dayjs";
import "dayjs/locale/vi";
dayjs.locale("vi");

/* ===============================
   🎨 Màu LIGHT MODE
================================ */
const roomColors = [
  { bg: "#FFE0E9", border: "#FF99B2" },
  { bg: "#D6F4FF", border: "#4CB4FF" },
  { bg: "#DBFFFC", border: "#04CCC6" },
  { bg: "#FFF7C8", border: "#FFD560" },
  { bg: "#F3EBFF", border: "#B88CFF" },
  { bg: "#FFE8F0", border: "#FF6FA5" },
];

/* ===============================
   🌙 Màu DARK MODE (đậm hơn)
================================ */
const roomColorsDark = [
  { bg: "#3B2631", border: "#FF7FA5" },
  { bg: "#112533", border: "#4FABFF" },
  { bg: "#0F2E2C", border: "#26D7C8" },
  { bg: "#3A351B", border: "#FFC857" },
  { bg: "#2A1D3A", border: "#B892FF" },
  { bg: "#3A1E2A", border: "#FF729A" },
];

/* ===============================
   🎨 getRoomColor xử lý theme
================================ */
const getRoomColor = (roomName, isDark) => {
  const palette = isDark ? roomColorsDark : roomColors;

  if (!roomName) return palette[0];

  let hash = 0;
  for (let i = 0; i < roomName.length; i++) {
    hash = roomName.charCodeAt(i) + ((hash << 5) - hash);
  }

  return palette[Math.abs(hash % palette.length)];
};

const HistoryPage = () => {
  const [activeTab, setActiveTab] = useState("joined");
  const [joinedMeetings, setJoinedMeetings] = useState([]);
  const [cancelledMeetings, setCancelledMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ======================================================
     🌙 Theo dõi theme real-time (KHÔNG còn lỗi màu)
  ======================================================== */
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  /* ===============================
     LOAD HISTORY
  ================================= */
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await getMyMeetings(0, 100);
        const all = res.data?.content || [];

        const now = dayjs();
        const past = all.filter((m) => dayjs(m.endTime).isBefore(now));
        const cancelled = all.filter((m) => m.status === "CANCELLED");

        setJoinedMeetings(past.filter((m) => m.status !== "CANCELLED"));
        setCancelledMeetings(cancelled);
      } catch (err) {
        message.error("Không thể tải lịch sử cuộc họp.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const meetings = activeTab === "joined" ? joinedMeetings : cancelledMeetings;

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">

      {/* ================== HEADER ================== */}
      <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-300 dark:border-gray-700">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 shadow-md">
          <FiCalendar className="text-white text-2xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold dark:text-gray-100">Lịch sử họp</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Xem lại các cuộc họp bạn đã tham gia
          </p>
        </div>
      </div>

      {/* ================== TABS ================== */}
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

      {/* ================== LIST ================== */}
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-2xl p-5 transition-colors">

        {loading ? (
          <div className="flex justify-center py-16">
            <Spin size="large" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-500 dark:text-gray-400">
            <FiCalendar size={32} className="mb-3" />
            Không có dữ liệu.
          </div>
        ) : (
          <ul className="flex flex-col gap-4">

            {meetings.map((item) => {
              const color = getRoomColor(item.room?.name, isDark);

              return (
                <li
                  key={item.id}
                  onClick={() => setSelectedMeeting(item)}
                  style={{
                    backgroundColor: color.bg,
                    border: `2px solid ${color.border}`,
                  }}
                  className="p-4 rounded-xl cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <p className="font-semibold mb-2 text-lg text-gray-900 dark:text-white">
                    {item.title}
                  </p>

                  <div className="flex flex-wrap items-center gap-5 text-sm text-gray-700 dark:text-gray-100">
                    <span className="flex items-center gap-1">
                      <FiCalendar size={15} />
                      {dayjs(item.startTime).format("DD/MM/YYYY")}
                    </span>

                    <span className="flex items-center gap-1">
                      <FiClock size={15} />
                      {dayjs(item.startTime).format("HH:mm")} –{" "}
                      {dayjs(item.endTime).format("HH:mm")}
                    </span>

                    <span className="flex items-center gap-1">
                      <FiMapPin size={15} />
                      {item.room?.name}
                    </span>
                  </div>
                </li>
              );
            })}

          </ul>
        )}
      </div>

      {/* ================== MODAL ================== */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-7 rounded-2xl w-full max-w-lg shadow-2xl relative">

            <button
              onClick={() => setSelectedMeeting(null)}
              className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <FiX size={22} />
            </button>

            <h2 className="text-2xl font-bold mb-5 text-gray-900 dark:text-gray-100">
              {selectedMeeting.title}
            </h2>

            <div className="space-y-4">
              {/* Ngày */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-slate-700">
                  <FiCalendar className="text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <span className="font-medium dark:text-gray-100">Ngày</span>
                  <p className="dark:text-gray-300">
                    {dayjs(selectedMeeting.startTime).format("DD/MM/YYYY")}
                  </p>
                </div>
              </div>

              {/* Giờ */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-green-100 dark:bg-slate-700">
                  <FiClock className="text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <span className="font-medium dark:text-gray-100">Giờ</span>
                  <p className="dark:text-gray-300">
                    {dayjs(selectedMeeting.startTime).format("HH:mm")} –{" "}
                    {dayjs(selectedMeeting.endTime).format("HH:mm")}
                  </p>
                </div>
              </div>

              {/* Phòng */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-slate-700">
                  <FiMapPin className="text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <span className="font-medium dark:text-gray-100">Phòng</span>
                  <p className="dark:text-gray-300">{selectedMeeting.room?.name}</p>
                </div>
              </div>

              {/* Người tham gia */}
              {selectedMeeting.participants && (
                <div className="mt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-orange-100 dark:bg-slate-700">
                      <FiUsers className="text-orange-600 dark:text-orange-300" />
                    </div>
                    <span className="font-medium dark:text-gray-100">
                      Người tham gia
                    </span>
                  </div>

                  <ul className="space-y-2">
                    {selectedMeeting.participants.map((p) => {
                      const statusColor = {
                        PENDING: "text-yellow-600 dark:text-yellow-400",
                        ACCEPTED: "text-green-600 dark:text-green-400",
                        REJECTED: "text-red-600 dark:text-red-400",
                        ATTENDED: "text-blue-600 dark:text-blue-400",
                        CANCELLED: "text-gray-500 dark:text-gray-400",
                      }[p.status] || "text-gray-600 dark:text-gray-300";

                      const statusLabel = {
                        PENDING: "Chờ xác nhận",
                        ACCEPTED: "Đã chấp nhận",
                        REJECTED: "Từ chối",
                        ATTENDED: "Đã tham dự",
                        CANCELLED: "Đã hủy",
                      }[p.status] || p.status;

                      return (
                        <li
                          key={p.id}
                          className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 p-2 rounded-lg"
                        >
                          <span className="text-gray-900 dark:text-gray-100">
                            {p.fullName}
                          </span>

                          <span className={`text-sm font-medium ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HistoryPage;
