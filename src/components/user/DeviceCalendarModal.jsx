// src/components/user/DeviceCalendarModal.jsx
import React, { useEffect, useState } from "react";
import { Modal, Spin, Alert } from "antd";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayjs from "dayjs";
import { getDeviceMeetings } from "../../services/deviceService";

const DeviceCalendarModal = ({ open, onClose, device, onSelectSlot }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Detect dark mode
  const isDark = document.documentElement.classList.contains("dark");

  // Load device meetings
  useEffect(() => {
    const fetchMeetings = async () => {
      if (!device?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const res = await getDeviceMeetings(device.id);
        const mapped = (res.data || []).map((m) => ({
          id: m.id,
          title: m.title,
          start: m.startTime,
          end: m.endTime,
          backgroundColor: "#8b5cf6", // Purple for device
          borderColor: "#7c3aed",
          textColor: "#fff",
          extendedProps: {
            organizerName: m.organizerName || "Không rõ",
          }
        }));
        setEvents(mapped);
      } catch (err) {
        console.error("Lỗi tải lịch thiết bị:", err);
        setError("Không thể tải lịch thiết bị. Vui lòng thử lại!");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    if (open) fetchMeetings();
  }, [open, device]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnClose
      title={
        <span className="flex items-center gap-2 text-lg font-semibold dark:text-white">
          🖥️ Lịch thiết bị: {device?.name || ""}
        </span>
      }
      className="dark:[&_.ant-modal-content]:bg-slate-900 dark:[&_.ant-modal-content]:text-gray-100 
                 dark:[&_.ant-modal-header]:bg-slate-900 dark:[&_.ant-modal-header]:border-b-slate-700"
    >
      {loading && (
        <div className="flex justify-center items-center h-80">
          <Spin size="large" tip="Đang tải lịch thiết bị..." />
        </div>
      )}

      {error && !loading && (
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {/* Thông tin thiết bị */}
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
            <p className="text-sm text-purple-800 dark:text-purple-300">
              <span className="font-semibold">📋 Mô tả:</span> {device?.description || "Không có"}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              💡 Chọn khoảng thời gian trống trên lịch để đặt phòng với thiết bị này
            </p>
          </div>

          {/* FullCalendar */}
          <FullCalendar
            key={device?.id}
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
            nowIndicator={true}
            
            // Dark mode classes
            dayHeaderClassNames={isDark ? "bg-slate-800 text-gray-200" : ""}
            slotLabelClassNames={isDark ? "bg-slate-800 text-gray-300" : ""}
            slotLaneClassNames={isDark ? "bg-slate-900 border-slate-700" : ""}
            viewClassNames={isDark ? "bg-slate-900 text-gray-100" : ""}
            nowIndicatorClassNames="bg-red-500"

            // Validate business time
            selectAllow={(selectInfo) => {
              const start = dayjs(selectInfo.start);
              const end = dayjs(selectInfo.end);

              const day = start.day();
              if (day === 0 || day === 6) return false;

              const minsStart = start.hour() * 60 + start.minute();
              const minsEnd = end.hour() * 60 + end.minute();

              return minsStart >= 8 * 60 && minsEnd <= 18 * 60;
            }}

            // Handle select slot
            select={(info) => {
              onSelectSlot({
                start: info.start,
                end: info.end,
              });
              onClose();
            }}

            // Event tooltip
            eventDidMount={(info) => {
              const organizerName = info.event.extendedProps?.organizerName || "Không rõ";
              info.el.title = `${info.event.title}\nNgười tổ chức: ${organizerName}`;
            }}
          />

          {/* Legend */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-600"></div>
              <span>Đang sử dụng</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-200 dark:bg-slate-700"></div>
              <span>Trống</span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DeviceCalendarModal;