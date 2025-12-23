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
  const { t } = useTranslation("userSidebar"); // namespace bạn đã tạo

  const userMenu = [
    { to: "/user", label: t("menu.dashboard"), icon: <FiHome size={18} /> },
    { to: "/user/my-meetings", label: t("menu.myMeetings"), icon: <FiCalendar size={18} /> },
    { to: "/user/create-meeting", label: t("menu.createMeeting"), icon: <FiPlusCircle size={18} /> },
    { to: "/user/rooms", label: t("menu.rooms"), icon: <FiBriefcase size={18} /> },
    { to: "/user/devices", label: t("menu.devices"), icon: <FiMonitor size={18} /> },
    { to: "/user/history", label: t("menu.history"), icon: <FiClock size={18} /> }
  ];

  return (
    <>
      <aside
        className={`fixed top-14 left-0 bg-white dark:bg-slate-900 
              border-r dark:border-slate-800 shadow-md w-64 h-[calc(100%-56px)]
              transform ${isOpen ? "translate-x-0" : "-translate-x-64"}
              transition-transform duration-300 ease-in-out z-30`}
      >
        <div className="flex flex-col items-center py-5 border-b border-gray-100 dark:border-slate-800">
          <div className="text-center">
            <p className="font-semibold text-gray-700 dark:text-gray-100 text-base">
              {t("title")}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("subtitle")}
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

      {/* Overlay mobile */}
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
