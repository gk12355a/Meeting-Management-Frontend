// src/layouts/UserLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";

// Import Components
import UserHeader from "../components/user/UserHeader";
import Sidebar from "../components/user/Sidebar";
import Chatbot from "../components/user/Chatbot";

export default function UserLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
          className={`flex-1 mt-14 transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          <main className="p-6 overflow-y-auto bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors min-h-[calc(100vh-56px)]">
            <Outlet />
          </main>
        </div>
      </div>
      {/* CHATBOT - Đặt ở cuối cùng để nó nổi lên trên */}
      <Chatbot />
    </div>
  );
}
