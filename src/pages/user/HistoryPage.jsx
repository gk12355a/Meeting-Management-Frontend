// src/pages/user/HistoryPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { FiCalendar, FiMapPin, FiClock, FiUsers, FiX, FiCpu } from "react-icons/fi";
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

  // Đóng modal khi click ngoài popup
  const modalOverlayRef = useRef(null);
  const modalContentRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        selectedMeeting &&
        modalOverlayRef.current &&
        modalContentRef.current &&
        modalOverlayRef.current === event.target
      ) {
        setSelectedMeeting(null);
      }
    }
    if (selectedMeeting) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedMeeting]);

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
              onClick={() => setSelectedMeeting(null)}
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
                {selectedMeeting.title}
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
                        {dayjs(selectedMeeting.startTime).format("DD/MM/YYYY")}
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
                        {dayjs(selectedMeeting.startTime).format("HH:mm")} – {dayjs(selectedMeeting.endTime).format("HH:mm")}
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
                      <p className="dark:text-gray-300">{selectedMeeting.room?.name}</p>
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
                    (selectedMeeting.devices && selectedMeeting.devices.length > 0) ? (
                      <ul className="dark:text-gray-300 text-gray-800 flex flex-wrap gap-2">
                        {selectedMeeting.devices.map((device, idx) => (
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
                    {(() => {
                      let organizer = selectedMeeting.organizer;
                      let participants = Array.isArray(selectedMeeting.participants)
                        ? [...selectedMeeting.participants]
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
                    })()}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HistoryPage;
