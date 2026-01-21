// src/pages/user/RoomsPage.jsx
import React, { useEffect, useState } from "react";
import { FiSearch, FiTool, FiMonitor, FiUsers } from "react-icons/fi";
import { Spin, message, Tag, Tooltip } from "antd";
import { getAllRooms } from "../../services/roomService";
import { HiBuildingOffice } from "react-icons/hi2";
import BookRoomModal from "../../components/user/BookRoomModal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RoomCalendarModal from "../../components/user/RoomCalendarModal";
import { useTranslation } from "react-i18next";

const RoomsPage = () => {
  const { t } = useTranslation("userRooms");
  const [rooms, setRooms] = useState([]);
  const [processedRooms, setProcessedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState([]);
  const [bookingModal, setBookingModal] = useState({
    open: false,
    room: null,
    start: null,
    end: null,
  });
  const [calendarModal, setCalendarModal] = useState({
    open: false,
    room: null,
  });

  // Load rooms
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const res = await getAllRooms();
        setRooms(res.data || []);
        setProcessedRooms(res.data || []);
      } catch (err) {
        console.error("Lỗi tải danh sách phòng:", err);
        message.error(t("errorLoadRooms"));
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const getStatusDisplay = (apiStatus) => {
    if (apiStatus === "AVAILABLE") {
      return {
        text: t("statusAvailable"),
        color: "text-green-700 dark:text-green-400 font-semibold",
      };
    }
    if (apiStatus === "UNDER_MAINTENANCE") {
      return {
        text: t("statusMaintenance"),
        color: "text-orange-500 dark:text-orange-400 font-semibold",
      };
    }
    return { text: apiStatus, color: "text-gray-500" };
  };

  // FILTER ROOMS
  useEffect(() => {
    const filtered = rooms.filter((room) => {
      const matchesSearch = room.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Nếu không tick gì → coi như "Tất cả"
      if (filterStatus.length === 0) return matchesSearch;

      let matchStatus = false;

      // 1) Trống
      if (filterStatus.includes("AVAILABLE") && room.status === "AVAILABLE") {
        matchStatus = true;
      }

      // 2) Đang bảo trì
      if (
        filterStatus.includes("UNDER_MAINTENANCE") &&
        room.status === "UNDER_MAINTENANCE"
      ) {
        matchStatus = true;
      }

      // Đã xóa phần lọc VIP ở đây

      return matchesSearch && matchStatus;
    });

    setProcessedRooms(filtered);
  }, [searchTerm, filterStatus, rooms]);

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <ToastContainer position="top-right" autoClose={2500} />

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6 pb-3 border-b border-gray-300 dark:border-gray-700">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md">
          <HiBuildingOffice className="text-white text-2xl" />
        </div>

        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            {t("pageTitle")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {t("pageSubtitle")}
          </p>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
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

        {/* FILTER SECTION - UI GIỐNG ẢNH MẪU */}
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {t("filterStatus")}
          </span>

          {[
            { key: "ALL", label: t("filterAll") },
            { key: "AVAILABLE", label: t("filterAvailable") },
            { key: "UNDER_MAINTENANCE", label: t("filterMaintenance") },
          ].map((btn) => {
            const isAll = btn.key === "ALL";
            const isActive =
              (isAll && filterStatus.length === 0) ||
              (!isAll && filterStatus[0] === btn.key);

            const handleClick = () => {
              if (isAll) {
                setFilterStatus([]);
              } else {
                setFilterStatus([btn.key]);  // CHỈ GIỮ 1 GIÁ TRỊ
              }
            };

            return (
              <button
                key={btn.key}
                onClick={handleClick}
                className={`
          flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all shadow-sm
          ${isActive
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/30"
                    : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                  }
        `}
              >
                <span
                  className={`
            w-2.5 h-2.5 rounded-full flex-shrink-0
            ${isActive
                      ? "bg-white"
                      : "bg-gray-400 dark:bg-gray-500"
                    }
          `}
                />
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ROOM LIST */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedRooms.length > 0 ? (
            processedRooms.map((room) => {
              const statusDisplay = getStatusDisplay(room.status);
              const isAvailable = room.status === "AVAILABLE";
              return (
                <div
                  key={room.id}
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
                        {t("statusAvailable")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-100 dark:border-orange-800">
                        <FiTool size={10} />
                        {t("statusMaintenance")}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col h-full">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {room.name}
                      </h2>
                      <p className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mt-1">
                        <FiUsers size={14} /> {room.capacity} {t("seats")}
                      </p>
                    </div>


                    {/* === HIỂN THỊ THIẾT BỊ === */}
                    <div className="mb-6 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FiMonitor size={14} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t("deviceLabel")}:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {room.fixedDevices && room.fixedDevices.length > 0 ? (
                          <>
                            {room.fixedDevices.slice(0, 3).map((device, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs rounded-md bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                              >
                                {device}
                              </span>
                            ))}
                            {room.fixedDevices.length > 3 && (
                              <span className="px-2 py-1 text-xs rounded-md bg-slate-50 text-slate-500 border border-slate-200 cursor-help" title={room.fixedDevices.slice(3).join(", ")}>
                                +{room.fixedDevices.length - 3}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic px-1">{t("noDevice")}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/50">
                      <button
                        disabled={!isAvailable}
                        onClick={() => setCalendarModal({ open: true, room })}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all transform active:scale-95 ${isAvailable
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500"
                          }`}
                      >
                        {isAvailable ? t("bookRoom") : t("statusMaintenance")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">
              {t("noRoomMatch")}
            </div>
          )}
        </div>
      )}

      {/* Modal đặt phòng */}
      <BookRoomModal
        open={bookingModal.open}
        onCancel={() =>
          setBookingModal({ open: false, room: null, start: null, end: null })
        }
        prefilledRoom={bookingModal.room}
        start={bookingModal.start}
        end={bookingModal.end}
        onSuccess={() => { }}
      />

      <RoomCalendarModal
        open={calendarModal.open}
        room={calendarModal.room}
        onClose={() => setCalendarModal({ open: false, room: null })}
        onSelectSlot={({ start, end }) => {
          setCalendarModal({ open: false, room: null });
          setBookingModal({
            open: true,
            room: calendarModal.room,
            start,
            end,
          });
        }}
      />
    </div>
  );
};

export default RoomsPage;