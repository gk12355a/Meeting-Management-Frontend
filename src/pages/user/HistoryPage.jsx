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

/* getRoomColor xử lý theme */
const getRoomColor = (roomName, isDark) => {
  // Không dùng nữa, chuyển sang style tĩnh
  return { bg: "#ffffff", border: "#e5e7eb" };
};

const HistoryPage = () => {
  const { t } = useTranslation("userHistory");
  const [activeTab, setActiveTab] = useState("joined");
  const [joinedMeetings, setJoinedMeetings] = useState([]);
  const [cancelledMeetings, setCancelledMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Theo dõi theme real-time */
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

  /* LOAD HISTORY */
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
      <div className="flex items-center gap-4 mb-6 pb-3 border-b border-gray-300 dark:border-gray-700">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md">
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
      <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        <button
          className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === "joined"
            ? "bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          onClick={() => setActiveTab("joined")}
        >
          {t("tabs.joined")}
        </button>

        <button
          className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === "cancelled"
            ? "bg-white dark:bg-rose-600 text-rose-600 dark:text-white shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          onClick={() => setActiveTab("cancelled")}
        >
          {t("tabs.cancelled")}
        </button>
      </div>

      {/* ===== LIST ===== */}
      <div className="space-y-4">

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
          <div className="flex flex-col gap-4">
            {meetings.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedMeeting(item)}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 cursor-pointer shadow-sm hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-200 dark:hover:border-emerald-900 transition-all duration-300 group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h3>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${item.status === "CANCELLED"
                    ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
                    : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600"
                    }`}>
                    {item.status === "CANCELLED" ? t("tabs.cancelled") : t("tabs.finished")}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      <FiCalendar size={14} />
                    </div>
                    <span className="font-medium">{dayjs(item.startTime).format("DD/MM/YYYY")}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                      <FiClock size={14} />
                    </div>
                    <span>
                      {dayjs(item.startTime).format("HH:mm")} - {dayjs(item.endTime).format("HH:mm")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                      <FiMapPin size={14} />
                    </div>
                    <span>{item.room?.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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