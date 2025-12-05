// src/pages/user/HistoryPage.jsx
import React, { useEffect, useState } from "react";
import { FiCalendar, FiMapPin, FiClock } from "react-icons/fi";
import { Spin, message } from "antd";
import { getMyMeetings } from "../../services/meetingService";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import MeetingDetailModal from "../../components/user/MeetingDetailModal";
import { useTranslation } from "react-i18next";

dayjs.locale("vi");

/* ===============================
   Màu LIGHT MODE
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
   Màu DARK MODE (đậm hơn)
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
   getRoomColor xử lý theme
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
  const { t } = useTranslation("userHistory");
  const [activeTab, setActiveTab] = useState("joined");
  const [joinedMeetings, setJoinedMeetings] = useState([]);
  const [cancelledMeetings, setCancelledMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ======================================================
     Theo dõi theme real-time (KHÔNG còn lỗi màu)
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
        message.error(t("errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const meetings = activeTab === "joined" ? joinedMeetings : cancelledMeetings;

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">

      {/* ===== HEADER ===== */}
      <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-300 dark:border-gray-700">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 shadow-md">
          <FiCalendar className="text-white text-2xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold dark:text-gray-100">{t("title")}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="flex gap-3 mb-6">
        <button
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === "joined"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
          }`}
          onClick={() => setActiveTab("joined")}
        >
          {t("tabs.joined")}
        </button>

        <button
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            activeTab === "cancelled"
              ? "bg-red-600 text-white"
              : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
          }`}
          onClick={() => setActiveTab("cancelled")}
        >
          {t("tabs.cancelled")}
        </button>
      </div>

      {/* ===== LIST ===== */}
      <div className="bg-white dark:bg-slate-800 shadow-md rounded-2xl p-5 transition-colors">

        {loading ? (
          <div className="flex justify-center py-16">
            <Spin size="large" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-500 dark:text-gray-400">
            <FiCalendar size={32} className="mb-3" />
            {t("empty")}
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

      {/* ===== MODAL ===== */}
      <MeetingDetailModal
        open={!!selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        meeting={selectedMeeting}
      />
    </div>
  );
};

export default HistoryPage;