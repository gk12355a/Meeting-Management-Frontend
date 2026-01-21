// src/components/user/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiHome,
  FiCalendar,
  FiPlusCircle,
  FiBriefcase,
  FiClock,
  FiMonitor
} from "react-icons/fi";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { t } = useTranslation("userSidebar");

  const userMenu = [
    { to: "/user", label: t("menu.dashboard"), icon: <FiHome size={20} /> },
    { to: "/user/my-meetings", label: t("menu.myMeetings"), icon: <FiCalendar size={20} /> },
    { to: "/user/create-meeting", label: t("menu.createMeeting"), icon: <FiPlusCircle size={20} /> },
    { to: "/user/rooms", label: t("menu.rooms"), icon: <FiBriefcase size={20} /> },
    { to: "/user/devices", label: t("menu.devices"), icon: <FiMonitor size={20} /> },
    { to: "/user/history", label: t("menu.history"), icon: <FiClock size={20} /> }
  ];

  return (
    <>
      <aside
        className={`fixed top-14 left-0 h-[calc(100%-56px)] w-64
            bg-white/95 backdrop-blur-xl dark:bg-slate-900/95
            border-r border-slate-100 dark:border-slate-800 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]
            transform ${isOpen ? "translate-x-0" : "-translate-x-64"}
            transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) z-30`}
      >
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center py-8 border-b border-dashed border-slate-200 dark:border-slate-800">
          <div className="text-center px-4">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg tracking-tight">
              {t("title")}
            </h2>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="mt-6 px-4 space-y-1.5 overflow-y-auto h-[calc(100%-120px)] scrollbar-hide">
          {userMenu.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end
              className={({ isActive }) =>
                `relative group flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 ease-in-out ${isActive
                  ? "bg-emerald-50/80 text-emerald-700 shadow-sm shadow-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:shadow-none font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200 font-medium"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Icon Wrapper with subtle animation */}
                  <span
                    className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                      }`}
                  >
                    {m.icon}
                  </span>

                  <span className="text-[15px]">{m.label}</span>

                  {/* Optional: Active Indicator Dot (Modern Touch) */}
                  {isActive && (
                    <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                  )}
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