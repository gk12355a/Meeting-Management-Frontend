// src/components/admin/MeetingListModal.jsx
import React from "react";
import dayjs from "dayjs";

export default function MeetingListModal({ visible, onClose, title, meetings, onMeetingClick }) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 p-6 rounded-xl max-w-xl w-full space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
        <div className="max-h-96 overflow-y-auto space-y-4">
          {meetings.length > 0 ? (
            meetings.map((m) => (
              <div
                key={m.id}
                className="p-3 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition"
                onClick={() => onMeetingClick(m)}
              >
                <p className="font-semibold text-gray-700 dark:text-gray-200 text-md">{m.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {dayjs(m.startTime).format("HH:mm")} - {dayjs(m.endTime).format("HH:mm")}
                </p>

                {m.room && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <strong>Phòng họp:</strong> {m.room?.name || "Chưa xác định"} {m.room?.location ? `(${m.room.location})` : ""}
                  </p>
                )}

                {m.equipment?.length > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <strong>Thiết bị:</strong> {m.equipment.map(eq => eq.name).join(", ")}
                  </p>
                )}

                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <strong>Người tham gia:</strong>
                  <ul className="list-disc ml-5 mt-1">
                    {m.participants && m.participants.length > 0 ? (
                      m.participants.map((p, index) => (
                        <li key={p.id || index}>
                          {p.fullName || "Chưa có tên"} - {p.status || "Chưa xác nhận"}
                        </li>
                      ))
                    ) : (
                      <li>Chưa có người tham gia</li>
                    )}
                  </ul>
                </div>

                {m.organizer && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <strong>Người tổ chức:</strong> {m.organizer.fullName}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Không có cuộc họp.</p>
          )}
        </div>
        <button
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={onClose}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
