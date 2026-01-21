// src/components/admin/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import ThemeToggle from "../ThemeToggle";
import { useTranslation } from "react-i18next";
import { FiUsers, FiBarChart2, FiBriefcase } from "react-icons/fi";
import { BsCalendar4Week } from "react-icons/bs";
import { HiOutlineDeviceMobile } from "react-icons/hi";

const adminMenu = [
  { to: "/admin", labelKey: "sidebar.menu.dashboard", icon: <BsCalendar4Week size={18} /> },
  { to: "/admin/users", labelKey: "sidebar.menu.users", icon: <FiUsers size={18} /> },
  { to: "/admin/rooms", labelKey: "sidebar.menu.rooms", icon: <FiBriefcase size={18} /> },
  { to: "/admin/devices", labelKey: "sidebar.menu.devices", icon: <HiOutlineDeviceMobile size={18} /> },
  { to: "/admin/reports", labelKey: "sidebar.menu.reports", icon: <FiBarChart2 size={18} /> },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { t } = useTranslation('admin');
  return (
    <>
      {/* Sidebar Chính */}
      <aside
        className={`fixed top-14 left-0 h-[calc(100%-56px)] w-64
            bg-white/95 backdrop-blur-xl dark:bg-slate-900/95
            border-r border-slate-100 dark:border-slate-800 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]
            transform ${isOpen ? "translate-x-0" : "-translate-x-64"}
            transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) z-30`}
      >
        {/* Header của Sidebar */}
        <div className="flex flex-col items-center justify-center py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
              6x6
            </div>
            <div className="text-left">
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
                `relative group flex items-center gap-3.5 px-4 py-3.5 mx-3 rounded-xl transition-all duration-300 ${isActive
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 font-medium"
                  : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-white" : "text-gray-400 group-hover:text-emerald-600 dark:text-slate-500 dark:group-hover:text-emerald-400"
                      }`}
                  >
                    {m.icon}
                  </span>
                  <span className="text-[15px]">{t(m.labelKey)}</span>
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