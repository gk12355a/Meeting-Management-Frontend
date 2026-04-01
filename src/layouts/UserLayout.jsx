// src/layouts/UserLayout.jsx
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";

// Import Components
import UserHeader from "../components/user/UserHeader";
import Sidebar from "../components/user/Sidebar";
import Chatbot from "../components/user/Chatbot";

export default function UserLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* HEADER */}
      <UserHeader setIsSidebarOpen={setIsSidebarOpen} />
      {/* BODY */}
      <div className="flex flex-1 relative">
        {/* SIDEBAR */}
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        {/* MAIN CONTENT */}
        <div
          className={`flex-1 mt-14 transition-all duration-300 max-w-full ${isSidebarOpen ? "md:ml-20 ml-0" : "ml-0"
            }`}
        >
          <main className="p-4 md:p-6 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors min-h-[calc(100vh-56px)]">
            <Outlet />
          </main>
        </div>
      </div>
      {/* CHATBOT - Đặt ở cuối cùng để nó nổi lên trên */}
      <Chatbot />
    </div >
  );
}
