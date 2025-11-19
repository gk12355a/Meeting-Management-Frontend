// src/pages/user/DevicePage.jsx
import React, { useEffect, useState } from "react";
import { FiSearch, FiTool, FiLock } from "react-icons/fi";
import { HiComputerDesktop } from "react-icons/hi2";
import { Spin } from "antd";
import { getDevices } from "../../services/deviceService";
import BookDeviceModal from "../../components/user/BookDeviceModal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DevicePage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [bookingModal, setBookingModal] = useState({ open: false, device: null });

  // Dùng cho reload thiết bị sau khi đặt phòng (có thể bật khi cần)
  // const fetchDevices = async () => {
  //   setLoading(true);
  //   try {
  //     const res = await getDevices();
  //     setDevices(res.data || []);
  //   } catch (err) {
  //     console.error("Lỗi tải thiết bị:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getDevices();
        setDevices(res.data || []);
      } catch (err) {
        console.error("Lỗi tải thiết bị:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // ===== TRẠNG THÁI =====
  const getStatusDisplay = (status) => {
    switch (status) {
      case "AVAILABLE":
        return {
          text: "Sẵn sàng",
          color: "text-green-600 dark:text-green-400 font-semibold",
        };
      case "UNDER_MAINTENANCE":
        return {
          text: "Bảo trì",
          color: "text-amber-600 dark:text-amber-400 font-semibold",
        };
      default:
        return { text: status, color: "text-gray-500" };
    }
  };

  // ===== LỌC THIẾT BỊ =====
  const filteredDevices = devices.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "Tất cả" || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-900 transition-all duration-300">
      <ToastContainer position="top-right" autoClose={2500} />

      {/* ===== HEADER ===== */}
      <div className="flex items-center gap-4 mb-6 pb-3 border-b border-gray-300 dark:border-gray-700">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
          <HiComputerDesktop className="text-white text-2xl" />
        </div>

        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Trạng thái thiết bị
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Theo dõi tình trạng thiết bị trong các phòng họp
          </p>
        </div>
      </div>

      {/* ===== SEARCH + FILTER ===== */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full md:w-1/2">
          <FiSearch className="absolute top-3 left-3 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên thiết bị..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 
            rounded-lg bg-white dark:bg-slate-800 
            text-gray-800 dark:text-gray-100 placeholder-gray-400"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2
          bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100"
        >
          <option value="Tất cả">Tất cả</option>
          <option value="AVAILABLE">Sẵn sàng</option>
          <option value="UNDER_MAINTENANCE">Bảo trì</option>
        </select>
      </div>

      {/* ===== DEVICE LIST ===== */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDevices.length > 0 ? (
            filteredDevices.map((dv) => {
              const statusDisplay = getStatusDisplay(dv.status);
              const isAvailable = dv.status === "AVAILABLE";

              return (
                <div
                  key={dv.id}
                  className={`
                    rounded-2xl p-6 border shadow-md relative
                    transition-all duration-300
                    ${
                      isAvailable
                        ? `
                          bg-gradient-to-br from-purple-50 to-indigo-50
                          dark:from-purple-900/20 dark:to-indigo-900/20
                          border-purple-300 dark:border-purple-600
                          hover:shadow-purple-300 hover:-translate-y-1 hover:border-purple-500
                        `
                        : `
                          bg-gray-100 dark:bg-slate-700/40
                          border-gray-300 dark:border-slate-600
                          opacity-80 cursor-not-allowed
                        `
                    }
                  `}
                >
                  {/* ICON BẢO TRÌ */}
                  {!isAvailable && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 text-sm 
                      text-amber-600 dark:text-amber-400 font-semibold">
                      <FiTool size={14} /> Bảo trì
                    </div>
                  )}

                  {/* TÊN THIẾT BỊ */}
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    {dv.name}
                  </h2>

                  {/* MÔ TẢ */}
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Loại thiết bị: </span>
                    {dv.description}
                  </p>

                  {/* TRẠNG THÁI */}
                  <p className="mt-2 text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Trạng thái: </span>
                    <span className={statusDisplay.color}>{statusDisplay.text}</span>
                  </p>

                  {/* BUTTON */}
                  <div className="mt-5 flex justify-end">
                    <button
                      disabled={!isAvailable}
                      className={`
                        px-5 py-2 rounded-lg text-sm font-medium shadow
                        transition-all duration-200
                        ${
                          isAvailable
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "bg-gray-300 text-gray-600 dark:bg-slate-600 dark:text-gray-300 cursor-not-allowed"
                        }
                      `}
                      onClick={() =>
                        isAvailable &&
                        setBookingModal({ open: true, device: dv })
                      }
                    >
                      {isAvailable ? "Đặt phòng" : "Bảo trì"}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">
              Không tìm thấy thiết bị nào phù hợp.
            </div>
          )}
        </div>
      )}
      {/* Modal đặt lịch thiết bị */}
      <BookDeviceModal
        open={bookingModal.open}
        onCancel={() => setBookingModal({ open: false, device: null })}
        prefilledDevice={bookingModal.device}
        onSuccess={() => {
          // Có thể reload devices nếu cần
          // fetchDevices();
        }}
      />
    </div>
  );
}
