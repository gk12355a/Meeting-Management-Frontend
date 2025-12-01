// src/pages/admin/DashboardPage.jsx
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next"; 
import FullCalendar from "@fullcalendar/react";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {  
  FiClock, 
  FiCalendar, 
  FiCheckSquare 
} from "react-icons/fi";

import MeetingListModal from "../../components/MeetingListModal";
import { Spin, message, Modal, Descriptions, Tag } from "antd"; 
import { getAllRooms } from "../../services/roomService";
import { getAllMeetings } from "../../services/reportService";
import dayjs from "dayjs";
import isToday from 'dayjs/plugin/isToday';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isoWeek from 'dayjs/plugin/isoWeek';
import duration from 'dayjs/plugin/duration';
import isBetween from 'dayjs/plugin/isBetween';
import viLocale from "@fullcalendar/core/locales/vi";
import enLocale from "@fullcalendar/core/locales/en-gb";

dayjs.extend(isToday);
dayjs.extend(isSameOrAfter);
dayjs.extend(isoWeek);
dayjs.extend(duration);
dayjs.extend(isBetween);

// const cardTemplates = [
//   { label: "Cuộc họp hôm nay", value: "0", icon: <FiCalendar /> },
//   { label: "Thời lượng họp TB", value: "0", icon: <FiClock /> },
//   { label: "Cuộc họp sắp tới", value: "0", icon: <FiCheckSquare /> },
// ];

const COLORS = [
  "#60A5FA", 
  "#A78BFA", 
  "#F472B6", 
  "#34D399", 
  "#fb5a24ff",
  "#F97316", // cam
  "#06B6D4", // cyan
  "#10B981", // ngọc
  "#F43F5E", // đỏ
  "#6366F1", // tím đậm
  "#8B5CF6", // tím xanh
  "#14B8A6", // xanh teal
  "#E879F9", // hồng nhạt
  "#4ADE80", // xanh mint
  "#FB7185", // đỏ nhạt
];

const formatDuration = (minutes) => {
  if (!minutes || isNaN(minutes) || minutes <= 0) return "0m";
  const d = dayjs.duration(minutes, "minutes");
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(d.asHours())}h ${d.minutes()}m`;
};

const roundToTwo = (num) => {
  if (!num || isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export default function DashboardPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { t, i18n } = useTranslation(['dashboard', 'common']);

  const cardTemplates = [
    // {/* <span>Cuộc họp hôm nay</span> */}
    { label: t('dashboard:cards.todayMeetings'), value: "0", icon: <FiCalendar /> },
    // {/* <span>Thời lượng họp TB</span> */}
    { label: t('dashboard:cards.avgDuration'), value: "0", icon: <FiClock /> },
    // {/* <span>Cuộc họp sắp tới</span> */}
    { label: t('dashboard:cards.upcomingMeetings'), value: "0", icon: <FiCheckSquare /> },
  ];

  // === 2. STATE CHO TẤT CẢ DỮ LIỆU ===
  const [stats, setStats] = useState(cardTemplates);
  const [meetingsPerDayData, setMeetingsPerDayData] = useState([]);
  const [roomUsageData, setRoomUsageData] = useState([]);
  const [calendarResources, setCalendarResources] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMeetingsState, setActiveMeetingsState] = useState([]); // Lưu active meetings
  const tooltipRef = useRef();

  // === STATE CHO MODAL CUỘC HỌP HÔM NAY ===
  const [todayMeetingsModalVisible, setTodayMeetingsModalVisible] = useState(false);
  const [todayMeetingsList, setTodayMeetingsList] = useState([]);

  // STATE CHO MODAL CHI TIẾT CUỘC HỌP
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const [upcomingMeetingsModalVisible, setUpcomingMeetingsModalVisible] = useState(false);
  const [upcomingMeetingsList, setUpcomingMeetingsList] = useState([]);

  // === 3. HÀM MỞ MODAL ===
const handleTodayMeetingsClick = () => {
  const today = dayjs();
  const meetingsToday = activeMeetingsState.filter(m => dayjs(m.startTime).isToday());
  setTodayMeetingsList(meetingsToday);
  setTodayMeetingsModalVisible(true);
};


  const handleUpcomingMeetingsClick = () => {
  const now = dayjs();
  const upcomingMeetings = activeMeetingsState.filter(m => dayjs(m.startTime).isSameOrAfter(now));
  setUpcomingMeetingsList(upcomingMeetings);
  setUpcomingMeetingsModalVisible(true);
};

  // Hàm mở modal chi tiết cuộc họp
  const handleOpenMeetingDetail = (meeting) => {
    setSelectedMeeting(meeting);
    setDetailModalVisible(true);
  };

  // === 4. TOOLTIP ===
  const getEventTooltipContent = (event) => {
  const startTime = dayjs(event.start).format('HH:mm');
  const endTime = dayjs(event.end).format('HH:mm');
  const dateDisplay = dayjs(event.start).format('DD/MM/YYYY');
  const durationMins = dayjs(event.end).diff(dayjs(event.start), 'minute');
  const roomName = event.extendedProps?.roomName || t('dashboard:modal.noEquipment');

  return `
    <div style="line-height: 1.6; min-width: 220px;">
      <div style="font-weight: 600; margin-bottom: 6px; font-size: 14px;">${event.title}</div>

      <div style="font-size: 12px; opacity: 0.9; margin-bottom: 3px;">
        <strong>${t('dashboard:tooltip.date')}:</strong> ${dateDisplay}
      </div>

      <div style="font-size: 12px; opacity: 0.9; margin-bottom: 3px;">
        <strong>${t('dashboard:tooltip.time')}:</strong> ${startTime} - ${endTime} (${durationMins}m)
      </div>

      <div style="font-size: 12px; opacity: 0.9; margin-bottom: 3px;">
        <strong>${t('dashboard:tooltip.room')}:</strong> ${roomName}
      </div>
    </div>
  `;
};

// === CustomRoomTooltip lấy màu từ data.payload.color hoặc data.payload.fill, dùng fill cho Pie Cell, và CustomRoomTooltip hiển thị màu đúng ===
const CustomRoomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    // If using recharts Pie/Cell, the correct color is in 'payload.color' if set, or 'payload.fill'
    // However, for a correct Pie chart, 'fill' in <Cell> should be the actual color.
    const color = data.payload.color || data.payload.fill;
    const name = data.payload.name || data.name || "Không có tên";
    const value = data.value;

    return (
      <div
        style={{
          backgroundColor: isDarkMode ? "#1e293b" : "#fff",
          padding: "8px 12px",
          borderRadius: 8,
          border: "none",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          fontSize: 18,
          color: isDarkMode ? "#f8fafc" : "#1e293b",
        }}
      >
        <span style={{ fontWeight: 600, color }}>{name}: {value}</span>
      </div>
    );
  }
  return null;
};
  const handleEventMouseEnter = (info) => {
    handleEventMouseLeave();
    const tooltipHtml = getEventTooltipContent(info.event);
    let tooltip = document.createElement("div");
    tooltip.innerHTML = tooltipHtml;
    tooltip.style.position = "absolute";
    tooltip.style.zIndex = 9999;
    tooltip.style.background = info.event.backgroundColor; // lấy màu event
    tooltip.style.color = "#fff"; // chữ trắng cho dễ đọc
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

  // === Hàm xử lý khi click sự kiện trên FullCalendar (MỞ POPUP CHI TIẾT CUỘC HỌP) ===
  // Khi click event trên FullCalendar, ta lấy đúng thông tin meeting và mở popup chi tiết
  const handleCalendarEventClick = (info) => {
    // info.event.id là id của event, cần lấy meeting từ danh sách theo id này
    const meetingId = info.event.id;
    // Tìm trong danh sách meetings thực/activeMeetingsState
    // Tìm cả trong calendarEvents hoặc activeMeetingsState hoặc meetingsRes.data?.content nếu cần
    // Để chắc ăn, kiểm tra cả activeMeetingsState lẫn calendarEvents có id = event.id
    const findMeeting =
      activeMeetingsState.find(m => `${m.id}` === `${meetingId}`) ||
      calendarEvents.find(e => `${e.id}` === `${meetingId}`);

    if (findMeeting) {
      // Nếu là bản meeting gốc thì mở luôn, nếu là event (event dạng event object của FC) thì chỉ truyền id
      handleOpenMeetingDetail(findMeeting);
    } else {
      // Nếu không tìm thấy, thử tạo meeting giả từ info.event
      const stub = {
        id: info.event.id,
        title: info.event.title,
        startTime: info.event.start,
        endTime: info.event.end,
        room: {
          name: info.event.extendedProps?.roomName,
          location: info.event.extendedProps?.location,
          status: info.event.extendedProps?.status,
        },
        status: info.event.extendedProps?.status || "",
        organizer: { fullName: info.event.extendedProps?.organizer },
        equipment: [],
        participants: [],
        description: "",
      };
      handleOpenMeetingDetail(stub);
    }
  };

  // === HÀM RENDER NGƯỜI THAM GIA ===
  const renderParticipants = (organizer, participants) => {
    if (!participants && !organizer) {
      // {/* <span>Không có người tham gia.</span> */}
      return <span className="text-gray-500 dark:text-gray-400">{t('dashboard:modal.noParticipants')}</span>;
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
                // {/* <span>(Tổ chức)</span> */}
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(Tổ chức)</span>
              )}
            </span>
            {getTag(p.status)}
          </li>
        ))}
      </ul>
    );
  };

  // === 5. DARK MODE OBSERVER ===
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // === 6. CSS FULLCALENDAR ===
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .fc .fc-col-header-cell-cushion,
      .fc .fc-timeline-slot-cushion,
      .fc .fc-datagrid-cell-main,
      .fc .fc-resource-timeline-divider,
      .fc .fc-scrollgrid-sync-inner,
      .fc .fc-timeline-header-row-chrono th,
      .fc .fc-timeline-slot-label-cushion {
        color: #000 !important;
      }
      .fc .fc-timeline-header-row,
      .fc .fc-datagrid-header,
      .fc .fc-timeline-header {
        background-color: #ffffff !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // === 7. FETCH DATA DASHBOARD ===
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [roomsRes, meetingsRes] = await Promise.all([
          getAllRooms(),
          getAllMeetings()
        ]);

        const resources = (roomsRes.data || []).map(room => ({
          id: room.id.toString(),
          title: room.name,
          status: room.status
        }));
        setCalendarResources(resources);
        // Gán màu cho từng phòng họp theo thứ tự COLORS
        const roomColors = {};
        resources.forEach((res, index) => {
          roomColors[res.id] =
            (res.status || "").toUpperCase() === "UNDER_MAINTENANCE"
              ? "#94a3b8"
              : COLORS[index % COLORS.length];
        });

        const meetings = meetingsRes.data?.content || [];
        const events = meetings.map(meeting => ({
          id: meeting.id.toString(),
          title: meeting.title,
          start: meeting.startTime,
          end: meeting.endTime,
          resourceId: meeting.room?.id?.toString(),
          backgroundColor: roomColors[meeting.room?.id?.toString()] || "#60A5FA",
          borderColor: roomColors[meeting.room?.id?.toString()] || "#2563EB",
          opacity:
            (meeting.room?.status || "").toUpperCase() === "UNDER_MAINTENANCE"
              ? 0.4
              : 1,
          extendedProps: {
            organizer: meeting.organizer?.fullName || t('dashboard:modal.organizer'), // fallback
            roomName: meeting.room?.name || t('dashboard:modal.noEquipment'),
            location: meeting.room?.location || t('dashboard:modal.noEquipment'),
            status: meeting.room?.status
          }
        }));
        setCalendarEvents(events);

        const now = dayjs();
        const activeMeetings = meetings.filter(m => m.status === 'CONFIRMED');
        setActiveMeetingsState(activeMeetings);

        const meetingsToday = activeMeetings.filter(m => dayjs(m.startTime).isToday());
        const participantsToday = meetingsToday.reduce((acc, m) => {
          const acceptedCount = m.participants?.filter(p => p.status === 'ACCEPTED').length || 0;
          return acc + acceptedCount;
        }, 0);
        const totalDuration = activeMeetings.reduce((acc, m) => {
          return acc + dayjs(m.endTime).diff(dayjs(m.startTime), 'minute');
        }, 0);
        const avgDuration = activeMeetings.length > 0 ? roundToTwo(totalDuration / activeMeetings.length) : 0;
        const upcomingMeetings = activeMeetings.filter(m => dayjs(m.startTime).isSameOrAfter(now)).length;

        setStats([
          { ...cardTemplates[0], value: meetingsToday.length.toString() },
          { ...cardTemplates[1], value: formatDuration(avgDuration) },
          { ...cardTemplates[2], value: upcomingMeetings.toString() },
        ]);

        // Bar Chart
        const weekDays = [
  { name: t("dashboard:days.monday"), count: 0 },
  { name: t("dashboard:days.tuesday"), count: 0 },
  { name: t("dashboard:days.wednesday"), count: 0 },
  { name: t("dashboard:days.thursday"), count: 0 },
  { name: t("dashboard:days.friday"), count: 0 },
];
        const startOfWeek = now.startOf('isoWeek');
        const endOfWeek = now.endOf('isoWeek');
        activeMeetings
          .filter(m => dayjs(m.startTime).isBetween(startOfWeek, endOfWeek))
          .forEach(m => {
            const dayIndex = dayjs(m.startTime).isoWeekday() - 1;
            if (dayIndex >= 0 && dayIndex < 5) weekDays[dayIndex].count++;
          });
        setMeetingsPerDayData(weekDays);

        // Pie Chart - Đồng bộ màu với Calendar
        const roomUsage = {};
        const roomColorMap = {}; // Map màu cho từng phòng
        activeMeetings.forEach(m => {
          const roomId = m.room?.id?.toString();
          const roomName = m.room?.name || t('dashboard:modal.noEquipment');
          roomUsage[roomName] = (roomUsage[roomName] || 0) + 1;
          // Lưu màu từ roomColors
          if (!roomColorMap[roomName] && roomId) {
            roomColorMap[roomName] = roomColors[roomId] || COLORS[0];
          }
        });
        // Make sure color is put into both 'color' and 'fill' for each data item to fix Pie chart color.
        const pieData = Object.keys(roomUsage).map(name => {
          const color = roomColorMap[name] || COLORS[0];
          return {
            name,
            value: roomUsage[name],
            color,
            fill: color,
          };
        });
        setRoomUsageData(pieData);

      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu Dashboard:", err);
        message.error("Không thể tải dữ liệu dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  // NOTE: t có thể thay đổi → thêm vào deps để luôn lấy update cardTemplates
  // eslint-disable-next-line
  }, [t]);

  // === 8. RENDER DASHBOARD ===
  return (
  <div className="p-6 space-y-6 transition-all duration-500">
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
        {/* <span>Meeting Overview</span> */}
        <span>{t('dashboard:pageTitle')}</span>
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        {/* <span>Tổng quan hệ thống cuộc họp và hoạt động</span> */}
        <span>{t('dashboard:subtitle')}</span>
      </p>
    </div>

    {loading ? (
      <div className="flex justify-center items-center h-[70vh]">
        <Spin size="large" />
      </div>
    ) : (
      <>
        {/* Cards */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((card, i) => {
            let onClickFunc;
            // Dùng so sánh theo translation label luôn:
            if (card.label === t('dashboard:cards.todayMeetings')) onClickFunc = handleTodayMeetingsClick;
            else if (card.label === t('dashboard:cards.upcomingMeetings')) onClickFunc = handleUpcomingMeetingsClick;

            return (
              <div
                key={i}
                onClick={onClickFunc}
                className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-lg">
                  {card.icon}
                </div>
                <div>
                  {/* <span>Cuộc họp hôm nay | Thời lượng họp TB | Cuộc họp sắp tới</span> */}
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{card.value}</h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow border border-gray-100 dark:border-slate-700">
            {/* <span>📅 Cuộc họp (Tuần này)</span> */}
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              📅 {t('dashboard:charts.weeklyMeetings')}
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={meetingsPerDayData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#e5e7eb"} />
                <XAxis dataKey="name" stroke={isDarkMode ? "#cbd5e1" : "#475569"} />
                <YAxis
                stroke={isDarkMode ? "#cbd5e1" : "#475569"}
                allowDecimals={false}
                tickCount={5}
                domain={[0, 'dataMax + 1']}
                />
                <Tooltip contentStyle={{
                  backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                  color: isDarkMode ? "#f8fafc" : "#1e293b",
                  borderRadius: "8px",
                  border: "none"
                }} />
                <Bar dataKey="count" fill={isDarkMode ? "#818cf8" : "#60A5FA"} radius={[8, 8, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow border border-gray-100 dark:border-slate-700">
            {/* <span>👥 Phòng họp đang sử dụng</span> */}
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              👥 {t('dashboard:charts.roomUsage')}
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={roomUsageData} cx="50%" cy="50%" labelLine={false} outerRadius={80} dataKey="value">
                  {roomUsageData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill || entry.color}
                      color={entry.color} // dùng màu từ data
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomRoomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FullCalendar */}
        <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-lg p-4">
          {/* <span>🗓️ Lịch họp tổng hợp trong ngày</span> */}
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            🗓️ {t('dashboard:charts.calendar')}
          </h3>
          <FullCalendar
            plugins={[resourceTimelinePlugin]}
            schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
            initialView="resourceTimelineDay"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth"
            }}

            locales={[viLocale, enLocale]}     
            locale={i18n.language}             

            titleFormat={{ month: "long", year: "numeric", day: "numeric" }}
            // {/* <span>Phòng họp</span> */}
            resourceAreaHeaderContent={t('dashboard:modal.room')}
            resources={calendarResources}
            events={calendarEvents}
            height="auto"
            slotMinTime="06:00:00"
            slotMaxTime="20:00:00"
            nowIndicator
            eventMinWidth={80}
            locale={i18n.language}
            slotLabelFormat={{ hour: "numeric", minute: "2-digit", hour12: false }}
            eventMouseEnter={handleEventMouseEnter}
            eventMouseLeave={handleEventMouseLeave}
            eventClick={handleCalendarEventClick}
            resourceLabelContent={(arg) => {
              const isMaintenance = arg.resource._resource.extendedProps.status === "UNDER_MAINTENANCE";

              return (
                <span
                  className={`text-sm font-medium ${
                    isMaintenance
                      ? "text-gray-400 line-through opacity-60"
                      : isDarkMode
                      ? "text-gray-200"
                      : "text-gray-800"
                  }`}
                >
                  {arg.resource.title}
                </span>
              );
            }}
            eventContent={(arg) => (
              <div style={{
                background: arg.event.backgroundColor,
                opacity: arg.event.extendedProps.opacity ?? 1,
                color: "white",
                borderRadius: 6,
                padding: "2px 6px",
                fontSize: 12,
                fontWeight: 500,
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                cursor: "pointer"
              }}>
                {arg.event.title}
              </div>
            )}
            views={{
              resourceTimelineDay: { slotDuration: { hours: 1 }, slotLabelFormat: [{ hour: "2-digit", minute: "2-digit", hour12: false }] },
              resourceTimelineWeek: { slotDuration: { days: 1 }, slotLabelFormat: [{ weekday: "short", day: "numeric" }] },
              resourceTimelineMonth: { slotDuration: { days: 1 }, slotLabelFormat: [{ day: "numeric" }] },
            }}
          />
        </div>

        {/* Modal cuộc họp hôm nay */}
        <MeetingListModal
          visible={todayMeetingsModalVisible}
          onClose={() => setTodayMeetingsModalVisible(false)}
          // {/* <span>📋 Cuộc họp hôm nay</span> */}
          title={t('dashboard:modal.todayTitle')}
          meetings={todayMeetingsList}
          onMeetingClick={handleOpenMeetingDetail}
        />

        {/* Modal cuộc họp sắp tới */}
        <MeetingListModal
          visible={upcomingMeetingsModalVisible}
          onClose={() => setUpcomingMeetingsModalVisible(false)}
          // {/* <span>📋 Cuộc họp sắp tới</span> */}
          title={t('dashboard:modal.upcomingTitle')}
          meetings={upcomingMeetingsList}
          onMeetingClick={handleOpenMeetingDetail}
        />
        {/* Modal chi tiết cuộc họp */}
        <Modal
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={null}
          // {/* <span>Chi tiết cuộc họp</span> */}
          title={<span className="dark:text-white">{t('dashboard:modal.detailTitle')}</span>}
          width={600}
          className="dark:[&_.ant-modal-content]:bg-gray-800 dark:[&_.ant-modal-content]:text-gray-200"
        >
          {selectedMeeting ? (
            <Descriptions
              bordered
              column={1}
              className="dark:[&_.ant-descriptions-item-label]:text-gray-300 dark:[&_.ant-descriptions-item-content]:text-gray-100"
            >
              {/* <span>Tên cuộc họp</span> */}
              <Descriptions.Item label={t('dashboard:modal.meetingName')}>
                {selectedMeeting.title}
              </Descriptions.Item>
              {/* <span>Thời gian</span> */}
              <Descriptions.Item label={t('dashboard:modal.time')}>
                {`${dayjs(selectedMeeting.startTime).format("HH:mm")} - ${dayjs(selectedMeeting.endTime).format("HH:mm, DD/MM/YYYY")}`}
              </Descriptions.Item>
              {/* <span>Trạng thái</span> */}
              <Descriptions.Item label={t('dashboard:modal.status')}>
                <Tag color={selectedMeeting.status === 'CONFIRMED' ? 'blue' : 'warning'}>
                  {selectedMeeting.status}
                </Tag>
              </Descriptions.Item>
              {/* <span>Phòng họp</span> */}
              <Descriptions.Item label={t('dashboard:modal.room')}>
                {selectedMeeting.room?.name || t('dashboard:modal.noEquipment')}
                {selectedMeeting.room?.location && ` (${selectedMeeting.room.location})`}
              </Descriptions.Item>
              {selectedMeeting.equipment?.length > 0 && (
                // {/* <span>Thiết bị</span> */}
                <Descriptions.Item label={t('dashboard:modal.equipment')}>
                  {selectedMeeting.equipment.map(eq => eq.name).join(", ")}
                </Descriptions.Item>
              )}
              {/* <span>Người tham gia</span> */}
              <Descriptions.Item label={t('dashboard:modal.participants')}>
                {renderParticipants(selectedMeeting.organizer, selectedMeeting.participants)}
              </Descriptions.Item>
              {/* <span>Ghi chú</span> */}
              <Descriptions.Item label={t('dashboard:modal.notes')}>
                {selectedMeeting.description || t('dashboard:modal.noNotes')}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <div className="flex justify-center py-6">
              <Spin size="large" />
            </div>
          )}
        </Modal>
      </>
    )}
  </div>
);
}