// src/components/user/UserHeader.jsx
import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as notificationService from '../../services/notificationService';
import * as meetingService from '../../services/meetingService';
import {
  FiMenu, FiBell, FiSettings, FiLock, FiLogOut, FiCheck, FiX, FiLoader, FiInbox, FiUser
} from "react-icons/fi";
import ThemeToggle from "../ThemeToggle";
import { message } from "antd";
import LanguageSelector from "../LanguageSelector";

// === COMPONENT CON: NotificationItem ===
const NotificationItem = ({ notification, onMarkRead }) => {
  const navigate = useNavigate();
  const [isResponding, setIsResponding] = useState(false);

  // Logic xác định loại thông báo
  const isStatusUpdate =
    notification.message.includes("đã được phê duyệt") ||
    notification.message.includes("chờ Admin phê duyệt") ||
    notification.message.includes("bị từ chối"); // <-- Đã bao gồm trường hợp của bạn

  // Chỉ hiện nút nếu là Lời mời họp VÀ chưa đọc VÀ không phải thông báo trạng thái
  // const showActions = notification.meetingId && !notification.read && !isStatusUpdate;

  // Tắt hoàn toàn nút Chấp nhận & Từ chối
  const showActions = false;

  const handleResponse = async (status) => {
    if (isResponding) return;
    setIsResponding(true);
    try {
      await meetingService.respondToMeeting(notification.meetingId, status);
      onMarkRead(notification.id);
    } catch (error) {
      console.error(`Lỗi khi ${status} cuộc họp:`, error);
    } finally {
      // setIsResponding(false); 
    }
  };

  // === 1. LOGIC CLICK ===
  const handleNavigate = () => {
    // Luôn đánh dấu là đã đọc khi click vào nội dung
    if (!notification.read) {
       onMarkRead(notification.id);
    }

    // Chỉ điều hướng nếu có meetingId
    if (notification.meetingId) {
      navigate('/user/my-meetings');
    }
  };

  return (
    <div className={`p-3 border-b dark:border-slate-700 ${notification.read ? 'opacity-70' : ''}`}>
      <div onClick={handleNavigate} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 -m-3 p-3 rounded-lg">
        <p className={`text-sm text-gray-800 dark:text-gray-100 ${!notification.read ? 'font-semibold' : ''}`}>
          {notification.message}
        </p>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(notification.createdAt).toLocaleString()}
        </span>
      </div>

      {/* Nút hành động (Chấp nhận/Từ chối) */}
      {showActions && (
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

      {/* === 2. LOGIC HIỂN THỊ TRẠNG THÁI === */}
      {/* Hiển thị "Đã xem" nếu không có nút hành động VÀ đã đọc (Bỏ điều kiện check meetingId) */}
      {(!showActions && notification.read) && (
         <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
           Đã xem.
         </div>
      )}
    </div>
  );
};

// === COMPONENT CHÍNH: UserHeader ===
const UserHeader = ({ setIsSidebarOpen }) => {
  const { logout, user } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const notificationRef = useRef(null);
  const settingsRef = useRef(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const [notificationPage, setNotificationPage] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationService.getUnreadCount();
      const count = Object.values(res.data)[0] || 0;
      setUnreadCount(count);
    } catch (error) { console.error("Lỗi count:", error); }
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
    } catch (error) { console.error("Lỗi list:", error); }
    finally { setNotificationLoading(false); }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      fetchUnreadCount();
    } catch (error) { console.error("Lỗi read:", error); }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) { console.error("Lỗi read all:", error); }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (event.target.closest('.ant-message-notice')) return;
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setIsNotificationOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(event.target)) setIsSettingsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

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
    setIsSettingsOpen(prev => !prev);
    setIsNotificationOpen(false);
  };

  return (
    <header className="h-14 bg-[#0b132b] text-white dark:bg-slate-900 flex items-center justify-between px-5 shadow-md transition-colors z-40 fixed top-0 left-0 right-0">
      {/* Left: Toggle & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen(prev => !prev)}
          className="w-9 h-9 rounded-lg bg-[#1c2541] flex items-center justify-center hover:bg-[#3a506b] transition"
        >
          <FiMenu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">🗓️</div>
          <span className="font-semibold text-lg">MeetFlow</span>
        </div>
      </div>

      {/* Right: User Info & Icons */}
      <div className="flex items-center gap-3">
        <span className="text-sm bg-blue-500 px-3 py-1 rounded-full shadow-md hidden sm:block">
          {user?.username || "User"}
        </span>

        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button onClick={handleNotificationClick} className="w-9 h-9 rounded-lg bg-[#1c2541] flex items-center justify-center hover:bg-[#3a506b] transition relative">
            <FiBell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center border-2 border-[#0b132b] transform translate-x-1/3 -translate-y-1/3">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute top-12 right-0 w-80 max-h-[70vh] flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-700">
              <div className="p-3 border-b dark:border-slate-700 flex justify-between items-center">
                <h4 className="font-semibold text-gray-800 dark:text-white">Thông báo</h4>
                <button onClick={handleMarkAllAsRead} className="text-xs text-blue-500 hover:underline disabled:opacity-50" disabled={notifications.every(n => n.read) || notificationLoading}>
                  Đánh dấu tất cả đã đọc
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {notificationLoading && notifications.length === 0 && (
                  <div className="p-10 flex justify-center items-center"><FiLoader className="animate-spin text-gray-500" size={24} /></div>
                )}
                {!notificationLoading && notifications.length === 0 && (
                  <div className="p-10 flex flex-col justify-center items-center text-center text-gray-500 dark:text-gray-400">
                    <FiInbox size={30} /><p className="mt-2 text-sm">Không có thông báo mới.</p>
                  </div>
                )}
                {notifications.length > 0 && notifications.map((noti) => (
                  <NotificationItem key={noti.id} notification={noti} onMarkRead={handleMarkAsRead} />
                ))}
              </div>
              {hasMoreNotifications && (
                <div className="p-2 border-t dark:border-slate-700 text-center">
                  <button onClick={() => fetchNotifications(notificationPage + 1)} disabled={notificationLoading} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                    {notificationLoading ? 'Đang tải...' : 'Xem thêm'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="relative" ref={settingsRef}>
          <button onClick={handleSettingsClick} className="w-9 h-9 rounded-lg bg-[#1c2541] flex items-center justify-center hover:bg-[#3a506b] transition">
            <FiSettings size={20} />
          </button>
          {isSettingsOpen && (
  <div className="absolute top-12 right-0 w-52 bg-white dark:bg-slate-800 
      rounded-lg shadow-xl border dark:border-slate-700 py-2">

    {/* Language Selector — menu item */}
    <LanguageSelector />

    {/* Theme Toggle — menu item */}
    <ThemeToggle />

    {/* Profile */}
    <NavLink
      to="/user/profile"
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 
                 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
    >
      <FiUser size={16} />
      <span>Thông tin cá nhân</span>
    </NavLink>

    {/* Change Password */}
    <NavLink
      to="/user/change-password"
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 
                 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
    >
      <FiLock size={16} />
      <span>Đổi mật khẩu</span>
    </NavLink>

    {/* Logout */}
    <button
      onClick={() => { logout(); setIsSettingsOpen(false); }}
      className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm 
                 text-red-500 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700"
    >
      <FiLogOut size={16} />
      <span>Đăng xuất</span>
    </button>
  </div>
)}

        </div>
      </div>
    </header>
  );
};

export default UserHeader;