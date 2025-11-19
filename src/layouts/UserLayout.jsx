// src/layouts/UserLayout.jsx
import { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// === 1. IMPORT SERVICE MỚI ===
import * as notificationService from '../services/notificationService';
import * as meetingService from '../services/meetingService'; // <-- THÊM MỚI

import {
  FiHome, FiCalendar, FiPlusCircle, FiBriefcase, FiClock, FiUser, FiMenu,
  FiBell, FiSettings, FiLock, FiLogOut, FiLoader, FiInbox, FiMonitor,
  FiCheck, // <-- Icon Chấp nhận
  FiX,     // <-- Icon Từ chối
} from "react-icons/fi";
import ThemeToggle from "../components/ThemeToggle";

const userMenu = [
  { to: "/user", label: "Dashboard", icon: <FiHome size={18} /> },
  { to: "/user/my-meetings", label: "Lịch họp của tôi", icon: <FiCalendar size={18} /> },
  { to: "/user/create-meeting", label: "Tạo cuộc họp", icon: <FiPlusCircle size={18} /> },
  { to: "/user/rooms", label: "Phòng họp", icon: <FiBriefcase size={18} /> },
  { to: "/user/devices", label: "Thiết bị", icon: <FiMonitor size={18} /> },
  { to: "/user/history", label: "Lịch sử họp", icon: <FiClock size={18} /> },
  // { to: "/user/profile", label: "Thông tin cá nhân", icon: <FiUser size={18} /> },
];


// === 2. COMPONENT CON ĐÃ ĐƯỢC NÂNG CẤP ===
const NotificationItem = ({ notification, onMarkRead }) => {
  const navigate = useNavigate();
  // State nội bộ để quản lý trạng thái đang xử lý (khi nhấn nút)
  const [isResponding, setIsResponding] = useState(false);

  // Kiểm tra xem đây có phải là lời mời họp hay không
  // Giả định: có meetingId VÀ chưa đọc (read: false)
  const isInvitation = notification.meetingId && !notification.read;

  // Xử lý khi nhấn nút Chấp nhận / Từ chối
  const handleResponse = async (status) => {
    if (isResponding) return;
    setIsResponding(true);

    try {
      // 1. Gọi API phản hồi cuộc họp
      await meetingService.respondToMeeting(notification.meetingId, status);
      
      // 2. (Thành công) Đánh dấu thông báo là đã đọc
      // onMarkRead sẽ kích hoạt parent tải lại list & số lượng
      onMarkRead(notification.id); 

    } catch (error) {
      console.error(`Lỗi khi ${status} cuộc họp:`, error);
      // (Có thể thêm thông báo toast/alert lỗi ở đây)
    } finally {
      // (Không cần setIsResponding(false) vì component sẽ re-render
      // và isInvitation sẽ là false, làm ẩn các nút đi)
    }
  };

  // Xử lý khi nhấn vào nội dung thông báo (để xem chi tiết)
  const handleNavigate = () => {
    if (notification.meetingId) {
      // Nếu là lời mời, đưa đến trang chi tiết
      // Tạm thời, đưa đến trang "Lịch họp của tôi"
      navigate('/user/my-meetings');
      
      // Nếu đây không phải là lời mời (đã đọc), thì chỉ cần đánh dấu là đã đọc (nếu chưa)
      if (!notification.read) {
         onMarkRead(notification.id);
      }
    }
  };

  return (
    <div 
      className={`p-3 border-b dark:border-slate-700 ${notification.read ? 'opacity-70' : ''}`}
    >
      {/* Phần nội dung thông báo */}
      <div 
        onClick={handleNavigate} // Nhấn vào text để điều hướng
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 -m-3 p-3 rounded-lg" // Trick để click-area to hơn
      >
        <p className={`text-sm text-gray-800 dark:text-gray-100 ${!notification.read ? 'font-semibold' : ''}`}>
          {notification.message}
        </p>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(notification.createdAt).toLocaleString()}
        </span>
      </div>

      {/* === 3. CÁC NÚT HÀNH ĐỘNG MỚI === */}
      {isInvitation && ( // Chỉ hiển thị nếu là lời mời (có meetingId và chưa đọc)
        <div className="flex items-center space-x-2 mt-3">
          <button
            onClick={() => handleResponse('ACCEPTED')}
            disabled={isResponding}
            className="flex-1 inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            <FiCheck size={14} className="mr-1" />
            Chấp nhận
          </button>
          <button
            onClick={() => handleResponse('DECLINED')}
            disabled={isResponding}
            className="flex-1 inline-flex justify-center items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 dark:bg-slate-600 dark:text-gray-100 dark:border-slate-500 disabled:opacity-50"
          >
            <FiX size={14} className="mr-1" />
            Từ chối
          </button>
        </div>
      )}

      {/* Hiển thị trạng thái "Đã phản hồi" nếu nó đã được đọc và có meetingId */}
      {notification.read && notification.meetingId && (
         <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
           Đã phản hồi.
         </div>
      )}
    </div>
  );
}

// === COMPONENT LAYOUT CHÍNH (Giữ nguyên logic tải thông báo) ===
export default function UserLayout() {
  const { logout, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const notificationRef = useRef(null);
  const settingsRef = useRef(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationPage, setNotificationPage] = useState(0);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);

  // --- HÀM TẢI (Không thay đổi) ---
  const fetchUnreadCount = async () => {
    try {
      const res = await notificationService.getUnreadCount();
      const count = Object.values(res.data)[0] || 0; 
      setUnreadCount(count);
    } catch (error) {
      console.error("Lỗi lấy số thông báo chưa đọc:", error);
    }
  };

  const fetchNotifications = async (page) => {
    if (notificationLoading) return;
    setNotificationLoading(true);
    try {
      const res = await notificationService.getNotifications(page, 5); 
      const data = res.data;
      setNotifications(prev => page === 0 ? data.content : [...prev, ...data.content]);
      setHasMoreNotifications(!data.last);
      setNotificationPage(page);
    } catch (error) {
      console.error("Lỗi lấy danh sách thông báo:", error);
    } finally {
      setNotificationLoading(false);
    }
  };

  // --- HÀM ĐÁNH DẤU ĐÃ ĐỌC (SỬA ĐỔI NHẸ) ---
  // (Hàm này giờ được gọi bởi NotificationItem SAU KHI phản hồi thành công)
  // (Nó cũng được gọi khi nhấn "Đánh dấu tất cả")
  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      // Cập nhật UI ngay lập tức
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      // Tải lại số lượng
      fetchUnreadCount();
    } catch (error) {
      console.error("Lỗi đánh dấu đã đọc:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Lỗi đánh dấu tất cả đã đọc:", error);
    }
  };

  // --- Xử lý click-outside ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- Tải số lượng ---
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // --- Xử lý click Dropdown ---
  const handleNotificationClick = () => {
    const opening = !isNotificationOpen;
    setIsNotificationOpen(opening);
    setIsSettingsOpen(false);
    if (opening) {
      setNotificationPage(0);
      fetchNotifications(0);
    }
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen((prev) => !prev);
    setIsNotificationOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="h-14 bg-[#0b132b] text-white dark:bg-slate-900 flex items-center justify-between px-5 shadow-md transition-colors z-40 fixed top-0 left-0 right-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="w-9 h-9 rounded-lg bg-[#1c2541] flex items-center justify-center hover:bg-[#3a506b] transition"
          >
            <FiMenu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              🗓️
            </div>
            <span className="font-semibold text-lg">MeetFlow</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm bg-blue-500 px-3 py-1 rounded-full shadow-md hidden sm:block">
            {user?.username || "User"}
          </span>

          {/* NÚT CHUÔNG */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={handleNotificationClick}
              className="w-9 h-9 rounded-lg bg-[#1c2541] flex items-center justify-center hover:bg-[#3a506b] transition relative"
            >
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center border-2 border-[#0b132b] transform translate-x-1/3 -translate-y-1/3">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* DROPDOWN THÔNG BÁO (Phần .map() đã được cập nhật) */}
            {isNotificationOpen && (
              <div className="absolute top-12 right-0 w-80 max-h-[70vh] flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-700">
                
                <div className="p-3 border-b dark:border-slate-700 flex justify-between items-center">
                  <h4 className="font-semibold text-gray-800 dark:text-white">Thông báo</h4>
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-blue-500 hover:underline disabled:opacity-50"
                    disabled={notifications.every(n => n.read) || notificationLoading}
                  >
                    Đánh dấu tất cả đã đọc
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {notificationLoading && notifications.length === 0 && (
                    <div className="p-10 flex justify-center items-center">
                      <FiLoader className="animate-spin text-gray-500" size={24} />
                    </div>
                  )}
                  {!notificationLoading && notifications.length === 0 && (
                    <div className="p-10 flex flex-col justify-center items-center text-center text-gray-500 dark:text-gray-400">
                      <FiInbox size={30} />
                      <p className="mt-2 text-sm">Không có thông báo mới.</p>
                    </div>
                  )}
                  {notifications.length > 0 && notifications.map((noti) => (
                    <NotificationItem 
                      key={noti.id} 
                      notification={noti} 
                      onMarkRead={handleMarkAsRead} // <-- Truyền hàm xuống
                    />
                  ))}
                </div>

                {hasMoreNotifications && (
                  <div className="p-2 border-t dark:border-slate-700 text-center">
                    <button 
                      onClick={() => fetchNotifications(notificationPage + 1)}
                      disabled={notificationLoading}
                      className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {notificationLoading ? 'Đang tải...' : 'Xem thêm'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* NÚT CÀI ĐẶT */}
<div className="relative" ref={settingsRef}>
  <button
    onClick={handleSettingsClick}
    className="w-9 h-9 rounded-lg bg-[#1c2541] flex items-center justify-center hover:bg-[#3a506b] transition"
  >
    <FiSettings size={20} />
  </button>

            {isSettingsOpen && (
              <div className="absolute top-12 right-0 w-52 bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-700 py-2">
                
                {/* Nút đổi chế độ sáng/tối */}
                <ThemeToggle />

                {/* Thông tin cá nhân */}
                <NavLink
                  to="/user/profile"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  <FiUser size={16} />
                  <span>Thông tin cá nhân</span>
                </NavLink>

                {/* Đổi mật khẩu */}
                <NavLink
                  to="/user/change-password"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  <FiLock size={16} />
                  <span>Đổi mật khẩu</span>
                </NavLink>

                {/* Đăng xuất */}
                <button
                  onClick={() => {
                    logout();
                    setIsSettingsOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <FiLogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <aside
        className={`fixed top-14 left-0 bg-white dark:bg-slate-900 
              border-r dark:border-slate-800 shadow-md w-64 h-[calc(100%-56px)]
              transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-64"}
              transition-transform duration-300 ease-in-out z-30`}
        >
          <div className="flex flex-col items-center py-5 border-b border-gray-100 dark:border-slate-800">
            <div className="text-center">
              <p className="font-semibold text-gray-700 dark:text-gray-100 text-base">
                MeetFlow User
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Quản lý lịch họp cá nhân
              </p>
            </div>
          </div>
          <nav className="mt-3 px-2">
            {userMenu.map((m) => (
              <NavLink
                key={m.to}
                to={m.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl mb-1 text-[15px] transition ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-500 shadow-sm dark:bg-slate-800 dark:text-blue-300"
                      : "text-gray-700 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-200 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                  }`
                }
              >
                {m.icon}
                <span>{m.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
        
        {/* Overlay cho mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 md:hidden z-10"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Main content */}
        <div className="flex-1 ml-64 mt-14">
          <main className="p-6 overflow-y-auto bg-gray-50 dark:bg-slate-950 transition-colors">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}