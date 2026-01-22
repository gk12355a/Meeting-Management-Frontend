// src/components/user/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiHome,
  FiCalendar,
  FiPlusCircle,
  FiClock,
  FiMonitor,
  FiUsers
} from "react-icons/fi";
import { MdMeetingRoom } from "react-icons/md";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { t } = useTranslation("userSidebar");

  const userMenu = [
    { to: "/user", label: t("menu.dashboard"), icon: <FiHome size={20} /> },
    { to: "/user/my-meetings", label: t("menu.myMeetings"), icon: <FiCalendar size={20} /> },
    { to: "/user/create-meeting", label: t("menu.createMeeting"), icon: <FiPlusCircle size={20} /> },
    { to: "/user/contact-groups", label: t("menu.contactGroups"), icon: <FiUsers size={20} /> },
    { to: "/user/rooms", label: t("menu.rooms"), icon: <MdMeetingRoom size={20} /> },
    { to: "/user/devices", label: t("menu.devices"), icon: <FiMonitor size={20} /> },
    { to: "/user/history", label: t("menu.history"), icon: <FiClock size={20} /> }
  ];

  return (
    <>
      <aside
        className={`fixed top-14 left-0 h-[calc(100%-56px)] 
            bg-white/95 backdrop-blur-xl dark:bg-slate-900/95
            border-r border-slate-100 dark:border-slate-800 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]
            transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) z-30
            group overflow-hidden
            ${isOpen ? "translate-x-0 w-64 md:w-20 md:hover:w-64" : "-translate-x-full w-64"}
            `}
      >
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center py-6 whitespace-nowrap overflow-hidden">
          <div className="flex items-center gap-3 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20 shrink-0">
              6x6
            </div>
            <div className="text-left w-0 group-hover:w-auto opacity-0 group-hover:opacity-100 transition-all duration-300">
              <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg leading-tight">
                Meeting
              </h2>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Management
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="mt-6 px-2 space-y-1.5 overflow-y-auto h-[calc(100%-120px)] scrollbar-hide">
          {userMenu.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end
              className={({ isActive }) =>
                `relative flex items-center gap-3.5 px-3 py-3.5 mx-1 rounded-xl transition-all duration-300
                 justify-center md:group-hover:justify-start
                 ${isActive
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                  : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Icon Wrapper */}
                  <span
                    className={`transition-transform duration-300 group-hover:scale-110 shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-emerald-600 dark:text-slate-500 dark:group-hover:text-emerald-400"
                      }`}
                  >
                    {m.icon}
                  </span>

                  <span className="text-[15px] font-medium whitespace-nowrap opacity-0 w-0 group-hover:w-auto group-hover:opacity-100 transition-all duration-300 overflow-hidden">
                    {m.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm md:hidden z-20 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;