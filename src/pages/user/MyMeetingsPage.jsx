
// src/pages/user/MyMeetingsPage.jsx
import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  getMyMeetings,
  getMeetingById,
} from "../../services/meetingService";
import {
  Modal,
  Spin,
  Descriptions,
  Tag,
  Select,
  Input,
  Button,
  message,
} from "antd";
import { FiCalendar, FiPlusCircle, FiUsers, FiEdit, FiAlertTriangle } from "react-icons/fi";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import utc from "dayjs/plugin/utc";
import { useAuth } from "../../context/AuthContext";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import EditMeetingModal from "../../components/user/EditMeetingModal";
import DeleteMeetingModal from "../../components/user/DeleteMeetingModal";
import QuickBookingModal from "../../components/user/QuickBookingModal";

dayjs.locale("vi");
dayjs.extend(utc);

// ---- GIỜ HÀNH CHÍNH ----
const WORK_HOUR_START = 8; // 8h sáng
const WORK_HOUR_END = 18;  // 18h chiều (6PM), kết thúc lúc 18:00

// Helper functions để xử lý error messages
const parseErrorMessage = (error) => {
  const msg = error?.response?.data?.message || error?.message || "";
  const status = error?.response?.status;
  
  return {
    message: msg,
    status: status,
    data: error?.response?.data
  };
};

const getErrorToastConfig = (errorInfo) => {
  const { message: msg, status } = errorInfo;
  const lowerMsg = msg.toLowerCase();
  
  // Xử lý các trường hợp lỗi cụ thể
  const errorHandlers = [
    {
      condition: () => lowerMsg.includes("phòng") && (lowerMsg.includes("bảo trì") || lowerMsg.includes("maintenance")),
      toast: () => toast.error("Phòng họp đang bảo trì, vui lòng chọn phòng khác!", { autoClose: 4000 })
    },
    {
      condition: () => lowerMsg.includes("phòng") && (lowerMsg.includes("bận") || lowerMsg.includes("không khả dụng") || lowerMsg.includes("đã được đặt")),
      toast: () => toast.error("Phòng họp đã có người đặt trong khung giờ này. Vui lòng chọn thời gian hoặc phòng khác!", { autoClose: 4000 })
    },
    {
      condition: () => lowerMsg.includes("thiết bị") && (lowerMsg.includes("bảo trì") || lowerMsg.includes("maintenance")),
      toast: () => toast.error("Thiết bị đang bảo trì, vui lòng bỏ chọn hoặc chọn thiết bị khác!", { autoClose: 4000 })
    },
    {
      condition: () => lowerMsg.includes("thiết bị") && (lowerMsg.includes("bận") || lowerMsg.includes("không khả dụng") || lowerMsg.includes("đang được sử dụng")),
      toast: () => toast.error("Thiết bị đang được sử dụng trong khung giờ này. Vui lòng chọn thiết bị khác!", { autoClose: 4000 })
    },
    {
      condition: () => lowerMsg.includes("người dùng") && lowerMsg.includes("bận"),
      toast: () => toast.warning("Một hoặc nhiều người được mời đã có lịch họp trùng. Họ vẫn sẽ nhận được lời mời nhưng có thể từ chối.", { autoClose: 5000 })
    },
    {
      condition: () => lowerMsg.includes("người dùng") && (lowerMsg.includes("vô hiệu") || lowerMsg.includes("inactive") || lowerMsg.includes("không hoạt động")),
      toast: () => toast.warning("Một hoặc nhiều người được mời có tài khoản đã bị vô hiệu hóa. Vui lòng kiểm tra lại danh sách!", { autoClose: 5000 })
    },
    {
      condition: () => lowerMsg.includes("thời gian") && (lowerMsg.includes("quá khứ") || lowerMsg.includes("past") || lowerMsg.includes("phải ở tương lai")),
      toast: () => toast.error("Thời gian họp phải là thời điểm trong tương lai!", { autoClose: 3500 })
    },
    {
      condition: () => lowerMsg.includes("thời gian") && (lowerMsg.includes("trùng") || lowerMsg.includes("conflict")),
      toast: () => toast.error("Khung giờ họp bị trùng với lịch khác. Vui lòng chọn thời gian khác!", { autoClose: 4000 })
    },
    {
      condition: () => lowerMsg.includes("quyền") || lowerMsg.includes("permission") || status === 403,
      toast: () => toast.error("Bạn không có quyền đặt phòng này hoặc tài nguyên không khả dụng!", { autoClose: 4000 })
    },
    {
      condition: () => lowerMsg.includes("email") && lowerMsg.includes("không hợp lệ"),
      toast: () => toast.error("Email khách mời không hợp lệ. Vui lòng kiểm tra lại!", { autoClose: 3500 })
    },
    {
      condition: () => status === 400,
      toast: () => toast.error(`Dữ liệu không hợp lệ: ${msg}`, { autoClose: 4000 })
    },
    {
      condition: () => status === 404,
      toast: () => toast.error("Không tìm thấy tài nguyên (phòng/thiết bị/người dùng)", { autoClose: 3500 })
    },
    {
      condition: () => status === 409,
      toast: () => toast.error("Xung đột dữ liệu: " + msg, { autoClose: 4000 })
    }
  ];
  
  // Tìm handler phù hợp
  const handler = errorHandlers.find(h => h.condition());
  
  if (handler) {
    handler.toast();
  } else {
    // Fallback: hiển thị message gốc
    toast.error(msg || "Không thể tạo cuộc họp. Vui lòng thử lại!", { autoClose: 3500 });
  }
};

// Tooltip: Tên cuộc họp, Thời gian, Địa điểm
function getEventTooltipContent(event) {
  const { title, start, end, extendedProps } = event;
  const time = `${dayjs(start).format("HH:mm")} - ${dayjs(end).format("HH:mm, DD/MM/YYYY")}`;
  const room = extendedProps?.roomName || "Chưa xác định";
  return `
    <div>
      <div><b>${title}</b></div>
      <div>Thời gian: ${time}</div>
      <div>Phòng: ${room}</div>
    </div>
  `;
}

// Helper để xác định slot có hợp lệ để đặt lịch không (không ở quá khứ, trong giờ hành chính và KHÔNG phải thứ 7, CN)
function isBusinessTime(date) {
  // date là JS Date hoặc dayjs object theo local time của lịch FullCalendar
  const d = dayjs(date);
  // Quá khứ
  if (d.isBefore(dayjs(), "minute")) return false;
  // Ngày trong tuần: 0 (CN), 6 (T7)
  const day = d.day();
  if (day === 0 || day === 6) return false;
  // Giờ hành chính: >= 08:00 và <= 18:00 (CHỈ SỬA Ở ĐÂY)
  const hour = d.hour();
  const minute = d.minute();
  // Cho phép đặt giờ đúng từ 08:00 đến 18:00: Không được bắt đầu trước 08:00 và không kết thúc sau 18:00
  // Để hỗ trợ book từ 10h đến đúng 18h (tức end là 18:00), cần trả về true khi giờ nhỏ hơn 18 HOẶC (giờ=18 && phút=0)
  return (
    hour > WORK_HOUR_START && hour < WORK_HOUR_END
    || (hour === WORK_HOUR_START)
    || (hour === WORK_HOUR_END && minute === 0)
  );
}

// CSS cho các slot không hợp lệ (không dùng được)
function injectNoBusinessTimeStyle() {
  const styleId = 'no-business-time-slot-style';
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    /* Slot không hợp lệ (không đặt được): màu #f1f5f9, chéo "not allowed" khi hover */
    .fc-nonbusiness, .fc-business-blocked {
      background: #f1f5f9 !important;
      cursor: not-allowed !important;
      opacity: 0.65 !important;
      border-color: #f3f4f6 !important;
    }
    .dark .fc-nonbusiness, .dark .fc-business-blocked {
      background: #334155 !important;
      cursor: not-allowed !important;
      opacity: 0.7 !important;
      border-color: #475569 !important;
    }
    /* Tooltip cấm chọn */
    .fc-nonbusiness:not(.fc-event):hover::after,
    .fc-business-blocked:not(.fc-event):hover::after {
      content: "Không được phép đặt ngoài giờ hành chính!";
      position: absolute;
      background: #fff;
      color: #dc2626;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 1px 8px;
      font-size: 12px;
      left: 60%;
      top: 5px;
      z-index: 10000;
      pointer-events: none;
      white-space: nowrap;
      box-shadow: 0 2px 8px #0002;
    }
    .dark .fc-nonbusiness:not(.fc-event):hover::after,
    .dark .fc-business-blocked:not(.fc-event):hover::after {
      background: #18181b;
      color: #ef4444;
      border-color: #475569;
    }
    /* Hiện đường line đỏ thể hiện thời gian thực tại (now-indicator) */
    .fc .fc-timegrid-now-indicator-arrow,
    .fc .fc-timegrid-now-indicator-line {
      background: #ef4444 !important;
      border-color: #ef4444 !important;
    }
    .fc .fc-timegrid-now-indicator-arrow {
      border-right-color: #ef4444 !important;
    }
    .fc .fc-timegrid-now-indicator-line {
      border-top: 2px solid #ef4444 !important;
      z-index: 10 !important;
    }
  `;
  document.head.appendChild(style);
}


const MyMeetingPage = () => {
  // State quản lý lịch họp
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // State modal chi tiết
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [meetingDetail, setMeetingDetail] = useState(null);

// State modal đặt lịch nhanh
const [quickBooking, setQuickBooking] = useState({ open: false, start: null, end: null });

  // Thêm state mới cho modal sửa/xoá
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // State form data
  const { user } = useAuth();

  const tooltipRef = useRef();

  // Add a ref for FullCalendar to use for force updating the now time indicator
  const calendarRef = useRef();

  // Inject style khi component render
  useEffect(() => {
    injectNoBusinessTimeStyle();
  }, []);

  // CSS cho cuộc họp bị hủy
useEffect(() => {
  const style = document.createElement("style");
  style.innerHTML = `
    .meeting-cancelled {
  opacity: 0.4 !important;
  filter: grayscale(0.5);
}

.meeting-cancelled .fc-event-title,
.meeting-cancelled .fc-event-time {
  text-decoration: line-through !important;
  text-decoration-color: #b91c1c !important;
  text-decoration-thickness: 1.2px !important;
  text-underline-offset: -4px;
}
  `;
  document.head.appendChild(style);
  return () => style.remove();
}, []);

  // === TẢI LỊCH HỌP (ĐÃ SỬA LỖI LOGIC LỌC) ===
  const fetchMeetings = async () => {
    if (!user) return; // Đảm bảo user đã tải xong

    setLoading(true);
    try {
      const res = await getMyMeetings();
      const data = res.data?.content || [];

      const filteredData = data.filter(m => {
        // 1. Bỏ qua nếu cuộc họp bị HỦY (toàn bộ)
        // if (m.status === 'CANCELLED') {
        //   return false;
        // }
        // 2. Kiểm tra xem user có phải người tổ chức không
        const isOrganizer = m.organizer?.id === user.id;
        // 3. Tìm trạng thái của user (nếu là người tham gia)
        const userParticipant = m.participants?.find(p => p.id === user.id);
        // 4. LOGIC QUYẾT ĐỊNH:
        // NẾU TÔI LÀ NGƯỜI TỔ CHỨC:
        if (isOrganizer) {
          return true; // Luôn hiển thị
        }
        // NẾU TÔI CHỈ LÀ NGƯỜI THAM GIA:
        if (userParticipant) {
          return userParticipant.status !== 'DECLINED';
        }

        // Nếu không phải organizer và không có trong participants → Ẩn
        return false;
      });

      // Map từ dữ liệu ĐÃ LỌC
      const mappedEvents = filteredData.map((m) => {
  const startLocal = dayjs(m.startTime).local().format();
  const endLocal = dayjs(m.endTime).local().format();

  return {
    id: m.id,
    title: m.title || "Cuộc họp",
    start: startLocal,
    end: endLocal,
    backgroundColor: m.status === "CANCELLED"
  ? "#f50c0cff" 
  : m.status === "CONFIRMED"
  ? "#3b82f6"
  : "#f59e0b",

borderColor: m.status === "CANCELLED"
  ? "#b91c1c" 
  : m.status === "CONFIRMED"
  ? "#2563eb"
  : "#d97706",
    extendedProps: {
      roomName: m.room?.name || "Chưa xác định",
    },
    // add class only if cancelled
    classNames: m.status === "CANCELLED" ? ["meeting-cancelled"] : []
  };
});

      setEvents(mappedEvents);
    } catch (err) {
      console.error("Lỗi tải lịch họp:", err);
      toast.error("Không thể tải danh sách lịch họp!");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý click vào cuộc họp để xem chi tiết
  const handleEventClick = async (info) => {
    try {
      const id = info.event.id;
      setMeetingDetail(null);
      setIsModalOpen(true);
      const res = await getMeetingById(id);
      setMeetingDetail(res.data); // res.data sẽ chứa recurrenceSeriesId nếu có
    } catch (err) {
      console.error("Lỗi khi lấy chi tiết:", err);
      toast.error("Không thể tải chi tiết cuộc họp!");
      setIsModalOpen(false);
    }
  };

  // Xử lý hover cuộc họp để hiển thị tooltip tối giản
  const handleEventMouseEnter = (info) => {
    handleEventMouseLeave();

    const tooltipHtml = getEventTooltipContent(info.event);
    let tooltip = document.createElement("div");
    tooltip.innerHTML = tooltipHtml;
    tooltip.style.position = "absolute";
    tooltip.style.zIndex = 9999;
    tooltip.style.background = "#222";
    tooltip.style.color = "#fff";
    tooltip.style.padding = "8px 14px";
    tooltip.style.borderRadius = "8px";
    tooltip.style.boxShadow = "0 2px 12px rgba(0,0,0,0.3)";
    tooltip.style.fontSize = "13px";
    tooltip.style.pointerEvents = "none";
    tooltip.style.transition = "opacity 0.15s";
    tooltip.style.opacity = "0.93";
    if (document.documentElement.classList.contains("dark")) {
      tooltip.style.background = "#334155";
      tooltip.style.color = "#e0eafb";
    }
    document.body.appendChild(tooltip);
    tooltipRef.current = tooltip;

    const mouse = info.jsEvent;
    function positionTooltip(e) {
      tooltip.style.left = e.pageX + 16 + "px";
      tooltip.style.top = e.pageY + 9 + "px";
    }
    positionTooltip(mouse);

    function onMove(ev) {
      positionTooltip(ev);
    }
    document.addEventListener('mousemove', onMove);
    tooltip._removeMousemove = () => {
      document.removeEventListener('mousemove', onMove);
    };
  };

  const handleEventMouseLeave = () => {
    if (tooltipRef.current) {
      if (tooltipRef.current._removeMousemove) tooltipRef.current._removeMousemove();
      if (tooltipRef.current.parentNode) tooltipRef.current.parentNode.removeChild(tooltipRef.current);
      tooltipRef.current = null;
    }
  };

  // ---- GENERATE NON-BUSINESS HOURS SLOTS (for day/week view vertical grid coloring) ----
  function getNonBusinessHourBackgroundEvents(viewStart, viewEnd) {
    // viewStart, viewEnd: JS Date
    // Output: [{start, end, display: 'background', classNames: ...}, ...]
    const slots = [];
    let d = dayjs(viewStart).startOf("day");
    const until = dayjs(viewEnd).startOf("day");

    while (d.isBefore(until)) {
      const dayIdx = d.day();
      // Nếu là thứ 7 (6), CN (0) -> disable TẤT CẢ GIỜ trong ngày (0h-24h)
      if (dayIdx === 0 || dayIdx === 6) {
        slots.push({
          start: d.hour(0).minute(0).second(0).format("YYYY-MM-DDTHH:mm:ss"),
          end: d.hour(23).minute(59).second(59).format("YYYY-MM-DDTHH:mm:ss"),
          display: "background",
          classNames: ["fc-business-blocked"],
        });
      } else {
        // Slot trước giờ hành chính (0h -> 8h)
        if (WORK_HOUR_START > 0) {
          slots.push({
            start: d.hour(0).minute(0).second(0).format("YYYY-MM-DDTHH:mm:ss"),
            end: d.hour(WORK_HOUR_START).minute(0).second(0).format("YYYY-MM-DDTHH:mm:ss"),
            display: "background",
            classNames: ["fc-business-blocked"],
          });
        }
        // Slot sau giờ hành chính (18h -> 24h)
        if (WORK_HOUR_END < 24) {
          slots.push({
            start: d.hour(WORK_HOUR_END).minute(0).second(0).format("YYYY-MM-DDTHH:mm:ss"),
            end: d.hour(23).minute(59).second(59).format("YYYY-MM-DDTHH:mm:ss"),
            display: "background",
            classNames: ["fc-business-blocked"],
          });
        }
      }
      d = d.add(1, "day");
    }
    // Thêm các slot ở quá khứ đến thời điểm hiện tại (lí do: disable background cho quá khứ)
    const now = dayjs();
    let dPast = dayjs(viewStart).startOf("day");
    while (dPast.isSameOrBefore(now, "day")) {
      let endOfPast =
        dPast.isSame(now, "day")
          ? now.format("YYYY-MM-DDTHH:mm:ss")
          : dPast.hour(23).minute(59).second(59).format("YYYY-MM-DDTHH:mm:ss");
      slots.push({
        start: dPast.hour(0).minute(0).second(0).format("YYYY-MM-DDTHH:mm:ss"),
        end: endOfPast,
        display: "background",
        classNames: ["fc-nonbusiness"],
      });
      dPast = dPast.add(1, "day");
    }
    return slots;
  }

  // RED LINE NOW-INDICATOR: force refresh every ~20s to keep now-indicator up to date visually. (Ref: admin DashboardPage.jsx)
  useEffect(() => {
    let interval = setInterval(() => {
      // FullCalendar's "now-indicator" updates only at minute granularity unless forced.
      // We call calendarApi "updateNow" to force the now indicator line to move.
      try {
        if (calendarRef.current && calendarRef.current.getApi) {
          calendarRef.current.getApi().updateNow();
        }
      } catch (e) {}
    }, 20000); // update every 20 seconds for smoothness but reasonable performance
    return () => clearInterval(interval);
  }, []);

  // Xử lý click vào khoảng trống trên calendar để đặt lịch nhanh
  const handleDateSelect = (selection) => {
    let start = selection?.startStr ? dayjs(selection.startStr) : null;
    let end = selection?.endStr ? dayjs(selection.endStr) : null;
    if (!start || !end) return;
    
    const isStartOk = isBusinessTime(start);
    const isEndOk = isBusinessTime(end);
    
    if (!isStartOk || !isEndOk) {
      toast.warn("Chỉ được tạo lịch trong giờ hành chính từ thứ 2 đến thứ 6 và không chọn quá khứ!");
      return;
    }
    
    let duration = end.diff(start, "minute");
    if (duration <= 0) duration = 60;
    
    setQuickBooking({
      open: true,
      start: start,
      end: start.add(duration, "minute"),
    });
  };

  // === HÀM RENDER NGƯỜI THAM GIA (ĐÃ CẬP NHẬT) ===
  const renderParticipants = (organizer, participants) => {
    if (!participants && !organizer) {
      return <span className="text-gray-500 dark:text-gray-400">Không có người tham gia.</span>;
    }

    const getTag = (status) => {
      switch (status) {
        case 'ACCEPTED':
          return <Tag color="success" className="ml-2">Đã chấp nhận</Tag>;
        case 'DECLINED':
          return <Tag color="error" className="ml-2">Đã từ chối</Tag>;
        case 'PENDING':
          return <Tag color="warning" className="ml-2">Chờ phản hồi</Tag>;
        default:
          return null;
      }
    };

    const allAttendees = [
      organizer,
      ...(participants || [])
    ].filter(Boolean);

    const uniqueAttendees = allAttendees.filter((p, index, self) =>
      p.id && index === self.findIndex((t) => t.id === p.id)
    );

    return (
      <ul className="list-none p-0 m-0">
        {uniqueAttendees.map(p => (
          <li key={p.id} className="flex justify-between items-center py-1">
            <span className="text-gray-800 dark:text-gray-100">
              {p.fullName}
              {p.id === organizer?.id && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(Tổ chức)</span>
              )}
            </span>
            {getTag(p.status)}
          </li>
        ))}
      </ul>
    );
  };

  // Load lịch họp khi component mount
  useEffect(() => {
    if (user) {
      fetchMeetings();
    }
  }, [user]);

  // Thêm CSS cho dark mode
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      html.dark .ant-form-item-label > label { color: #f1f5f9 !important; }
      html.dark .ant-input, html.dark .ant-picker, html.dark .ant-select-selector {
        background-color: #1e293b !important;
        color: #f8fafc !important;
        border-color: #334155 !important;
      }
      html.dark .ant-input::placeholder, html.dark textarea.ant-input::placeholder {
        color: #94a3b8 !important;
      }
      .dark ::placeholder,
      .dark .ant-select-selection-placeholder,
      .dark .ant-input::placeholder,
      .dark textarea::placeholder {
        color: #b5b5b5 !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // ---------- RENDER ----------
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-500">
      <ToastContainer position="top-right" autoClose={2500} />

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 border-b pb-3 border-gray-200 dark:border-gray-700">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 shadow-md">
          <FiCalendar className="text-white text-2xl" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
            Lịch họp của tôi
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Theo dõi và quản lý các cuộc họp của bạn
          </p>
        </div>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Spin size="large" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 transition-colors duration-500">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "timeGridDay,timeGridWeek,dayGridMonth",
            }}
            allDaySlot={false}
            slotMinTime="06:00:00"
            slotMaxTime="19:30:00"
            events={events}

            eventClick={handleEventClick}
            eventMouseEnter={handleEventMouseEnter}
            eventMouseLeave={handleEventMouseLeave}
            height="75vh"
            locale="vi"
            selectable={true}
            selectMirror={true}
            // ---------
            select={handleDateSelect}
            // Giới hạn chọn khung giờ hành chính & disable quá khứ khi kéo rê hoặc click chọn slot
            // ĐÃ BỔ SUNG: loại trừ luôn thứ 7 (6), chủ nhật (0)
            selectAllow={function(selectInfo) {
              const start = dayjs(selectInfo.start);
              const end = dayjs(selectInfo.end);
              // Chặn thứ 7 (6) & chủ nhật (0) cho cả start & end
              const validStart = isBusinessTime(start);
              const validEnd = isBusinessTime(end);
              return validStart && validEnd;
            }}

            // -- Chặn drag, resize event ra ngoài giờ hành chính (nếu cần, cho UX tốt hơn)
            eventAllow={function(dropInfo, draggedEvent) {
              const start = dayjs(dropInfo.start);
              const end = dayjs(dropInfo.end);
              // Chặn thứ 7 (6) & chủ nhật (0) cho cả start & end
              const validStart = isBusinessTime(start);
              const validEnd = isBusinessTime(end);
              return validStart && validEnd;
            }}

            // highlight non-business bằng backgroundEvents
            // Sử dụng key để trigger rerender background khi chuyển week hoặc month
            businessHours={{
              // Chỉ cho phép từ 08:00 đến 18:00 các ngày trong tuần
              daysOfWeek: [1, 2, 3, 4, 5], // thứ 2-6
              startTime: '08:00',
              endTime: '18:00',
            }}
            // Sử dụng backgroundEvents để làm mờ vùng không business hour và quá khứ, ĐÃ BỔ SUNG BLOCK T7, CN
            backgroundEvents={(arg) => getNonBusinessHourBackgroundEvents(arg.start, arg.end)}
            // THÊM RED LINE: chỉ cần thuộc tính này trong fullcalendar để hiện line thời gian thực
            nowIndicator={true}
          />
        </div>
      )}

      {/* Modal chi tiết cuộc họp - CẬP NHẬT PHẦN FOOTER */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={
          meetingDetail && meetingDetail.organizer?.id === user?.id ? (
            <div className="flex justify-end gap-2">
              <Button
                type="primary"
                icon={<FiEdit />}
                onClick={() => {
                  setIsEditModalOpen(true);
                  setIsModalOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500"
              >
                Sửa
              </Button>
              <Button
                danger
                icon={<FiAlertTriangle />}
                onClick={() => {
                  setIsDeleteModalOpen(true);
                  setIsModalOpen(false);
                }}
              >
                Hủy họp
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsModalOpen(false)}>Đóng</Button>
          )
        }
        title={<span className="dark:text-white">Chi tiết cuộc họp</span>}
        width={600}
        className="dark:[&_.ant-modal-content]:bg-gray-800 dark:[&_.ant-modal-content]:text-gray-200"
      >
        {/* Giữ nguyên nội dung bên trong */}
        {meetingDetail ? (
          <Descriptions
            bordered
            column={1}
            className="dark:[&_.ant-descriptions-item-label]:text-gray-300 dark:[&_.ant-descriptions-item-content]:text-gray-100"
          >
            <Descriptions.Item label="Tên cuộc họp">
              {meetingDetail.title}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {`${dayjs(meetingDetail.startTime).format("HH:mm")} - ${dayjs(meetingDetail.endTime).format("HH:mm, DD/MM/YYYY")}`}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={meetingDetail.status === 'CONFIRMED' ? 'blue' : 'warning'}>
                {meetingDetail.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Phòng họp">
              {meetingDetail.room?.name || "Chưa xác định"}
            </Descriptions.Item>
            <Descriptions.Item label="Người tham gia">
              {renderParticipants(meetingDetail.organizer, meetingDetail.participants)}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú">
              {meetingDetail.description || "Không có"}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <div className="flex justify-center py-6">
            <Spin size="large" />
          </div>
        )}
      </Modal>

      {/* Modal đặt lịch nhanh */}
      <QuickBookingModal
        open={quickBooking.open}
        onCancel={() => setQuickBooking({ open: false, start: null, end: null })}
        quickBookingData={quickBooking}
        onSuccess={fetchMeetings}
      />

      {/* Modal chỉnh sửa cuộc họp */}
      <EditMeetingModal
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        meetingDetail={meetingDetail}
        onSuccess={() => {
          fetchMeetings();
          setMeetingDetail(null);
        }}
      />

      {/* Modal xóa cuộc họp */}
      <DeleteMeetingModal
        open={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        meetingDetail={meetingDetail}
        onSuccess={() => {
          fetchMeetings();
          setMeetingDetail(null);
        }}
      />

    </div>
  );
};

export default MyMeetingPage;
