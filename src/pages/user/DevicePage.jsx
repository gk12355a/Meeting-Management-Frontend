// src/pages/user/DevicePage.jsx
import React, { useEffect, useState } from "react";
import { FiSearch, FiTool, FiImage, FiX, FiCheckCircle } from "react-icons/fi";
import { HiComputerDesktop } from "react-icons/hi2";
import { Spin, Pagination } from "antd";
import { getDevices } from "../../services/deviceService";
import BookDeviceModal from "../../components/user/BookDeviceModal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import ImageLightbox from "../../components/ImageLightbox";
import { useLocation, useNavigate } from "react-router-dom";
import { TEXT_SEARCH_API } from "../../utils/api";

export default function DevicePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation("userDevices");
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [bookingModal, setBookingModal] = useState({
    open: false,
    device: null,
  });
  const [viewDevice, setViewDevice] = useState(null);
  const [lightbox, setLightbox] = useState({ open: false, index: 0, images: [] });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  // Reset trang về 1 khi tìm kiếm hoặc lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

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

  // [NEW] Auto-open modal if navigated from Image Search
  useEffect(() => {
    if (location.state?.openDeviceId && devices.length > 0) {
      const deviceToOpen = devices.find(d => d.id === location.state.openDeviceId);
      if (deviceToOpen) {
        setViewDevice(deviceToOpen);
        
        // Clean up state so refreshing doesn't keep opening it
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state?.openDeviceId, devices]);

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

  const [semanticResults, setSemanticResults] = useState(null);

  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      setSemanticResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(TEXT_SEARCH_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: term, type: "devices" }),
        });
        const data = await res.json();
        if (data.success && data.results) {
          const matchedIds = data.results
            .filter((r) => r.score > 0.05)
            .map((r) => r.id);
          setSemanticResults(matchedIds);
        }
      } catch (err) {
        console.error("Semantic search error:", err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, devices]);

  // ===== LỌC THIẾT BỊ =====
  const filteredDevices = devices.filter((d) => {
    const term = searchTerm.trim();
    const matchSearch = !term || (semanticResults !== null && semanticResults.includes(d.id));
    const matchStatus =
      filterStatus === "ALL" || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (searchTerm.trim() && semanticResults) {
    filteredDevices.sort((a, b) => {
      return semanticResults.indexOf(a.id) - semanticResults.indexOf(b.id);
    });
  }

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
        <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full sm:w-auto pt-1 flex-nowrap scrollbar-hide">
          <span className="font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
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
            filteredDevices.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((dv) => {
              const statusDisplay = getStatusDisplay(dv.status);
              const isAvailable = dv.status === "AVAILABLE";

              return (
                <div
                  key={dv.id}
                  onClick={() => setViewDevice(dv)}
                  className={`
                    relative rounded-2xl p-6 border transition-all duration-300 group cursor-pointer
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
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isAvailable) setBookingModal({ open: true, device: dv });
                        }}
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

      {filteredDevices.length > 0 && !loading && (
        <div className="flex justify-center mt-6">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredDevices.length}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
          />
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

      {/* VIEW DEVICE MODAL */}
      {viewDevice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewDevice(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cover Image */}
            <div className="relative h-64 bg-slate-200 dark:bg-slate-700">
              {viewDevice.images && viewDevice.images.length > 0 ? (
                <img
                  src={viewDevice.images[0]}
                  alt={viewDevice.name}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-700"
                  onClick={() => setLightbox({ open: true, index: 0, images: viewDevice.images })}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <FiImage size={48} />
                  <span className="mt-2 text-sm">{t("noImage") || "Chưa có hình ảnh"}</span>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setViewDevice(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm"
              >
                <FiX size={20} />
              </button>

              {/* Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent pt-20 pointer-events-none">
                <h2 className="text-3xl font-bold text-white mb-1">{viewDevice.name}</h2>
                {/* Optional location/type if available */}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Details */}
                <div className="md:col-span-2 space-y-8">
                  {/* Description */}
                  <div>
                    <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">{t("filters.description") || "Mô tả"}</div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
                      {viewDevice.description || "Chưa có mô tả."}
                    </p>
                  </div>

                  {/* Stats/Status */}
                  <div className="flex gap-4">
                    <div className="flex-1 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                      <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">{t("statusLabel")}</div>
                      <div className="text-lg font-bold">
                        {viewDevice.status === 'AVAILABLE' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {t("filters.available")}
                          </span>
                        ) : (
                          <span className="text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                            <FiTool size={14} />
                            {t("filters.maintenance")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Gallery Grid */}
                  {viewDevice.images && viewDevice.images.length > 1 && (
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <FiImage className="text-emerald-500" />
                        {t("gallery") || "Thư viện ảnh"}
                      </h3>
                      <div className="grid grid-cols-4 gap-3">
                        {viewDevice.images.map((img, idx) => (
                          <div
                            key={idx}
                            className="aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer"
                            onClick={() => setLightbox({ open: true, index: idx, images: viewDevice.images })}
                          >
                            <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="md:col-span-1">
                  <div className="sticky top-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-4">{t("wantToBook")}</h4>

                    <button
                      disabled={viewDevice.status !== 'AVAILABLE'}
                      onClick={() => {
                        setBookingModal({ open: true, device: viewDevice });
                        setViewDevice(null);
                      }}
                      className={`
                                  w-full py-3 rounded-xl font-bold mb-3 flex items-center justify-center gap-2 transition-all
                                  ${viewDevice.status === 'AVAILABLE'
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 active:scale-95"
                          : "bg-slate-200 dark:bg-slate-600 text-slate-400 cursor-not-allowed"
                        }
                                `}
                    >
                      {viewDevice.status === 'AVAILABLE' ? (
                        <>
                          <FiCheckCircle size={18} />
                          {t("button.book")}
                        </>
                      ) : (
                        <>
                          <FiTool size={18} />
                          {t("button.maintenance")}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      <ImageLightbox
        open={lightbox.open}
        onClose={() => setLightbox((prev) => ({ ...prev, open: false }))}
        images={lightbox.images}
        initialIndex={lightbox.index}
      />
    </div>
  );
}
