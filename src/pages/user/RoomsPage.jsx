// src/pages/user/RoomsPage.jsx
import React, { useEffect, useState } from "react";
import { FiSearch, FiTool, FiMonitor, FiUsers } from "react-icons/fi";
import { Spin, message, Tag, Tooltip } from "antd"; // <-- THÊM Tag, Tooltip
import { getAllRooms } from "../../services/roomService";
import { HiBuildingOffice } from "react-icons/hi2";
import { FaCrown } from "react-icons/fa"; // <-- Icon VIP (cần cài react-icons/fa)
import BookRoomModal from "../../components/user/BookRoomModal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RoomCalendarModal from "../../components/user/RoomCalendarModal";

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [processedRooms, setProcessedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [bookingModal, setBookingModal] = useState({
    open: false,
    room: null,
    start: null,
    end: null,
  });
  const [calendarModal, setCalendarModal] = useState({ open: false, room: null });

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

  useEffect(() => {
  const filtered = rooms.filter((room) => {
    const matchesSearch = room.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    let matchStatus = true;

    // --- Bộ lọc trạng thái ---
    if (filterStatus !== "Tất cả") {
      if (filterStatus === "AVAILABLE" || filterStatus === "UNDER_MAINTENANCE") {
        matchStatus = room.status === filterStatus;
      } else if (filterStatus === "VIP") {
        matchStatus = room.requiresApproval === true;
      }
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

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2
          bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100"
        >
          <option value="Tất cả">Tất cả</option>
          <option value="AVAILABLE">Trống</option>
          <option value="UNDER_MAINTENANCE">Đang bảo trì</option>
          <option value="VIP">Phòng VIP</option>
        </select>
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
              // Kiểm tra xem phòng có cần duyệt không
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
                      {/* === HIỂN THỊ BADGE VIP === */}
                      {isVip && (
                        <Tooltip title="Phòng này cần Admin phê duyệt">
                          <Tag color="gold" className="flex items-center gap-1 ml-2 px-2 py-0.5 text-xs font-bold border-none shadow-sm">
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

                  <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mt-1">
                    <FiMonitor size={14} /> Thiết bị:{" "}
                    {room.fixedDevices?.length > 0
                      ? room.fixedDevices.join(", ")
                      : "Không có"}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      Trạng thái:{" "}
                      <span className={statusDisplay.color}>
                        {statusDisplay.text}
                      </span>
                    </p>
                  </div>

                  {/* Lưu ý cho phòng VIP */}
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
                            ? "bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm" // Nút màu vàng cho VIP
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
        onSuccess={() => {
           // Có thể thêm logic reload danh sách phòng nếu cần, nhưng thường là không cần thiết vì trạng thái phòng không đổi ngay lập tức
        }}
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