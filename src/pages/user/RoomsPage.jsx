// src/pages/user/RoomsPage.jsx
import React, { useEffect, useState } from "react";
import { FiSearch, FiTool, FiMonitor, FiUsers } from "react-icons/fi";
import { Spin, message, Tag, Tooltip } from "antd"; // Đã có Tag, Tooltip
import { getAllRooms } from "../../services/roomService";
import { HiBuildingOffice } from "react-icons/hi2";
import { FaCrown } from "react-icons/fa";
import BookRoomModal from "../../components/user/BookRoomModal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RoomCalendarModal from "../../components/user/RoomCalendarModal";

const RoomsPage = () => {
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
        message.error("Không thể tải danh sách phòng họp.");
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const getStatusDisplay = (apiStatus) => {
    if (apiStatus === "AVAILABLE") {
      return {
        text: "Trống",
        color: "text-green-700 dark:text-green-400 font-semibold",
      };
    }
    if (apiStatus === "UNDER_MAINTENANCE") {
      return {
        text: "Đang bảo trì",
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

    // 3) VIP
    if (filterStatus.includes("VIP") && room.requiresApproval === true) {
      matchStatus = true;
    }

    return matchesSearch && matchStatus;
  });

  setProcessedRooms(filtered);
}, [searchTerm, filterStatus, rooms]);

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <ToastContainer position="top-right" autoClose={2500} />

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6 pb-3 border-b border-gray-300 dark:border-gray-700">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 shadow-md">
          <HiBuildingOffice className="text-white text-2xl" />
        </div>

        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Danh sách phòng họp
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Xem và đặt phòng họp có sẵn trong hệ thống
          </p>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full md:w-1/2">
          <FiSearch className="absolute top-3 left-3 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 
            rounded-lg bg-white dark:bg-slate-800 
            text-gray-800 dark:text-gray-100 placeholder-gray-400"
          />
        </div>

        {/* NEW CHECKBOX FILTER */}
        <div
          className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-800 
  p-3 rounded-lg border border-gray-300 dark:border-slate-700 shadow-sm"
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterStatus.includes("AVAILABLE")}
              onChange={() => {
                setFilterStatus((prev) =>
                  prev.includes("AVAILABLE")
                    ? prev.filter((f) => f !== "AVAILABLE")
                    : [...prev, "AVAILABLE"]
                );
              }}
            />
            <span className="text-gray-700 dark:text-gray-200">Trống</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterStatus.includes("UNDER_MAINTENANCE")}
              onChange={() => {
                setFilterStatus((prev) =>
                  prev.includes("UNDER_MAINTENANCE")
                    ? prev.filter((f) => f !== "UNDER_MAINTENANCE")
                    : [...prev, "UNDER_MAINTENANCE"]
                );
              }}
            />
            <span className="text-gray-700 dark:text-gray-200">
              Đang bảo trì
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterStatus.includes("VIP")}
              onChange={() => {
                setFilterStatus((prev) =>
                  prev.includes("VIP")
                    ? prev.filter((f) => f !== "VIP")
                    : [...prev, "VIP"]
                );
              }}
            />
            <span className="text-gray-700 dark:text-gray-200">Phòng VIP</span>
          </label>

          {/* SELECT ALL */}
          <button
            onClick={() =>
              setFilterStatus(["AVAILABLE", "UNDER_MAINTENANCE", "VIP"])
            }
            className="ml-auto px-3 py-1 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Chọn tất cả
          </button>
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
              const isVip = room.requiresApproval;

              return (
                <div
                  key={room.id}
                  className={`
                    rounded-xl p-5 border shadow-md transition-all duration-200
                    ${
                      isAvailable
                        ? "bg-green-50 border-green-200 hover:shadow-green-300 hover:scale-[1.02] dark:bg-green-900/20 dark:border-green-700"
                        : "bg-gray-200/60 border-gray-300 cursor-not-allowed dark:bg-slate-700/40 dark:border-slate-600"
                    }
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                        {room.name}
                      </h2>
                      {isVip && (
                        <Tooltip title="Phòng này cần Admin phê duyệt">
                          <Tag
                            color="gold"
                            className="flex items-center gap-1 ml-2 px-2 py-0.5 text-xs font-bold border-none shadow-sm"
                          >
                            <FaCrown size={10} /> VIP
                          </Tag>
                        </Tooltip>
                      )}
                    </div>

                    {room.status === "UNDER_MAINTENANCE" && (
                      <span className="flex items-center gap-1 text-xs text-orange-500 dark:text-orange-400 font-medium">
                        <FiTool size={12} /> Bảo trì
                      </span>
                    )}
                  </div>

                  <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mt-2">
                    <FiUsers size={14} /> Sức chứa: {room.capacity} người
                  </p>
                  {/* === CHỈNH SỬA PHẦN NÀY ĐỂ XỬ LÝ TRÀN THIẾT BỊ === */}
                  <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300 mt-2">
                    <FiMonitor size={14} className="mt-1.5 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="mr-1">Thiết bị:</span>
                      {room.fixedDevices && room.fixedDevices.length > 0 ? (
                        <>
                          {/* Chỉ hiện tối đa 3 thiết bị */}
                          {room.fixedDevices.slice(0, 3).map((device, idx) => (
                            <Tag
                              key={idx}
                              className="mr-0 text-xs border-blue-200 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800"
                            >
                              {device}
                            </Tag>
                          ))}
                          {/* Nếu > 3 thì hiện +X */}
                          {room.fixedDevices.length > 3 && (
                            <Tooltip
                              title={room.fixedDevices.slice(3).join(", ")}
                            >
                              <Tag className="mr-0 text-xs cursor-pointer border-gray-300 bg-gray-100">
                                +{room.fixedDevices.length - 3}
                              </Tag>
                            </Tooltip>
                          )}
                        </>
                      ) : (
                        <span>Không có</span>
                      )}
                    </div>
                  </div>
                  {/* ================================================= */}

                  <div className="flex items-center justify-between mt-3">
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      Trạng thái:{" "}
                      <span className={statusDisplay.color}>
                        {statusDisplay.text}
                      </span>
                    </p>
                  </div>

                  {isVip && isAvailable && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2 italic">
                      * Yêu cầu phê duyệt từ Admin
                    </p>
                  )}

                  <div className="mt-4 flex justify-end">
                    <button
                      disabled={!isAvailable}
                      onClick={() => setCalendarModal({ open: true, room })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isAvailable
                          ? isVip
                            ? "bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm"
                            : "bg-green-600 hover:bg-green-700 text-white shadow-sm"
                          : "bg-gray-400 text-gray-700 cursor-not-allowed"
                      }`}
                    >
                      {isVip ? "Đăng ký duyệt" : "Đặt phòng"}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10">
              Không có phòng nào phù hợp với bộ lọc.
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
        onSuccess={() => {}}
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
