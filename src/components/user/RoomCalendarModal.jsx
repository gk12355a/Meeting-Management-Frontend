import React, { useEffect, useState, useRef } from "react";
import { Modal, Spin } from "antd";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayjs from "dayjs";
import { getRoomMeetings } from "../../services/roomService";
import { useTranslation } from "react-i18next";

const WORK_START = 8 * 60; // 08:00
const WORK_END = 18 * 60; // 18:00

const isSameDay = (d1, d2) => dayjs(d1).isSame(dayjs(d2), "day");

const RoomCalendarModal = ({ open, onClose, room, onSelectSlot }) => {
  const { i18n, t } = useTranslation("roomCalendar");
  const calendarLocale = i18n.language === "vi" ? "vi" : "en-gb";
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readyToShow, setReadyToShow] = useState(false);

  const calendarRef = useRef(null);

  const isDark = document.documentElement.classList.contains("dark");

  /* --- AUTO UPDATE NOW INDICATOR --- */
useEffect(() => {
  if (!open) return;

  const refreshNow = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.updateNow();     // cập nhật thanh đỏ
      api.updateSize();    // fix lệch khi modal thay đổi layout
    }
  };

  // refresh khi mở
  setTimeout(refreshNow, 150);

  // refresh định kỳ
  const interval = setInterval(refreshNow, 10000); // 10s
  return () => clearInterval(interval);
}, [open]);

/* --- IMPROVED NOW-INDICATOR CSS --- */
useEffect(() => {
  const style = document.createElement("style");
  style.innerHTML = `
    /* Đường line đỏ nằm đúng vị trí phút hiện tại */
    .fc .fc-timegrid-now-indicator-line {
      border-top: 2px solid #ef4444 !important;
      height: 2px !important;
      z-index: 999 !important;
    }

    /* Mũi tên đỏ phía trái */
    .fc .fc-timegrid-now-indicator-arrow {
      border-right-color: #ef4444 !important;
      border-width: 6px !important;
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
          📅 {t("title", { name: room?.name || "" })}
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
          <p className="text-gray-600 dark:text-gray-300">{t("loading")}</p>
        </div>
      )}

      {!loading && readyToShow && (
        <FullCalendar
          ref={calendarRef}
          key={room?.id + i18n.language}  
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={calendarLocale}
          buttonText={{
            today: t("calendarLabel.today"),
          }}
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
            const now = dayjs();

            // Không cho kéo sang ngày khác
            if (!isSameDay(oldStart, newStart)) return false;

            // Không cho kéo event về ngày quá khứ
            if (dayjs(newStart).isBefore(dayjs(), "day")) return false;

            // Nếu hôm nay → chặn kéo vào giờ đã qua
            if (dayjs(newStart).isSame(now, "day") && dayjs(newStart).isBefore(now)) {
              return false;
            }

            const s = dayjs(newStart);
            const e = dayjs(dropInfo.end);

            const startMin = s.hour() * 60 + s.minute();
            const endMin = e.hour() * 60 + e.minute();

            // Chặn ngoài giờ hành chính
            return startMin >= WORK_START && endMin <= WORK_END;
          }}

          /* ======= CHẶN SELECT SANG NGÀY KHÁC ======= */
          selectAllow={(info) => {
            const start = dayjs(info.start);
            const end = dayjs(info.end).subtract(1, "minute");
            const now = dayjs();

            // Không cho chọn ngày trong quá khứ
            if (start.isBefore(dayjs(), "day")) return false;

            // Chặn giờ trong quá khứ của hôm nay
            if (start.isSame(now, "day") && start.isBefore(now)) return false;
            
            // Không cho select sang ngày sau 
            if (!start.isSame(end, "day")) return false;

            const startMin = start.hour() * 60 + start.minute();
            const endMin = end.hour() * 60 + end.minute();

            // Giờ hành chính
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
