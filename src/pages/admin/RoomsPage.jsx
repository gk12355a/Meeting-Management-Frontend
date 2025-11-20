// src/pages/admin/RoomsPage.jsx
import { useEffect, useState } from "react";
import {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../../services/roomService";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  AlertTriangle,
  Building,
  Crown,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import { motion } from "framer-motion";

/* Toast màu */
const toastColors = {
  success: "#10b981",
  error: "#ef4444",
  warning: "#e4650aff",
  info: "#3b82f6",
};


const setToastTheme = () => {
  const root = document.documentElement;
  root.style.setProperty("--toastify-color-success", toastColors.success);
  root.style.setProperty("--toastify-color-error", toastColors.error);
  root.style.setProperty("--toastify-color-warning", toastColors.warning);
  root.style.setProperty("--toastify-color-info", toastColors.info);
};
setToastTheme();

export default function RoomsPage() {
  // === States ===
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    capacity: 0,
    location: "",
    status: "AVAILABLE",
    requiresApproval: false,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // === Fetch Rooms ===
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await getRooms();
      const sortedData = (response.data || []).sort((a, b) => b.id - a.id);
      setRooms(sortedData);
      setFilteredRooms(sortedData);
    } catch (error) {
      toast.error("Lỗi khi tải danh sách phòng họp");
    } finally {
      setLoading(false);
    }
  };

  // === Filters ===
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const term = searchTerm.toLowerCase();

    const filtered = rooms.filter((item) => {
      const matchSearch =
        !term ||
        item.name?.toLowerCase().includes(term) ||
        item.location?.toLowerCase().includes(term);

      let matchStatus = true;

      if (statusFilter === "AVAILABLE" || statusFilter === "UNDER_MAINTENANCE") {
        matchStatus = item.status === statusFilter;
      } else if (statusFilter === "VIP") {
        matchStatus = item.requiresApproval === true;
      }

      return matchSearch && matchStatus;
    });

    setFilteredRooms(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, rooms]);

  const totalPages = Math.ceil(filteredRooms.length / ITEMS_PER_PAGE);

  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // === Modal (Add/Edit) ===
  const handleOpenModal = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        capacity: room.capacity,
        location: room.location,
        status: room.status,
        requiresApproval: room.requiresApproval || false,
      });
    } else {
      setEditingRoom(null);
      setFormData({
        name: "",
        capacity: 0,
        location: "",
        status: "AVAILABLE",
        requiresApproval: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
    setFormData({
      name: "",
      capacity: 0,
      location: "",
      status: "AVAILABLE",
      requiresApproval: false,
    });
  };

  // === Handle Submit ===
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên phòng họp");
      return;
    }

    const capacityValue = parseInt(formData.capacity, 10);
    if (isNaN(capacityValue) || capacityValue <= 0) {
      toast.error("Sức chứa phải lớn hơn 0");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        capacity: capacityValue,
        status: formData.status,
        requiresApproval: formData.requiresApproval,
      };

      if (editingRoom) {
        await updateRoom(editingRoom.id, payload);
        toast.success("Cập nhật phòng họp thành công!");
      } else {
        await createRoom(payload);
        toast.success("Tạo phòng họp thành công!");
      }

      await fetchRooms();
      handleCloseModal();
    } catch (error) {
      toast.error("Lỗi khi lưu phòng họp");
    } finally {
      setLoading(false);
    }
  };

  // === Delete ===
  const handleOpenDeleteModal = (room) => {
    setRoomToDelete(room);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setRoomToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    try {
      setLoading(true);
      await deleteRoom(roomToDelete.id);
      toast.success("Đã xóa phòng họp!");
      await fetchRooms();
      handleCloseDeleteModal();
    } catch (error) {
      toast.error("Không thể xóa phòng họp");
    } finally {
      setLoading(false);
    }
  };

  // === Helpers ===
  const getStatusBadge = (status) => {
    const styles = {
      AVAILABLE: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
      UNDER_MAINTENANCE: "bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100",
    };

    const labels = {
      AVAILABLE: "Có sẵn",
      UNDER_MAINTENANCE: "Đang bảo trì",
    };

    return (
      <span
        className={`px-3 py-1 text-sm font-medium rounded-full ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const handlePageChange = (page) => {
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    setCurrentPage(page);
  };

  // CARD 
  const totalRooms = rooms.length;
  const totalAvailable = rooms.filter((room) => room.status === "AVAILABLE").length;
  const totalMaintenance = rooms.filter((room) => room.status === "UNDER_MAINTENANCE").length;
  const totalVip = rooms.filter((room) => !!room.requiresApproval ).length;
  // const totalCapacity = rooms.reduce((acc, cur) => acc + (cur.capacity || 0), 0);

  // === Render ===
  return (
    <div className="p-8 min-h-screen transition-colors bg-gray-50 dark:bg-gray-900">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2 mb-8"
      >
        <Building size={32} className="text-blue-600 dark:text-blue-400" />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Quản lý phòng họp
        </h1>
      </motion.div>

      {/* FILTERS */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-7 border border-gray-100 dark:border-gray-700 transition"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm phòng họp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white 
              placeholder-gray-400 dark:placeholder-gray-500
              focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent text-base transition"
            />
          </div>
          {/* Filter by status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-base px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white
            focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400 transition cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="AVAILABLE">Có sẵn</option>
            <option value="UNDER_MAINTENANCE">Đang bảo trì</option>
            <option value="VIP">Phòng VIP</option> {/* Thêm trạng thái mới */}
          </select>
          {/* Add button */}
          <button
            onClick={() => handleOpenModal()}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
            text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50"
          >
            <Plus size={20} />
            Thêm phòng họp
          </button>
        </div>
      </motion.div>

      {/* ====== Card Stats ====== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-7"
      >
        {/* Tổng số phòng họp */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow transition"
        >
          <div className="text-gray-500 dark:text-gray-400 text-base mb-0.5">
            Tổng số phòng họp
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {totalRooms}
          </div>
        </motion.div>
        {/* Số phòng có sẵn */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
          className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800 shadow transition"
        >
          <div className="text-green-700 dark:text-green-400 text-base mb-0.5">
            Đang sẵn sàng
          </div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-200">
            {totalAvailable}
          </div>
        </motion.div>
        {/* Số phòng bảo trì */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800 shadow transition"
        >
          <div className="text-orange-700 dark:text-orange-400 text-base mb-0.5">
            Đang bảo trì
          </div>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-100">
            {totalMaintenance}
          </div>
        </motion.div>
        {/* Số phòng VIP (cần phê duyệt) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.33 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800 shadow transition"
        >
          <div className="text-yellow-700 dark:text-yellow-300 text-base mb-0.5">
            Số phòng VIP (cần phê duyệt)
          </div>
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-200">
            {totalVip}
          </div>
        </motion.div>
      </motion.div>

      {/* TABLE */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.33 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 relative"
      >
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-base text-left">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="p-4 font-semibold text-center w-20">STT</th>
                <th className="p-4 font-semibold">Tên phòng họp</th>
                {/* CỘT LOẠI PHÒNG (VIP) */}
                <th className="p-4 font-semibold">Loại phòng</th>
                <th className="p-4 font-semibold">Vị trí</th>
                <th className="p-4 font-semibold">Sức chứa</th>
                <th className="p-4 font-semibold">Trạng thái</th>
                <th className="p-4 font-semibold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* Không tìm thấy */}
              {paginatedRooms.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="p-10 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Search size={48} className="text-gray-300 dark:text-gray-600" />
                      <p className="text-lg font-semibold">Không tìm thấy phòng họp</p>
                      <p className="text-base">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRooms.map((room, idx) => (
                  <motion.tr
                    key={room.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.035 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    {/* STT */}
                    <td className="p-4 text-center">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </td>
                    {/* Name */}
                    <td className="p-4 font-medium text-gray-900 dark:text-white">
                      {room.name}
                    </td>
                    {/* CỘT VIP */}
                    <td className="p-4">
                      {room.requiresApproval ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 rounded-full border border-yellow-200 dark:border-yellow-800">
                          <Crown size={12} /> VIP
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Thường
                        </span>
                      )}
                    </td>
                    {/* Location */}
                    <td className="p-4 text-gray-600 dark:text-gray-400">
                      {room.location || (
                        <span className="italic text-gray-400 dark:text-gray-500">
                          Chưa có vị trí
                        </span>
                      )}
                    </td>
                    {/* Capacity */}
                    <td className="p-4 text-gray-600 dark:text-gray-400">
                      {room.capacity}
                    </td>
                    {/* Status */}
                    <td className="p-4">{getStatusBadge(room.status)}</td>
                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(room)}
                          disabled={loading}
                          className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300
                            hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md transition disabled:opacity-50"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(room)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300
                            hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          totalItems={filteredRooms.length}
          pageSize={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}

      {/* MODAL THÊM / SỬA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full 
            border border-gray-200 dark:border-gray-700 animate-slide-up"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingRoom ? "Chỉnh sửa phòng họp" : "Thêm phòng họp mới"}
              </h2>
              <button
                onClick={handleCloseModal}
                disabled={loading}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            {/* Body Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {/* Tên phòng */}
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tên phòng họp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="VD: Phòng Họp Sao Hỏa"
                    disabled={loading}
                    required
                    className="w-full px-4 py-2.5 text-base rounded-lg border border-gray-300 dark:border-gray-600
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    placeholder-gray-400 dark:placeholder-gray-500
                    focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent
                    disabled:opacity-50 transition-all"
                  />
                </div>
                {/* Vị trí */}
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vị trí
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="VD: Tầng 3, tòa nhà B"
                    disabled={loading}
                    className="w-full px-4 py-2.5 text-base rounded-lg border border-gray-300 dark:border-gray-600
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    placeholder-gray-400 dark:placeholder-gray-500
                    focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent
                    disabled:opacity-50 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Sức chứa */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sức chứa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({ ...formData, capacity: e.target.value })
                      }
                      placeholder="VD: 10"
                      min="1"
                      required
                      disabled={loading}
                      className="w-full px-4 py-2.5 text-base rounded-lg border border-gray-300 dark:border-gray-600
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent
                      disabled:opacity-50 transition-all"
                    />
                  </div>
                  {/* Trạng thái */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Trạng thái <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      required
                      disabled={loading}
                      className="w-full px-4 py-2.5 text-base rounded-lg border border-gray-300 dark:border-gray-600
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent
                      disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <option value="AVAILABLE">Có sẵn</option>
                      <option value="UNDER_MAINTENANCE">Đang bảo trì</option>
                    </select>
                  </div>
                </div>
                {/* === CẤU HÌNH PHÒNG VIP === */}
                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg text-yellow-600 dark:text-yellow-400">
                       <Crown size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Phòng VIP (Cần duyệt)</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Yêu cầu Admin phê duyệt khi đặt.</p>
                    </div>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.requiresApproval}
                      onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                      disabled={loading}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {/* Footer */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 text-base bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
                    text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-all
                    disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-base
                    bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm hover:shadow-md
                    transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        {editingRoom ? "Cập nhật" : "Thêm mới"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL XÓA — scale + fade */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full 
            border border-gray-200 dark:border-gray-700 animate-slide-up"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Xác nhận xóa
                </h2>
              </div>
              <button
                onClick={handleCloseDeleteModal}
                disabled={loading}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors
                disabled:opacity-50"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            {/* Body */}
            <div className="p-6">
              <p className="text-base text-gray-700 dark:text-gray-300 mb-4">
                Bạn có chắc chắn muốn xóa phòng họp này không?
              </p>
              {roomToDelete && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">
                        {roomToDelete.name} (Sức chứa: {roomToDelete.capacity})
                      </p>
                      <p className="text-base text-gray-600 dark:text-gray-400">
                        {roomToDelete.location || "Không có vị trí"}
                      </p>
                    </div>
                    {getStatusBadge(roomToDelete.status)}
                  </div>
                </div>
              )}
              <p className="text-base text-red-600 dark:text-red-400">
                ⚠️ Hành động này không thể hoàn tác!
              </p>
            </div>
            {/* Footer */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-base bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
                text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-base
                bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-sm hover:shadow-md
                transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Xóa phòng họp
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}