import React, { useEffect, useState } from "react";
import { Modal, Spin } from "antd";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayjs from "dayjs";
import { getRoomMeetings } from "../../services/roomService";

const RoomCalendarModal = ({ open, onClose, room, onSelectSlot }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // detect dark mode từ html class
  const isDark = document.documentElement.classList.contains("dark");

  // Load meeting list
  useEffect(() => {
    const fetchMeetings = async () => {
      if (!room?.id) return;
      setLoading(true);
      try {
        const res = await getRoomMeetings(room.id);
        const mapped = (res.data || []).map((m) => ({
          id: m.id,
          title: m.title,
          start: m.startTime,
          end: m.endTime,
          backgroundColor: "#3b82f6",
          borderColor: "#3b82f6",
          textColor: "#fff",
        }));
        setEvents(mapped);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    if (open) fetchMeetings();
  }, [open, room]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnClose
      title={
        <span className="flex items-center gap-2 text-lg font-semibold dark:text-white">
          📅 Lịch phòng: {room?.name || ""}
        </span>
      }
      className="dark:[&_.ant-modal-content]:bg-slate-900 dark:[&_.ant-modal-content]:text-gray-100 
                 dark:[&_.ant-modal-header]:bg-slate-900 dark:[&_.ant-modal-header]:border-b-slate-700"
    >
      {loading && (
        <div className="flex justify-center items-center h-80">
          <Spin size="large" />
        </div>
      )}

      {!loading && (
        <FullCalendar
          key={room?.id}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale="vi"
          height={600}
          slotMinTime="08:00:00"
          slotMaxTime="18:00:00"
          allDaySlot={false}
          weekends={false}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: "08:00",
            endTime: "18:00",
          }}
          events={events}
          selectable={true}
          selectMirror={true}
          // 🔥 DARK MODE CALENDAR CLASSES
          dayHeaderClassNames={isDark ? "bg-slate-800 text-gray-200" : ""}
          slotLabelClassNames={isDark ? "bg-slate-800 text-gray-300" : ""}
          slotLaneClassNames={isDark ? "bg-slate-900 border-slate-700" : ""}
          viewClassNames={isDark ? "bg-slate-900 text-gray-100" : ""}
          nowIndicatorClassNames="bg-red-500"

          selectAllow={(selectInfo) => {
            const start = dayjs(selectInfo.start);
            const end = dayjs(selectInfo.end);

            const day = start.day();
            if (day === 0 || day === 6) return false;

            const minsStart = start.hour() * 60 + start.minute();
            const minsEnd = end.hour() * 60 + end.minute();

            return minsStart >= 8 * 60 && minsEnd <= 18 * 60;
          }}
          select={(info) => {
            onSelectSlot({
              start: info.start,
              end: info.end,
            });
            onClose();
          }}
        />
      )}
    </Modal>
  );
};

export default RoomCalendarModal;
