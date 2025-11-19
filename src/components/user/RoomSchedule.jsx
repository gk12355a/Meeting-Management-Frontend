import React, { useEffect, useState } from "react";
import { Spin, Alert } from "antd";
import dayjs from "dayjs";
import { getRoomMeetings } from "../../services/roomService";
import "dayjs/locale/vi";
dayjs.locale("vi");

const RoomSchedule = ({ roomId }) => {
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getRoomMeetings(roomId);
        setMeetings(res.data || []);
      } catch {
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [roomId]);

  if (loading) return <Spin />;

  return (
    <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-slate-800 border dark:border-slate-700">
      <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100">
        📅 Lịch phòng hiện tại
      </h3>

      {meetings.length === 0 ? (
        <Alert
          message="Phòng chưa có buổi họp nào — bạn có thể đặt thoải mái!"
          type="success"
          showIcon
        />
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
          {meetings.map((m) => (
            <div
              key={m.id}
              className="p-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600"
            >
              <p className="font-medium text-gray-800 dark:text-gray-100">
                {m.title}
              </p>

              <p className="text-sm text-gray-600 dark:text-gray-300">
                🕒 {dayjs(m.startTime).format("HH:mm DD/MM")} →{" "}
                {dayjs(m.endTime).format("HH:mm DD/MM")}
              </p>

              <p className="text-xs text-gray-400">👤 {m.organizerName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomSchedule;
