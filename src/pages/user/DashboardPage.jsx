// src/pages/user/DashboardPage
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { FiCalendar, FiClock, FiUsers, FiCheckSquare } from "react-icons/fi";
import { HiComputerDesktop, HiBuildingOffice } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { Spin, message, Modal, Pagination } from "antd";
import { getMyMeetings, getMeetingById } from "../../services/meetingService";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import isToday from "dayjs/plugin/isToday";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isBetween from "dayjs/plugin/isBetween";
import isoWeek from "dayjs/plugin/isoWeek";
import MeetingDetailModal from "../../components/user/MeetingDetailModal";
import MeetingListModal from "../../components/MeetingListModal";
// --- dayjs config ---
dayjs.locale("vi");
dayjs.extend(isToday);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(isoWeek);

// Template cho thẻ Stats 
// Template cho thẻ Stats 
const statTemplates = [
  {
    key: "stats.today",
    value: "0",
    icon: <FiCalendar size={20} />,
    color: "emerald",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    key: "stats.week",
    value: "0",
    icon: <FiClock size={20} />,
    color: "blue",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    key: "stats.upcoming",
    value: "0",
    icon: <FiUsers size={20} />,
    color: "purple",
    gradient: "from-purple-500 to-fuchsia-500",
  },
  {
    key: "stats.total",
    value: "0",
    icon: <FiCheckSquare size={20} />,
    color: "orange",
    gradient: "from-orange-500 to-amber-500",
  },
];

// // Helper renderParticipants như MyMeetingsPage.jsx
// function renderParticipants(organizer, participants) {
//   const otherParticipants =
//     participants && Array.isArray(participants)
//       ? participants.filter((p) => p.id !== organizer?.id)
//       : [];
//   return (
//     <span>
//       <Tag color="volcano">{organizer?.fullName || organizer?.username || "Người tổ chức"}</Tag>
//       {otherParticipants.map((p) => (
//         <Tag
//           key={p.id}
//           color={
//             p.status === "ACCEPTED"
//               ? "blue"
//               : p.status === "DECLINED"
//               ? "red"
//               : p.status === "TENTATIVE"
//               ? "orange"
//               : "default"
//           }
//         >
//           {p.fullName || p.username}
//         </Tag>
//       ))}
//     </span>
//   );
// }

export default function DashboardPage() {
  const { t } = useTranslation("userDashboard");
  const [listModalOpen, setListModalOpen] = useState(false);
  const [listModalTitle, setListModalTitle] = useState("");
  const [listModalData, setListModalData] = useState([]);
  const [activeMeetingsAll, setActiveMeetingsAll] = useState([]);
  const [upcomingMeetingsAll, setUpcomingMeetingsAll] = useState([]);
  const [page, setPage] = useState(1);

  const { user } = useAuth(); // Cần user.id để lọc
  const navigate = useNavigate();

  const [stats, setStats] = useState(statTemplates);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- POPUP STATE ---
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Dùng ref để tránh memory leak khi component bị unmount khi đang load
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  // === 3. GỌI API KHI MỞ TRANG ===
  useEffect(() => {
    // Cần có user.id để lọc chính xác
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const res = await getMyMeetings(0, 100);
        const allMeetings = res.data?.content || [];
        const now = dayjs();

        // === LOGIC SỬA LỖI QUAN TRỌNG ===
        // Lọc các cuộc họp mà user này KHÔNG TỪ CHỐI
        const activeMeetings = allMeetings.filter((m) => {
          if (m.status === "CANCELLED") {
            return false;
          }
          const userParticipant = m.participants?.find((p) => p.id === user.id);

          if (userParticipant) {
            // 3. Chỉ tính nếu trạng thái KHÁC 'DECLINED'
            return userParticipant.status !== "DECLINED";
          }

          // 4. Failsafe: Nếu user là người tổ chức (organizer) (và có thể không có trong ds participants), vẫn tính
          if (m.organizer?.id === user.id) {
            return true;
          }

          // Nếu không_phải_người_tổ_chức VÀ không_có_trong_ds_tham_gia -> Bỏ qua
          return false;
        });

        // --- A. Xử lý Lịch họp sắp tới (Dùng activeMeetings đã lọc) ---
        const upcoming = activeMeetings
          .filter((m) => dayjs(m.startTime).isSameOrAfter(now))
          .sort(
            (a, b) =>
              dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
          );

        setUpcomingMeetings(upcoming.slice(0, 3)); // Chỉ lấy 3 cuộc họp
        setActiveMeetingsAll(activeMeetings);
        setUpcomingMeetingsAll(upcoming);
        // Thống kê
        const meetingsToday = activeMeetings.filter((m) =>
          dayjs(m.startTime).isToday()
        ).length;

        const meetingsThisWeek = activeMeetings.filter((m) =>
          dayjs(m.startTime).isBetween(now.startOf("isoWeek"), now.endOf("isoWeek"))
        ).length;

        const totalUpcoming = upcoming.length;
        const totalActive = activeMeetings.length; // Tổng số (không bị từ chối)

        // Cập nhật state của stats
        setStats([
          { ...statTemplates[0], value: meetingsToday.toString() },
          { ...statTemplates[1], value: meetingsThisWeek.toString() },
          { ...statTemplates[2], value: totalUpcoming.toString() },
          { ...statTemplates[3], value: totalActive.toString() },
        ]);
      } catch (err) {
        console.error("Lỗi tải dashboard:", err);
        message.error("Không thể tải dữ liệu dashboard.");
      } finally {
        if (!unmountedRef.current) setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]); // làm dependency

  // Khi selectedMeetingId thay đổi (khi user click), mới fetch chi tiết và show popup (tối ưu tránh nháy)
  useEffect(() => {
    // Nếu không có id (đã tắt dialog) hoặc đang chưa chọn gì thì clear dữ liệu
    if (!selectedMeetingId) {
      setSelectedMeeting(null);
      setLoadingDetail(false);
      return;
    }

    // 1. Hiển thị popup ngay với dữ liệu tạm thời (lần mở đầu sẽ chưa có detail)
    const meetingInList = upcomingMeetings.find(x => x.id === selectedMeetingId);
    // Khi handleShowMeetingDetail được gọi, ta sẽ setSelectedMeetingId, và selectedMeeting = undefined => mở luôn Modal với trạng thái loadingDetail=true
    if (meetingInList) setSelectedMeeting(meetingInList);

    setLoadingDetail(true);

    // 2. Gọi API lấy detail
    getMeetingById(selectedMeetingId)
      .then((res) => {
        if (unmountedRef.current) return;
        setSelectedMeeting(res.data);
      })
      .catch(() => {
        if (unmountedRef.current) return;
        message.error("Không thể tải chi tiết cuộc họp.");
      })
      .finally(() => {
        if (unmountedRef.current) return;
        setLoadingDetail(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMeetingId]);

  // Handler popup
  const handleShowMeetingDetail = (meeting) => {
    setSelectedMeetingId(meeting.id);
    // Không đặt loadingDetail=true ở đây nữa (do effect trên sẽ xử lý)
    // Không setSelectedMeeting(null) ở đây luôn (giữ lại, chỉ mất khi id=null)
  };

  const handleCloseMeetingDetail = () => {
    setSelectedMeetingId(null);
    // setSelectedMeeting sẽ clear bên trong useEffect khi selectedMeetingId = null
  };

  // Handler functions for navigation
  const handleCreateMeeting = () => {
    navigate("/user/create-meeting");
  };
  const handleViewRooms = () => {
    navigate("/user/rooms");
  };
  const handleViewDevices = () => {
    navigate("/user/devices");
  };
  const handleOpenStat = (type) => {
    if (type === "today") {
      setListModalTitle(t("stats.today"));
      setListModalData(activeMeetingsAll.filter(m => dayjs(m.startTime).isToday()));
    }

    if (type === "week") {
      setListModalTitle(t("stats.week"));
      setListModalData(
        activeMeetingsAll.filter(m =>
          dayjs(m.startTime).isBetween(
            dayjs().startOf("isoWeek"),
            dayjs().endOf("isoWeek")
          )
        )
      );
    }

    if (type === "upcoming") {
      setListModalTitle(t("stats.upcoming"));
      setListModalData(upcomingMeetingsAll);
    }

    if (type === "total") {
      setListModalTitle(t("stats.total"));
      setListModalData(activeMeetingsAll);
    }

    setListModalOpen(true);
    setPage(1); // Reset về trang 1 mỗi lần mở
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            👋 {t("welcomeTitle", { username: user?.fullName || user?.username || "User" })}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t("welcomeSubtitle")}
          </p>
        </div>
      </div>

      {/* Wrapper cho Spinner */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((stat, index) => (
              <div
                key={index}
                onClick={() => {
                  if (index === 0) handleOpenStat("today");
                  if (index === 1) handleOpenStat("week");
                  if (index === 2) handleOpenStat("upcoming");
                  if (index === 3) handleOpenStat("total");
                }}
                className="group relative cursor-pointer bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-slate-700"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t(stat.key)}</p>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg shadow-${stat.color}-500/30 transform group-hover:scale-110 transition-transform`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-4 h-1 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${stat.gradient} w-[70%] rounded-full opacity-80`}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Upcoming meetings */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <FiCalendar size={18} />
              </span>
              {t("upcomingMeetingsTitle")}
            </h2>

            <div className="space-y-4">
              {upcomingMeetings.map((meeting) => {
                const acceptedCount =
                  meeting.participants?.filter((p) => p.status === "ACCEPTED").length || 0;

                return (
                  <div
                    key={meeting.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/30 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 transition-all cursor-pointer group"
                    onClick={() => handleShowMeetingDetail(meeting)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 flex flex-col items-center bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm w-14 text-center border border-gray-100 dark:border-slate-600">
                        <span className="text-xs font-bold text-red-500 uppercase">{dayjs(meeting.startTime).format("MMM")}</span>
                        <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{dayjs(meeting.startTime).format("DD")}</span>
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {meeting.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <FiClock size={14} />
                            {dayjs(meeting.startTime).format("HH:mm")} - {dayjs(meeting.endTime).format("HH:mm")}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiUsers size={14} />
                            {meeting.room?.name || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-0 flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm">
                      <FiUsers size={14} />
                      <span>{t("meeting.participants", { count: acceptedCount })}</span>
                    </div>
                  </div>
                );
              })}

              {upcomingMeetings.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                  <FiCalendar size={48} className="mb-3 opacity-20" />
                  <p>{t("meeting.upcomingMeetingsEmpty")}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Meeting Details Modal */}
      <MeetingDetailModal
        open={!!selectedMeetingId}
        onClose={handleCloseMeetingDetail}
        meeting={selectedMeeting}
        loading={loadingDetail}
      >
      </MeetingDetailModal>
      {/* Meeting List Modal */}
      <MeetingListModal
        visible={listModalOpen}
        onClose={() => setListModalOpen(false)}
        title={listModalTitle}
        meetings={listModalData} // toàn bộ dữ liệu, không phân trang
        onMeetingClick={(m) => {
          setListModalOpen(false);
          handleShowMeetingDetail(m);
        }}
      />

      {/* Loading overlay khi đang fetch dashboard */}
      {loadingDetail && false && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9998]">
          <Spin size="large" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button
          className="relative overflow-hidden group bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl p-6 text-left shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all duration-300"
          onClick={handleCreateMeeting}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
            <FiCalendar size={100} />
          </div>
          <h3 className="font-bold text-xl mb-2 relative z-10">{t("buttons.create")}</h3>
          <p className="text-sm text-emerald-100 relative z-10 font-medium">
            {t("buttonDesc.create")}
          </p>
        </button>

        <button
          className="relative overflow-hidden group bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl p-6 text-left shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all duration-300"
          onClick={handleViewRooms}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
            <HiBuildingOffice size={100} />
          </div>
          <h3 className="font-bold text-xl mb-2 relative z-10">{t("buttons.rooms")}</h3>
          <p className="text-sm text-blue-100 relative z-10 font-medium">
            {t("buttonDesc.rooms")}
          </p>
        </button>
        <button
          className="relative overflow-hidden group bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-2xl p-6 text-left shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-1 transition-all duration-300"
          onClick={handleViewDevices}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
            <HiComputerDesktop size={100} />
          </div>
          <h3 className="font-bold text-xl mb-2 relative z-10">{t("buttons.devices")}</h3>
          <p className="text-sm text-purple-100 relative z-10 font-medium">
            {t("buttonDesc.devices")}
          </p>
        </button>
      </div>
    </div>
  );
}