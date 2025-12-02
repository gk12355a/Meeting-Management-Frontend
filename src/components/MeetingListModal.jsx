import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

export default function MeetingListModal({ visible, onClose, title, meetings, onMeetingClick }) {
  const { t } = useTranslation("meeting"); // dùng namespace "meeting"

  const [render, setRender] = useState(visible);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (visible) {
      setRender(true);
      setTimeout(() => setAnimate(true), 10);
    } else {
      setAnimate(false);
      setTimeout(() => setRender(false), 300);
    }
  }, [visible]);

  if (!render) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-300 ${
        animate ? "bg-opacity-50 backdrop-blur-sm" : "bg-opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-slate-800 p-6 rounded-xl max-w-xl w-full space-y-4 transform transition-all duration-300 shadow-lg ${
          animate ? "scale-100 translate-y-0 opacity-100" : "scale-95 -translate-y-4 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>

        <div className="max-h-96 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
          {meetings.length > 0 ? (
            meetings.map((m) => (
              <div
                key={m.id}
                className="p-3 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition"
                onClick={() => onMeetingClick(m)}
              >
                <p className="font-semibold text-gray-700 dark:text-gray-200 text-md">{m.title}</p>

                {m.room && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("modal.location")}: {m.room?.name || t("modal.unknown")}
                  </p>
                )}

                {m.startTime && m.endTime && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("modal.time")}:{" "}
                    {dayjs(m.startTime).format("HH:mm")} -{" "}
                    {dayjs(m.endTime).format("HH:mm, DD/MM/YYYY")}
                  </p>
                )}

                {m.organizer && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("modal.organizer")}: {m.organizer.fullName || t("modal.unknown")}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">{t("modal.noMeetings")}</p>
          )}
        </div>

        <button
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={onClose}
        >
          {t("modal.close")}
        </button>
      </div>
    </div>
  );
}
