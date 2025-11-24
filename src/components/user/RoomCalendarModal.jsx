import React, { useEffect, useState, useRef } from "react";
import { Modal, Spin } from "antd";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayjs from "dayjs";
import { getRoomMeetings } from "../../services/roomService";

const WORK_START = 8 * 60; // 08:00
const WORK_END = 18 * 60; // 18:00

const isSameDay = (d1, d2) => dayjs(d1).isSame(dayjs(d2), "day");

const RoomCalendarModal = ({ open, onClose, room, onSelectSlot }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readyToShow, setReadyToShow] = useState(false);

  const calendarRef = useRef(null);

  const isDark = document.documentElement.classList.contains("dark");

  /* CSS chặn drag ngang */
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      /* Giữ icon cấm nhưng bỏ hiệu ứng trắng mờ */
      .fc-not-allowed {
        cursor: not-allowed !important;
        opacity: 1 !important;
      }
      
      /* Chặn kéo ngang không đổi */
      .fc-event-draggable {
        touch-action: pan-y !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  /* Load meetings */
  useEffect(() => {
    const fetchMeetings = async () => {
      if (!open || !room?.id) return;

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

    fetchMeetings();
  }, [open, room]);

  /* Chờ modal render xong */
  useEffect(() => {
    if (!loading && open) {
      setTimeout(() => {
        setReadyToShow(true);
        if (calendarRef.current) {
          const api = calendarRef.current.getApi();
          api.updateSize();
          api.updateNow();
        }
      }, 200);
    }
  }, [loading, open]);

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
      className="dark:[&_.ant-modal-content]:bg-slate-900 
                 dark:[&_.ant-modal-content]:text-gray-100 
                 dark:[&_.ant-modal-header]:bg-slate-900 
                 dark:[&_.ant-modal-header]:border-b-slate-700"
    >
      {(loading || !readyToShow) && (
        <div className="flex justify-center items-center h-80">
          <Spin size="large" />
        </div>
      )}

      {!loading && readyToShow && (
        <FullCalendar
          ref={calendarRef}
          key={room?.id}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale="vi"
          height={600}
          slotMinTime="08:00:00"
          slotMaxTime="18:00:00"
          allDaySlot={false}
          weekends={true}
          businessHours={{
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            startTime: "08:00",
            endTime: "18:00",
          }}
          events={events}

          /* ====== Drag event (kéo lên xuống) ====== */
          editable={true}
          eventStartEditable={true}
          eventDurationEditable={false}
          eventResizableFromStart={false}
          eventResize={false}

          /* CHẶN KÉO EVENT SANG NGÀY KHÁC */
          eventAllow={(dropInfo, draggedEvent) => {
            if (!draggedEvent) return false;

            const oldStart = draggedEvent.start;
            const newStart = dropInfo.start;

            // ❌ Chặn cross-day event drag
            if (!isSameDay(oldStart, newStart)) return false;

            const s = dayjs(newStart);
            const e = dayjs(dropInfo.end);

            const startMin = s.hour() * 60 + s.minute();
            const endMin = e.hour() * 60 + e.minute();

            // ❌ Chặn ngoài giờ hành chính
            return startMin >= WORK_START && endMin <= WORK_END;
          }}

          /* ======= CHẶN SELECT SANG NGÀY KHÁC ======= */
          selectAllow={(info) => {
            const start = dayjs(info.start);
            const end = dayjs(info.end).subtract(1, "minute");

            // ❌ Không cho select sang ngày sau — FIX QUAN TRỌNG NHẤT
            if (!start.isSame(end, "day")) return false;

            const startMin = start.hour() * 60 + start.minute();
            const endMin = end.hour() * 60 + end.minute();

            return startMin >= WORK_START && endMin <= WORK_END;
          }}

          selectable={true}
          selectMirror={true}

          nowIndicator={true}
          nowIndicatorClassNames="bg-red-500"

          dayHeaderClassNames={isDark ? "bg-slate-800 text-gray-200" : ""}
          slotLabelClassNames={isDark ? "bg-slate-800 text-gray-300" : ""}
          slotLaneClassNames={isDark ? "bg-slate-900 border-slate-700" : ""}
          viewClassNames={isDark ? "bg-slate-900 text-gray-100" : ""}

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
