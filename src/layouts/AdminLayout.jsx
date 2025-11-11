import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMenu, FiUsers, FiBarChart2 } from "react-icons/fi";
import { FiBriefcase } from "react-icons/fi";
import { BsCalendar4Week } from "react-icons/bs";
import { HiOutlineDeviceMobile } from "react-icons/hi";
import ThemeToggle from "../components/ThemeToggle";

export default function AdminLayout() {
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menu = [
    { to: "/admin", label: "Dashboard", icon: <BsCalendar4Week size={18} /> },
    { to: "/admin/users", label: "Người dùng ", icon: <FiUsers size={18} /> },
    {
      to: "/admin/rooms",
      label: "Quản lý phòng họp",
      icon: <FiBriefcase size={18} />,
    },
    {
      to: "/admin/devices",
      label: "Quản lý thiết bị",
      icon: <HiOutlineDeviceMobile size={18} />,
    },
    {
      to: "/admin/reports",
      label: "Thống kê & báo cáo",
      icon: <FiBarChart2 size={18} />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="h-14 bg-[#0b132b] text-white dark:bg-slate-900 flex items-center justify-between px-5 shadow-md transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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

        <div className="flex items-center gap-4">
          <span className="text-sm bg-blue-500 px-3 py-1 rounded-full shadow-md">
            Admin
          </span>
          <button
            onClick={logout}
            className="text-xs border border-gray-400 rounded-full px-3 py-1 hover:bg-[#1c2541] transition"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <aside
          className={`fixed md:static top-14 md:top-0 left-0 bg-white dark:bg-slate-900 
                      border-r dark:border-slate-800 shadow-md w-64 h-[calc(100%-56px)] md:h-auto 
                      transform ${
                        isSidebarOpen ? "translate-x-0" : "-translate-x-64"
                      } 
                      transition-transform duration-300 ease-in-out z-20`}
        >
          <div className="flex flex-col items-center py-5 border-b border-gray-100 dark:border-slate-800">
            <div className="text-center">
              <p className="font-semibold text-gray-700 dark:text-gray-100 text-base">
                MeetFlow Admin
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Quản lý cuộc họp
              </p>
            </div>
          </div>

          <nav className="mt-3 px-2">
            {menu.map((m) => (
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

          {/* Footer */}
          <div className="mt-auto px-5 py-4 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Phiên bản 1.0</span>
              <ThemeToggle />
            </div>
          </div>
        </aside>

        {/* Overlay cho mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 md:hidden z-10"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
