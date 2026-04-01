// src/pages/user/MyMeetingsPage.jsx
import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { getMyMeetings, getMeetingById } from "../../services/meetingService";
import {
  Modal,
  Spin,
  Descriptions,
  Tag,
  Select,
  Input,
  Button,
  message,
  Calendar as MiniCalendar,
  Checkbox,
  Badge,
  Radio,
  DatePicker
} from "antd";
import {
  FiCalendar,
  FiPlusCircle,
  FiUsers,
  FiEdit,
  FiAlertTriangle,
  FiDownload
} from "react-icons/fi";
import { QrCode } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import utc from "dayjs/plugin/utc";
import updateLocale from "dayjs/plugin/updateLocale";
import { useAuth } from "../../context/AuthContext";
import { exportToCSV } from "../../utils/exportHelper";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useTranslation } from "react-i18next";

import EditMeetingModal from "../../components/user/EditMeetingModal";
import DeleteMeetingModal from "../../components/user/DeleteMeetingModal";
import QuickBookingModal from "../../components/user/QuickBookingModal";
import MeetingDetailModal from "../../components/user/MeetingDetailModal";
import QRCheckInModal from "../../components/user/QRCheckInModal";

dayjs.locale("vi");
dayjs.extend(utc);
dayjs.extend(updateLocale);

dayjs.updateLocale("vi", {
  weekStart: 1,
});
dayjs.updateLocale("en", {
  weekStart: 1,
});

// GIỜ HÀNH CHÍNH
const WORK_HOUR_START = 8; // 8h sáng
const WORK_HOUR_END = 18; // 18h chiều (6PM), kết thúc lúc 18:00

// Helper functions để xử lý error messages
const parseErrorMessage = (error) => {
  const msg = error?.response?.data?.message || error?.message || "";
  const status = error?.response?.status;

  return {
    message: msg,
    status: status,
    data: error?.response?.data,
  };
};

const getErrorToastConfig = (errorInfo) => {
  const { message: msg, status } = errorInfo;
  const lowerMsg = msg.toLowerCase();

  // Xử lý các trường hợp lỗi cụ thể
  const errorHandlers = [
    {
      condition: () =>
        lowerMsg.includes("phòng") &&
        (lowerMsg.includes("bảo trì") || lowerMsg.includes("maintenance")),
      toast: () =>
        toast.error("Phòng họp đang bảo trì, vui lòng chọn phòng khác!", {
          autoClose: 4000,
        }),
    },
    {
      condition: () =>
        lowerMsg.includes("phòng") &&
        (lowerMsg.includes("bận") ||
          lowerMsg.includes("không khả dụng") ||
          lowerMsg.includes("đã được đặt")),
      toast: () =>
        toast.error(
          "Phòng họp đã có người đặt trong khung giờ này. Vui lòng chọn thời gian hoặc phòng khác!",
          { autoClose: 4000 }
        ),
    },
    {
      condition: () =>
        lowerMsg.includes("thiết bị") &&
        (lowerMsg.includes("bảo trì") || lowerMsg.includes("maintenance")),
      toast: () =>
        toast.error(
          "Thiết bị đang bảo trì, vui lòng bỏ chọn hoặc chọn thiết bị khác!",
          { autoClose: 4000 }
        ),
    },
    {
      condition: () =>
        lowerMsg.includes("thiết bị") &&
        (lowerMsg.includes("bận") ||
          lowerMsg.includes("không khả dụng") ||
          lowerMsg.includes("đang được sử dụng")),
      toast: () =>
        toast.error(
          "Thiết bị đang được sử dụng trong khung giờ này. Vui lòng chọn thiết bị khác!",
          { autoClose: 4000 }
        ),
    },
    {
      condition: () =>
        lowerMsg.includes("người dùng") && lowerMsg.includes("bận"),
      toast: () =>
        toast.warning(
          "Một hoặc nhiều người được mời đã có lịch họp trùng. Họ vẫn sẽ nhận được lời mời nhưng có thể từ chối.",
          { autoClose: 5000 }
        ),
    },
    {
      condition: () =>
        lowerMsg.includes("người dùng") &&
        (lowerMsg.includes("vô hiệu") ||
          lowerMsg.includes("inactive") ||
          lowerMsg.includes("không hoạt động")),
      toast: () =>
        toast.warning(
          "Một hoặc nhiều người được mời có tài khoản đã bị vô hiệu hóa. Vui lòng kiểm tra lại danh sách!",
          { autoClose: 5000 }
        ),
    },
    {
      condition: () =>
        lowerMsg.includes("thời gian") &&
        (lowerMsg.includes("quá khứ") ||
          lowerMsg.includes("past") ||
          lowerMsg.includes("phải ở tương lai")),
      toast: () =>
        toast.error("Thời gian họp phải là thời điểm trong tương lai!", {
          autoClose: 3500,
        }),
    },
    {
      condition: () =>
        lowerMsg.includes("thời gian") &&
        (lowerMsg.includes("trùng") || lowerMsg.includes("conflict")),
      toast: () =>
        toast.error(
          "Khung giờ họp bị trùng với lịch khác. Vui lòng chọn thời gian khác!",
          { autoClose: 4000 }
        ),
    },
    {
      condition: () =>
        lowerMsg.includes("quyền") ||
        lowerMsg.includes("permission") ||
        status === 403,
      toast: () =>
        toast.error(
          "Bạn không có quyền đặt phòng này hoặc tài nguyên không khả dụng!",
          { autoClose: 4000 }
        ),
    },
    {
      condition: () =>
        lowerMsg.includes("email") && lowerMsg.includes("không hợp lệ"),
      toast: () =>
        toast.error("Email khách mời không hợp lệ. Vui lòng kiểm tra lại!", {
          autoClose: 3500,
        }),
    },
    {
      condition: () => status === 400,
      toast: () =>
        toast.error(`Dữ liệu không hợp lệ: ${msg}`, { autoClose: 4000 }),
    },
    {
      condition: () => status === 404,
      toast: () =>
        toast.error("Không tìm thấy tài nguyên (phòng/thiết bị/người dùng)", {
          autoClose: 3500,
        }),
    },
    {
      condition: () => status === 409,
      toast: () => toast.error("Xung đột dữ liệu: " + msg, { autoClose: 4000 }),
    },
  ];

  // Tìm handler phù hợp
  const handler = errorHandlers.find((h) => h.condition());

  if (handler) {
    handler.toast();
  } else {
    // Fallback: hiển thị message gốc
    toast.error(msg || "Không thể tạo cuộc họp. Vui lòng thử lại!", {
      autoClose: 3500,
    });
  }
};

// Tooltip: Tên cuộc họp, Thời gian, Địa điểm
function getEventTooltipContent(event, t) {
  const { title, start, end, extendedProps } = event;

  const time = `${dayjs(start).format("HH:mm")} - ${dayjs(end).format(
    "HH:mm, DD/MM/YYYY"
  )}`;

  const room = extendedProps?.roomName || t("modal.unknown");

  return `
    <div style="line-height: 1.6; min-width: 220px;">
      <div style="font-weight: 600; margin-bottom: 6px; font-size: 14px;">
        ${title}
      </div>

      <div style="font-size: 12px; opacity: 0.9; margin-bottom: 3px;">
        <strong>${t("modal.time")}:</strong> ${time}
      </div>

      <div style="font-size: 12px; opacity: 0.9; margin-bottom: 3px;">
        <strong>${t("modal.location")}:</strong> ${room}
      </div>
    </div>
  `;
}

// Helper để xác định slot có hợp lệ để đặt lịch không (không ở quá khứ, trong giờ hành chính và KHÔNG phải thứ 7, CN)
function isBusinessTime(date) {
  // date là JS Date hoặc dayjs object theo local time của lịch FullCalendar
  const d = dayjs(date);
  // Quá khứ
  if (d.isBefore(dayjs(), "minute")) return false;
  // Giờ hành chính: >= 08:00 và <= 18:00
  const hour = d.hour();
  const minute = d.minute();
  return (
    (hour > WORK_HOUR_START && hour < WORK_HOUR_END) ||
    hour === WORK_HOUR_START ||
    (hour === WORK_HOUR_END && minute === 0)
  );
}

// CSS cho các slot không hợp lệ (không dùng được)
function injectNoBusinessTimeStyle() {
  const styleId = "no-business-time-slot-style";
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.innerHTML = `
    /* Slot không hợp lệ (không đặt được): màu #f1f5f9, chéo "not allowed" khi hover */
    .fc-nonbusiness, .fc-business-blocked {
      background: repeating-linear-gradient(
        45deg,
        #f9fafb,
        #f9fafb 10px,
        #f3f4f6 10px,
        #f3f4f6 20px
      ) !important;
      opacity: 0.8 !important;
    }
     .dark .fc-nonbusiness, .dark .fc-business-blocked {
      background: repeating-linear-gradient(
        45deg,
        #1e293b,
        #1e293b 10px,
        #334155 10px,
        #334155 20px
      ) !important;
      opacity: 0.6 !important;
      border-color: #334155 !important;
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
    .fc .fc-timegrid-now-indicator-line {
      background: #10b981 !important;
      border-color: #10b981 !important;
    }
    .fc .fc-timegrid-now-indicator-arrow {
      border-right-color: #10b981 !important;
      border-top-color: transparent !important;
      border-bottom-color: transparent !important;
    }

    /* === MODERN CALENDAR STYLES === */
    /* Toolbar Buttons */
    .fc-button-primary {
      background-color: white !important;
      border-color: #e5e7eb !important;
      color: #374151 !important;
      font-weight: 500 !important;
      padding: 0.5rem 1rem !important;
      border-radius: 9999px !important; /* Rounded Full */
      text-transform: capitalize !important;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
      transition: all 0.2s !important;
    }
    .fc-button-primary:hover {
      background-color: #f9fafb !important;
      border-color: #d1d5db !important;
      color: #111827 !important;
    }
    .fc-button-primary:focus {
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2) !important; /* Emerald Focus */
    }
    .fc-button-active {
        background-color: #ecfdf5 !important; /* Emerald 50 */
        border-color: #10b981 !important;
        color: #059669 !important;
    }

    /* Headers */
    .fc-col-header-cell-cushion {
      color: #374151 !important;
      font-weight: 600 !important;
      padding-top: 8px !important;
      padding-bottom: 8px !important;
      text-decoration: none !important;
    }
    .fc-col-header-cell {
        background-color: #f9fafb !important;
        border-color: #f3f4f6 !important;
    }
    .dark .fc-col-header-cell {
        background-color: #1e293b !important;
         border-color: #334155 !important;
    }
     .dark .fc-col-header-cell-cushion {
        color: #e2e8f0 !important;
     }

    /* Grid Lines - Soften them */
    .fc-theme-standard td, .fc-theme-standard th {
        border-color: #f3f4f6 !important;
    }
    .dark .fc-theme-standard td, .dark .fc-theme-standard th {
        border-color: #334155 !important;
    }
    
    /* Time Axis */
    .fc-timegrid-slot-label-cushion {
        font-size: 0.75rem !important;
        color: #9ca3af !important;
        font-weight: 500 !important;
    }

    /* Today Highlight - subtle tint */
    .fc-day-today {
        background-color: #ecfdf5 !important; /* Emerald 50 */
    }
    .dark .fc-day-today {
        background-color: rgba(16, 185, 129, 0.1) !important;
    }
    .fc .fc-timegrid-now-indicator-line {
      border-top: 2px solid #10b981 !important;
      z-index: 10 !important;
    }
  `;
  document.head.appendChild(style);
}

const MyMeetingPage = () => {
  const { t, i18n } = useTranslation(["meeting", "common"]);
  const calendarLocale = i18n.language === "vi" ? "vi" : "en-gb";

  const buttonText = {
    day: i18n.language === "vi" ? "Ngày" : "Day",
    week: i18n.language === "vi" ? "Tuần" : "Week",
    month: i18n.language === "vi" ? "Tháng" : "Month",
    today: i18n.language === "vi" ? "Hôm nay" : "Today",
  };

  // State quản lý lịch họp
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [softLoading, setSoftLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // LƯU NGÀY HIỆN TẠI ĐANG XEM TRÊN CALENDAR
  const [currentViewDate, setCurrentViewDate] = useState(new Date());

  const [userSelectedDate, setUserSelectedDate] = useState(null);

  const [lastDatesSet, setLastDatesSet] = useState(null);

  // LƯU NGÀY USER ĐANG XEM (KHÔNG BAO GIỜ BỊ RESET)
  const [fixedViewDate, setFixedViewDate] = useState(null);

  // LOCK NGÀY SAU KHI ĐẶT LỊCH NHANH ĐỂ KHÔNG BỊ NHẢY VỀ HÔM NAY
  const [lockedViewDate, setLockedViewDate] = useState(null);

  // VIEW HIỆN TẠI (month/week/day) để xử lý ẩn meeting bị hủy
  const [currentViewType, setCurrentViewType] = useState("timeGridWeek");

  // State modal chi tiết
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [meetingDetail, setMeetingDetail] = useState(null);

  // State modal đặt lịch nhanh
  const [quickBooking, setQuickBooking] = useState({
    open: false,
    start: null,
    end: null,
  });

  // Thêm state mới cho modal sửa/xoá
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // State mới cho QR Check-in Modal
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportOption, setExportOption] = useState("all");
  const [exportDateRange, setExportDateRange] = useState(null);

  // State form data
  const { user } = useAuth();

  // State filters
  const [showConfirmed, setShowConfirmed] = useState(true);
  const [showPending, setShowPending] = useState(true);

  const tooltipRef = useRef();

  // Add a ref for FullCalendar to use for force updating the now time indicator
  const calendarRef = useRef();

  // Inject style khi component render
  useEffect(() => {
    injectNoBusinessTimeStyle();
  }, []);

  // CSS cho cuộc họp bị hủy VÀ TỪ CHỐI (hiện tại sẽ không dùng nữa vì đã ẩn hẳn)
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .meeting-cancelled {
        background-color: #e5e7eb !important;
        border-color: #d1d5db !important;
        color: #374151 !important;
        opacity: 1 !important;
        filter: none !important;
        position: relative;
      }

      .meeting-cancelled .fc-event-title,
      .meeting-cancelled .fc-event-time {
        text-decoration: line-through !important;
        text-decoration-color: #ef4444 !important;
        text-decoration-thickness: 1.5px !important;
      }

      .meeting-cancelled::before {
        content: "✖";
        font-size: 12px;
        color: #ef4444;
        position: absolute;
        left: 6px;
        top: 4px;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // === TẢI LỊCH HỌP ===
  const fetchMeetings = async (silent = false) => {
    if (!user) return;

    if (!silent) setLoading(true);
    try {
      const res = await getMyMeetings();
      const data = res.data?.content || [];

      // --- 1. NÂNG CẤP BỘ LỌC (Fix lỗi không thấy họp vừa tạo) ---
      const filteredData = data.filter((m) => {
        // Check cả người tạo (creator) phòng trường hợp organizer bị null
        const isCreator = m.creator?.id === user.id;
        const isOrganizer = m.organizer?.id === user.id;
        const userParticipant = m.participants?.find((p) => p.id === user.id);

        // Nếu tôi là người tạo HOẶC người tổ chức -> Luôn hiện
        if (isCreator || isOrganizer) return true;

        // Nếu tôi là người tham gia và chưa từ chối -> Hiện
        if (userParticipant) return userParticipant.status !== "DECLINED";

        return false;
      });

      // Ẩn cuộc họp đã Hủy hoặc Bị từ chối
      let cleanedData = filteredData.filter(
        (m) => m.status !== "CANCELLED" && m.status !== "REJECTED"
      );

      // --- 2. MAP DỮ LIỆU ---
      const mappedEvents = cleanedData.map((m) => {
        // Logic màu sắc
        // Logic màu sắc
        let bgColor = "#10b981"; // Emerald (CONFIRMED)
        let borderColor = "#059669";

        // Logic màu sắc gradient đẹp hơn
        const isCreator = m.creator?.id === user.id;

        if (m.status === "PENDING_APPROVAL") {
          bgColor = "#f59e0b"; // Cam (PENDING)
          borderColor = "#d97706";
        } else if (isCreator) {
          bgColor = "#059669"; // Emerald đậm hơn cho mình tạo
          borderColor = "#047857";
        }

        if (m.status === "PENDING_APPROVAL") {
          bgColor = "#f59e0b"; // Cam (PENDING)
          borderColor = "#d97706";
        }

        return {
          id: m.id,
          title: m.title || "Cuộc họp",

          // Dùng toISOString() để đảm bảo an toàn tuyệt đối về format ngày
          start: dayjs(m.startTime).toISOString(),
          end: dayjs(m.endTime).toISOString(),

          backgroundColor: bgColor,
          borderColor: borderColor,
          extendedProps: {
            roomName: m.room?.name || "Chưa xác định",
            status: m.status,
            ...m,
          },
        };
      });

      setEvents(mappedEvents);
    } catch (err) {
      console.error("Lỗi tải lịch họp:", err);
    } finally {
      if (initialLoad) setInitialLoad(false);
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
      setMeetingDetail(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy chi tiết:", err);
      toast.error("Không thể tải chi tiết cuộc họp!");
      setIsModalOpen(false);
    }
  };

  // Xử lý hover cuộc họp để hiển thị tooltip tối giản
  const handleEventMouseEnter = (info) => {
    handleEventMouseLeave();

    const tooltipHtml = getEventTooltipContent(info.event, t);
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
    document.addEventListener("mousemove", onMove);
    tooltip._removeMousemove = () => {
      document.removeEventListener("mousemove", onMove);
    };
  };

  const handleEventMouseLeave = () => {
    if (tooltipRef.current) {
      if (tooltipRef.current._removeMousemove)
        tooltipRef.current._removeMousemove();
      if (tooltipRef.current.parentNode)
        tooltipRef.current.parentNode.removeChild(tooltipRef.current);
      tooltipRef.current = null;
    }
  };

  // ---- GENERATE NON-BUSINESS HOURS SLOTS (for day/week view vertical grid coloring) ----
  function getNonBusinessHourBackgroundEvents(viewStart, viewEnd) {
    const slots = [];
    let d = dayjs(viewStart).startOf("day");
    const until = dayjs(viewEnd).startOf("day");

    while (d.isBefore(until)) {
      // Block thời gian trước giờ hành chính
      slots.push({
        start: d.hour(0).minute(0).second(0).format(),
        end: d.hour(WORK_HOUR_START).minute(0).second(0).format(),
        display: "background",
        classNames: ["fc-nonbusiness"],
      });

      // Block thời gian sau giờ hành chính
      slots.push({
        start: d.hour(WORK_HOUR_END).minute(0).second(0).format(),
        end: d.hour(23).minute(59).second(59).format(),
        display: "background",
        classNames: ["fc-nonbusiness"],
      });

      d = d.add(1, "day");
    }

    // Block quá khứ
    const now = dayjs();
    let dPast = dayjs(viewStart).startOf("day");
    while (dPast.isSameOrBefore(now, "day")) {
      let endOfPast = dPast.isSame(now, "day")
        ? now.format()
        : dPast.hour(23).minute(59).second(59).format();
      slots.push({
        start: dPast.hour(0).minute(0).second(0).format(),
        end: endOfPast,
        display: "background",
        classNames: ["fc-nonbusiness"],
      });
      dPast = dPast.add(1, "day");
    }

    return slots;
  }

  // RED LINE NOW-INDICATOR
  useEffect(() => {
    const id = setInterval(() => {
      try {
        calendarRef.current?.getApi()?.updateNow();
      } catch { }
    }, 20000);
    return () => clearInterval(id);
  }, []);

  // Xử lý click vào khoảng trống trên calendar để đặt lịch nhanh
  const handleDateSelect = (selection) => {
    let start = selection?.startStr ? dayjs(selection.startStr) : null;
    let end = selection?.endStr ? dayjs(selection.endStr) : null;
    if (!start || !end) return;

    const isStartOk = isBusinessTime(start);
    const isEndOk = isBusinessTime(end);

    if (!isStartOk || !isEndOk) {
      toast.warn(
        "Chỉ được tạo lịch trong giờ hành chính từ thứ 2 đến thứ 6 và không chọn quá khứ!"
      );
      return;
    }

    let duration = end.diff(start, "minute");
    if (duration <= 0) duration = 60;

    // LOCK NGÀY USER VỪA CHỌN ĐỂ SAU KHI ĐẶT XONG KHÔNG NHẢY VỀ TODAY
    setLockedViewDate(start.toDate());

    setQuickBooking({
      open: true,
      start: start,
      end: start.add(duration, "minute"),
    });
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
      html.dark .ant-form-item-label > label { color: #f1f5f9 !important; }
      html.dark .ant-input, html.dark .ant-picker, html.dark .ant-select-selector {
        background-color: #1e293b !important;
        color: #f8fafc !important;
        border-color: #334155 !important;
      }
      .ant-picker-calendar-full .ant-picker-panel .ant-picker-body {
        padding: 0 !important;
      }
      html.dark .ant-picker-calendar {
         background: transparent !important;
      }
      
      /* Tùy chỉnh thanh scroll */
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      .dark ::-webkit-scrollbar-thumb {
        background: #475569;
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

  // ===== KÉO THẢ CHỈ CHO KÉO TRONG CÙNG 1 NGÀY =====
  function isSameDay(d1, d2) {
    return (
      dayjs(d1).year() === dayjs(d2).year() &&
      dayjs(d1).month() === dayjs(d2).month() &&
      dayjs(d1).date() === dayjs(d2).date()
    );
  }

  // === AUTO REFRESH EVERY 5 SECONDS ===
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     // Không refresh nếu đang mở modal để tránh nhảy UI
  //     if (
  //       !isModalOpen &&
  //       !isEditModalOpen &&
  //       !isDeleteModalOpen &&
  //       !isQRModalOpen &&
  //       !quickBooking.open
  //     ) {
  //       fetchMeetings(true); // không bật spinner khi auto refresh
  //     }
  //   }, 5000); // 5 giây

  //   return () => clearInterval(interval);
  // }, [
  //   isModalOpen,
  //   isEditModalOpen,
  //   isDeleteModalOpen,
  //   isQRModalOpen,
  //   quickBooking.open,
  // ]);

  const handleExportClick = () => {
    setIsExportModalOpen(true);
  };

  const executeExport = () => {
    let dataToExport = events;

    if (exportOption === "range" && exportDateRange) {
      const [start, end] = exportDateRange;
      const startDate = start.startOf('day');
      const endDate = end.endOf('day');

      dataToExport = events.filter(e => {
        const eventDate = dayjs(e.start);
        return eventDate.isAfter(startDate) && eventDate.isBefore(endDate);
      });
    }

    const headers = ["ID", "Tiêu đề", "Phòng", "Bắt đầu", "Kết thúc", "Trạng thái", "Ghi chú"];
    const rows = dataToExport.map(e => [
      e.id,
      e.title,
      e.extendedProps?.roomName || "N/A",
      dayjs(e.start).format("DD/MM/YYYY HH:mm"),
      dayjs(e.end).format("DD/MM/YYYY HH:mm"),
      e.extendedProps?.status || "UNKNOWN",
      e.extendedProps?.note || ""
    ]);

    exportToCSV(headers, rows, `Danh_sach_lich_hop_${dayjs().format('DDMMYYYY')}`);
    setIsExportModalOpen(false);
  };

  // RENDER
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-500">
      <ToastContainer position="top-right" autoClose={2500} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 border-b pb-3 border-gray-200 dark:border-gray-700 justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md">
            <FiCalendar className="text-white text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
              {t("myMeetingsTitle")}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {t("todayMeetings")}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto mt-2 sm:mt-0">
          <Button
            icon={<FiDownload />}
            onClick={handleExportClick}
            className="!flex !items-center !gap-2"
          >
            {i18n.language === 'vi' ? 'Xuất báo cáo' : 'Export Report'}
          </Button>
        </div>
      </div>

      {/* Modal Xuất Báo Cáo */}
      <Modal
        title="Xuất báo cáo lịch họp"
        open={isExportModalOpen}
        onOk={executeExport}
        onCancel={() => setIsExportModalOpen(false)}
        okText="Xuất file"
        cancelText="Hủy"
      >
        <div className="space-y-4">
          <Radio.Group onChange={(e) => setExportOption(e.target.value)} value={exportOption} className="flex flex-col gap-2">
            <Radio value="all">Tất cả cuộc họp</Radio>
            <Radio value="range">Chọn khoảng thời gian</Radio>
          </Radio.Group>

          {exportOption === "range" && (
            <div className="ml-6">
              <DatePicker.RangePicker
                value={exportDateRange}
                onChange={(dates) => setExportDateRange(dates)}
                format="DD/MM/YYYY"
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Calendar Layout */}
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Spin size="large" />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* SIDEBAR MINI CALENDAR (Desktop only) */}
          <div className="hidden lg:block w-72 shrink-0 space-y-6">
            {/* Create Button */}
            <button
              onClick={() => setQuickBooking({ ...quickBooking, open: true, start: dayjs(), end: dayjs().add(1, 'hour') })}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-full shadow-lg transition-transform transform hover:scale-105 font-medium text-lg"
            >
              <FiPlusCircle size={24} />
              <span>{t("common:buttons.create")}</span>
            </button>

            {/* Mini Calendar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <MiniCalendar
                fullscreen={false}
                onSelect={(date) => {
                  const jsDate = date.toDate();
                  calendarRef.current?.getApi()?.gotoDate(jsDate);
                  setCurrentViewDate(jsDate);
                }}
                value={dayjs(currentViewDate)}
                headerRender={({ value, onChange }) => {
                  const start = 0;
                  const end = 12;
                  const monthOptions = [];

                  const current = value.clone();
                  const localeData = value.localeData();
                  const months = [];
                  for (let i = 0; i < 12; i++) {
                    current.month(i);
                    months.push(localeData.monthsShort(current));
                  }

                  for (let i = start; i < end; i++) {
                    monthOptions.push(
                      <Select.Option key={i} value={i} className="month-item">
                        {months[i]}
                      </Select.Option>,
                    );
                  }

                  const year = value.year();
                  const month = value.month();
                  const options = [];
                  for (let i = year - 10; i < year + 10; i += 1) {
                    options.push(
                      <Select.Option key={i} value={i} className="year-item">
                        {i}
                      </Select.Option>,
                    );
                  }
                  return (
                    <div className="flex justify-between items-center mb-2 px-2">
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {dayjs(value).format("MMMM YYYY")}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="small"
                          type="text"
                          onClick={() => onChange(value.clone().subtract(1, 'month'))}
                        >
                          {"<"}
                        </Button>
                        <Button
                          size="small"
                          type="text"
                          onClick={() => onChange(value.clone().add(1, 'month'))}
                        >
                          {">"}
                        </Button>
                      </div>
                    </div>
                  );
                }}
              />
            </div>

            {/* My Calendars Filter Demo */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">{i18n.language === 'vi' ? 'Lịch của tôi' : 'My Calendars'}</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={showConfirmed}
                    onChange={(e) => setShowConfirmed(e.target.checked)}
                    className="accent-emerald-600"
                  />
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Sự kiện (Emerald)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={showPending}
                    onChange={(e) => setShowPending(e.target.checked)}
                  />
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Chờ duyệt (Amber)</span>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CALENDAR */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-2 transition-colors duration-500 border border-gray-200 dark:border-gray-700">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              firstDay={1}
              initialView="timeGridWeek"
              locale={calendarLocale}
              buttonText={buttonText}
              buttonHints={{
                prev: i18n.language === "vi" ? "Tuần trước" : "Previous",
                next: i18n.language === "vi" ? "Tuần sau" : "Next",
                today: i18n.language === "vi" ? "Hôm nay" : "Today",
                day: i18n.language === "vi" ? "Xem theo ngày" : "Day view",
                week: i18n.language === "vi" ? "Xem theo tuần" : "Week view",
                month: i18n.language === "vi" ? "Xem theo tháng" : "Month view",
              }}
              // BẮT SỰ KIỆN THAY ĐỔI VIEW (CHUYỂN TUẦN / THÁNG / NGÀY)
              datesSet={(arg) => {
                setCurrentViewDate(arg.start);

                // Nếu user chuyển sang tuần/ngày/tháng khác → cập nhật fixedViewDate
                if (
                  !fixedViewDate ||
                  !dayjs(arg.start).isSame(fixedViewDate, "day")
                ) {
                  setFixedViewDate(arg.start);
                }

                setCurrentViewType(arg.view.type);
              }}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "timeGridDay,timeGridWeek,dayGridMonth",
              }}
              allDaySlot={false}
              slotMinTime="08:00:00"
              slotMaxTime="19:00:00"
              events={events.filter(e => {
                if (e.extendedProps.status === "PENDING_APPROVAL") return showPending;
                return showConfirmed;
              })}
              eventClick={handleEventClick}
              eventMouseEnter={handleEventMouseEnter}
              eventMouseLeave={handleEventMouseLeave}
              height="80vh"
              selectable={true}
              selectMirror={true}
              select={handleDateSelect}
              selectAllow={function (selectInfo) {
                const start = dayjs(selectInfo.start);
                const end = dayjs(selectInfo.end);
                const validStart = isBusinessTime(start);
                const validEnd = isBusinessTime(end);
                // chỉ cho phép chọn nếu trong cùng 1 ngày
                const sameDay = isSameDay(start, end.subtract(1, "minute")); // subtract 1 minute to avoid end 00:00 of next day
                return validStart && validEnd && sameDay;
              }}
              eventAllow={function (dropInfo, draggedEvent) {
                const start = dayjs(dropInfo.start);
                const end = dayjs(dropInfo.end);
                const validStart = isBusinessTime(start);
                const validEnd = isBusinessTime(end);
                // CHỈ CHO KÉO THẢ TRONG 1 NGÀY
                const sameDay = isSameDay(start, end.subtract(1, "minute"));
                return validStart && validEnd && sameDay;
              }}
              businessHours={{
                daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                startTime: "08:00",
                endTime: "19:00",
              }}
              backgroundEvents={(arg) =>
                getNonBusinessHourBackgroundEvents(arg.start, arg.end)
              }
              nowIndicator={true}
              dayMaxEvents={true}
              eventClassNames="rounded-md border-0 shadow-sm opacity-90 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      )}

      {/* Modal đặt lịch nhanh */}
      <QuickBookingModal
        open={quickBooking.open}
        onCancel={() =>
          setQuickBooking({ open: false, start: null, end: null })
        }
        quickBookingData={quickBooking}
        onSuccess={fetchMeetings}
        onLockViewDate={(date) => setLockedViewDate(date)}
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

      {/* Modal chi tiết cuộc họp sử dụng MeetingDetailModal */}
      <MeetingDetailModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        meeting={meetingDetail}
      >
        {/* Footer với buttons Sửa/Hủy nếu là người tổ chức */}
        {meetingDetail && meetingDetail.organizer?.id === user?.id ? (
          <div className="flex justify-end gap-2">
            {/* Nút Hiển thị QR Check-in */}
            <Button
              type="default"
              icon={<QrCode size={16} />}
              onClick={() => {
                setIsQRModalOpen(true);
                setIsModalOpen(false);
              }}
              className="bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-800/40 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
            >
              {t("buttons.qrCheckIn")}
            </Button>
            <Button
              type="primary"
              icon={<FiEdit />}
              onClick={() => {
                setIsEditModalOpen(true);
                setIsModalOpen(false);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500"
            >
              {t("buttons.edit")}
            </Button>
            <Button
              danger
              icon={<FiAlertTriangle />}
              onClick={() => {
                setIsDeleteModalOpen(true);
                setIsModalOpen(false);
              }}
            >
              {t("buttons.cancelMeeting")}
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsModalOpen(false)}>Đóng</Button>
        )}
      </MeetingDetailModal>

      {/* Modal hiển thị QR Check-in */}
      <QRCheckInModal
        open={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        checkinCode={meetingDetail?.checkinCode}
        meetingTitle={meetingDetail?.title}
      />
    </div>
  );
};

export default MyMeetingPage;
