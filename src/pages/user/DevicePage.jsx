// src/pages/user/DevicePage.jsx
import React, { useEffect, useState } from "react";
import { FiSearch, FiTool } from "react-icons/fi";
import { HiComputerDesktop } from "react-icons/hi2";
import { Spin } from "antd";
import { getDevices } from "../../services/deviceService";
import BookDeviceModal from "../../components/user/BookDeviceModal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";

export default function DevicePage() {
  const { t } = useTranslation("userDevices");
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [bookingModal, setBookingModal] = useState({
    open: false,
    device: null,
  });

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
          text: t("filters.available"),
          color: "text-green-600 dark:text-green-400 font-semibold",
        };
      case "UNDER_MAINTENANCE":
        return {
          text: t("filters.maintenance"),
          color: "text-amber-600 dark:text-amber-400 font-semibold",
        };
      default:
        return { text: status, color: "text-gray-500" };
    }
  };

  // ===== LỌC THIẾT BỊ =====
  const filteredDevices = devices.filter((d) => {
    const matchSearch = d.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchStatus =
      filterStatus === "ALL" || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Danh sách option cho tickbox filter
  const STATUS_FILTERS = [
    { value: "ALL", label: t("filters.all") },
    { value: "AVAILABLE", label: t("filters.available") },
    { value: "UNDER_MAINTENANCE", label: t("filters.maintenance") },
  ];

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-900 transition-all duration-300">
      <ToastContainer position="top-right" autoClose={2500} />

      {/* ===== HEADER ===== */}
      <div className="flex items-center gap-4 mb-6 pb-3 border-b border-gray-300 dark:border-gray-700">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md">
          <HiComputerDesktop className="text-white text-2xl" />
        </div>

        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            {t("title")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* ===== SEARCH + FILTER ===== */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        {/* Ô tìm kiếm */}
        <div className="relative w-full md:w-1/2">
          <FiSearch className="absolute top-3 left-3 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 
            rounded-xl bg-white dark:bg-slate-800 
            text-gray-800 dark:text-gray-100 placeholder-gray-400
            focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>

        {/* Tickbox filter trạng thái */}
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {t("statusLabel")}
          </span>
          {STATUS_FILTERS.map((opt) => {
            const active = filterStatus === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilterStatus(opt.value)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all shadow-sm
                  ${active
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/30"
                    : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                  }
                `}
              >
                {/* Dot indicator */}
                <span
                  className={`
                    w-2.5 h-2.5 rounded-full flex-shrink-0
                    ${active
                      ? "bg-white"
                      : "bg-gray-400 dark:bg-gray-500"
                    }
                  `}
                />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
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
                    relative rounded-2xl p-6 border transition-all duration-300 group
                    ${isAvailable
                      ? "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-200 dark:hover:border-emerald-900"
                      : "bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 opacity-75"
                    }
                  `}
                >
                  {/* Status Badge Top-Right */}
                  <div className="absolute top-4 right-4">
                    {isAvailable ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {t("filters.available")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-100 dark:border-orange-800">
                        <FiTool size={10} />
                        {t("filters.maintenance")}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col h-full">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors pr-24">
                        {dv.name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {dv.description}
                      </p>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/50">
                      <button
                        disabled={!isAvailable}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all transform active:scale-95 ${isAvailable
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500"
                          }`}
                        onClick={() =>
                          isAvailable &&
                          setBookingModal({ open: true, device: dv })
                        }
                      >
                        {isAvailable ? t("button.book") : t("button.maintenance")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">
              {t("noResults")}
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
