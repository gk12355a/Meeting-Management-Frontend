// src/components/admin/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import ThemeToggle from "../ThemeToggle";
import { useTranslation } from "react-i18next";
import { FiUsers, FiBarChart2 } from "react-icons/fi";
import { BsCalendar4Week } from "react-icons/bs";
import { HiOutlineDeviceMobile } from "react-icons/hi";
import { MdMeetingRoom } from "react-icons/md";

const adminMenu = [
  { to: "/admin", labelKey: "sidebar.menu.dashboard", icon: <BsCalendar4Week size={18} /> },
  { to: "/admin/users", labelKey: "sidebar.menu.users", icon: <FiUsers size={18} /> },
  { to: "/admin/rooms", labelKey: "sidebar.menu.rooms", icon: <MdMeetingRoom size={18} /> },
  { to: "/admin/devices", labelKey: "sidebar.menu.devices", icon: <HiOutlineDeviceMobile size={18} /> },
  { to: "/admin/reports", labelKey: "sidebar.menu.reports", icon: <FiBarChart2 size={18} /> },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { t } = useTranslation('admin');
  return (
    <>
      {/* Sidebar Chính */}
      <aside
        className={`fixed top-14 left-0 h-[calc(100%-56px)] 
            bg-white/95 backdrop-blur-xl dark:bg-slate-900/95
            border-r border-slate-100 dark:border-slate-800 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]
            transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) z-30
            group overflow-hidden
            ${isOpen ? "translate-x-0 w-64 md:w-20 md:hover:w-64" : "-translate-x-full w-64"}
            `}
      >
        {/* Header của Sidebar */}
        <div className="flex flex-col items-center justify-center py-6 whitespace-nowrap overflow-hidden">
          <div className="flex items-center gap-3 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20 shrink-0">
              6x6
            </div>
            <div className="text-left w-0 group-hover:w-auto opacity-0 group-hover:opacity-100 transition-all duration-300">
              <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg leading-tight">
                Admin
              </h2>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Portal
              </p>
            </div>
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
                `relative flex items-center gap-3.5 px-3 py-3.5 mx-1 rounded-xl transition-all duration-300 
                 justify-center md:group-hover:justify-start
                 ${isActive
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 font-medium"
                  : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`transition-transform duration-300 group-hover:scale-110 shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-emerald-600 dark:text-slate-500 dark:group-hover:text-emerald-400"
                      }`}
                  >
                    {m.icon}
                  </span>
                  <span className="text-[15px] whitespace-nowrap opacity-0 w-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 overflow-hidden">{t(m.labelKey)}</span>
                </>
              )}
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