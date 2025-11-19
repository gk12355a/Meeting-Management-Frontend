// src/layouts/AdminLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";

// Import các Components đã tách
import AdminHeader from "../components/admin/AdminHeader";
import Sidebar from "../components/admin/Sidebar";

export default function AdminLayout() {
  // State này quản lý việc đóng/mở sidebar (được truyền xuống cả Header và Sidebar)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* === HEADER === */}
      {/* Truyền setter để nút Menu trên header có thể mở Sidebar */}
      <AdminHeader setIsSidebarOpen={setIsSidebarOpen} />

      {/* === BODY === */}
      <div className="flex flex-1 relative">
        
        {/* === SIDEBAR === */}
        {/* Truyền state và setter để sidebar tự điều khiển hiển thị và overlay */}
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        {/* === MAIN CONTENT === */}
        {/* ml-64 để đẩy nội dung sang phải, nhường chỗ cho sidebar cố định */}
        {/* Nếu muốn sidebar có thể ẩn hoàn toàn trên desktop, logic ml-64 này cần được xử lý động */}
        <div className={`flex-1 mt-14 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <main className="p-6 overflow-y-auto bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors min-h-[calc(100vh-56px)]">
            <Outlet />
          </main>
        </div>
        
      </div>
    </div>
  );
}