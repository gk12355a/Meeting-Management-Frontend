// src/pages/user/DashboardPage
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { FiCalendar, FiClock, FiUsers, FiCheckSquare } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Spin, message } from "antd";
import { getMyMeetings, getMeetingById } from "../../services/meetingService";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import isToday from "dayjs/plugin/isToday";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isBetween from "dayjs/plugin/isBetween"; // <-- THÊM PLUGIN
import isoWeek from "dayjs/plugin/isoWeek";
import MeetingDetailModal from "../../components/user/MeetingDetailModal";

// --- dayjs config ---
dayjs.locale("vi");
dayjs.extend(isToday);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(isoWeek);

// Template cho thẻ Stats 
const statTemplates = [
  {
    title: "Lịch họp hôm nay",
    value: "0",
    icon: <FiCalendar size={24} />,
    textColor: "text-blue-600",
    bgLight: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    title: "Lịch họp tuần này",
    value: "0",
    icon: <FiClock size={24} />,
    textColor: "text-green-600",
    bgLight: "bg-green-50 dark:bg-green-900/20",
  },
  {
    title: "Cuộc họp sắp tới",
    value: "0",
    icon: <FiUsers size={24} />,
    textColor: "text-purple-600",
    bgLight: "bg-purple-50 dark:bg-purple-900/20",
  },
  {
    title: "Tổng số cuộc họp",
    value: "0",
    icon: <FiCheckSquare size={24} />,
    textColor: "text-orange-600",
    bgLight: "bg-orange-50 dark:bg-orange-900/20",
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
  const [listModalOpen, setListModalOpen] = useState(false);
  const [listModalTitle, setListModalTitle] = useState("");
  const [listModalData, setListModalData] = useState([]);
  const [activeMeetingsAll, setActiveMeetingsAll] = useState([]);
  const [upcomingMeetingsAll, setUpcomingMeetingsAll] = useState([]);
  
  const { user } = useAuth(); // <-- Cần user.id để lọc
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
  }, [user]); // <-- THÊM 'user' làm dependency

  // Khi selectedMeetingId thay đổi (khi user click), mới fetch chi tiết và show popup (tối ưu tránh nháy)
  useEffect(() => {
    // Nếu không có id (đã tắt dialog) hoặc đang chưa chọn gì => clear dữ liệu
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            👋 Xin chào, {user?.username || "User"}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Chào mừng bạn đến với hệ thống quản lý lịch họp
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div
                onClick={() => {
                  if (index === 0) handleOpenStat("today");
                  if (index === 1) handleOpenStat("week");
                  if (index === 2) handleOpenStat("upcoming");
                  if (index === 3) handleOpenStat("total");
                }}
                className="cursor-pointer bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border ... hover:scale-105"
                >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {stat.title}
                    </p>
                    <p className={`text-2xl font-bold ${stat.textColor} dark:text-gray-100`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.bgLight} p-3 rounded-lg`}>
                    <div className={`${stat.textColor}`}>{stat.icon}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* UPCOMING MEETINGS */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              📅 Lịch họp sắp tới
            </h2>

            <div className="space-y-3">
              {upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition cursor-pointer"
                  onClick={() => handleShowMeetingDetail(meeting)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                      {meeting.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {dayjs(meeting.startTime).format("HH:mm")} - {dayjs(meeting.endTime).format("HH:mm")}
                       · {meeting.room?.name || "N/A"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FiUsers size={16} />
                    {/* === SỬA LỖI ĐẾM SỐ NGƯỜI THAM GIA === */}
                    <span>
                      {/* Chỉ đếm những người 'ACCEPTED' */}
                      {meeting.participants?.filter((p) => p.status === "ACCEPTED").length || 0} người
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {upcomingMeetings.length === 0 && !loading && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                Không có lịch họp nào sắp tới
              </p>
            )}
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

      {/* Loading overlay khi đang fetch dashboard */}
      {loadingDetail && false && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9998]">
          <Spin size="large" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          className="bg-blue-500 text-white rounded-xl p-6 text-left hover:bg-blue-600 transition shadow-md"
          onClick={handleCreateMeeting}
        >
          <h3 className="font-semibold text-lg mb-2">Tạo lịch họp mới</h3>
          <p className="text-sm text-blue-100">
            Đặt phòng và thiết bị cho cuộc họp
          </p>
        </button>

        <button
          className="bg-green-500 text-white rounded-xl p-6 text-left hover:bg-green-600 transition shadow-md"
          onClick={handleViewRooms}
        >
          <h3 className="font-semibold text-lg mb-2">Xem phòng trống</h3>
          <p className="text-sm text-green-100">
            Tìm phòng họp phù hợp với nhu cầu
          </p>
        </button>
        <button
          className="bg-purple-500 text-white rounded-xl p-6 text-left hover:bg-purple-600 transition shadow-md"
          onClick={handleViewDevices}
        >
          <h3 className="font-semibold text-lg mb-2">Xem thiết bị</h3>
          <p className="text-sm text-purple-100">
            Xem thiết bị phù hợp với nhu cầu
          </p>
        </button>
      </div>
    </div>
  );
}
const handleOpenStat = (type) => {
  if (type === "today") {
    setListModalTitle("Lịch họp hôm nay");
    setListModalData(
      upcomingMeetingsAll.filter(m => dayjs(m.startTime).isToday())
    );
  }
  if (type === "week") {
    setListModalTitle("Lịch họp tuần này");
    setListModalData(
      upcomingMeetingsAll.filter(m =>
        dayjs(m.startTime).isBetween(dayjs().startOf("isoWeek"), dayjs().endOf("isoWeek"))
      )
    );
  }
  if (type === "upcoming") {
    setListModalTitle("Các cuộc họp sắp tới");
    setListModalData(upcomingMeetings);
  }
  if (type === "total") {
    setListModalTitle("Tổng số cuộc họp");
    setListModalData(activeMeetingsAll);
  }

  setListModalOpen(true);
};