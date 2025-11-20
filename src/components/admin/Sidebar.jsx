// src/components/admin/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import ThemeToggle from "../ThemeToggle";
import { FiUsers, FiBarChart2, FiBriefcase } from "react-icons/fi";
import { BsCalendar4Week } from "react-icons/bs";
import { HiOutlineDeviceMobile } from "react-icons/hi";

const adminMenu = [
  { to: "/admin", label: "Dashboard", icon: <BsCalendar4Week size={18} /> },
  { to: "/admin/users", label: "Quản lý người dùng", icon: <FiUsers size={18} /> },
  { to: "/admin/rooms", label: "Quản lý phòng họp", icon: <FiBriefcase size={18} /> },
  { to: "/admin/devices", label: "Quản lý thiết bị", icon: <HiOutlineDeviceMobile size={18} /> },
  { to: "/admin/reports", label: "Thống kê & báo cáo", icon: <FiBarChart2 size={18} /> },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  return (
    <>
      {/* Sidebar Chính */}
      <aside
        className={`fixed top-14 left-0 bg-white dark:bg-slate-900 
              border-r dark:border-slate-800 shadow-md w-64 h-[calc(100%-56px)]
              transform ${isOpen ? "translate-x-0" : "-translate-x-64"}
              transition-transform duration-300 ease-in-out z-30`}
      >
        {/* Header của Sidebar */}
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

        {/* Menu Links */}
        <nav className="mt-3 px-2">
          {adminMenu.map((m) => (
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

      {/* Overlay cho Mobile (Khi click ra ngoài thì đóng sidebar) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 md:hidden z-20"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;