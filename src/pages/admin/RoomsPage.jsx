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
  AlertTriangle,
  Building,
  Monitor, // Icon cho thiết bị
} from "lucide-react";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(['rooms', 'common']);
  const DEVICE_MAP = {
  "Máy chiếu": "projector",
  "TV màn hình lớn": "largeTV",
  "Bảng trắng": "whiteboard",
  "Hệ thống âm thanh": "soundSystem",
  "Webcam hội nghị": "conferenceCam",
  "Quạt điều hòa": "airCooler",
};

const DEVICE_MAP_REVERSE = Object.fromEntries(
  Object.entries(DEVICE_MAP).map(([vi, key]) => [key, vi])
);

const DEVICE_KEYS = [
  "projector",
  "largeTV",
  "whiteboard",
  "soundSystem",
  "conferenceCam",
  "airCooler",
];

// Gợi ý nhanh theo ngôn ngữ
const SUGGESTED_DEVICES = DEVICE_KEYS.map((key) => ({
  key,
  label: t(`rooms:modal.equipment.list.${key}`)
}));

  // === States ===
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: "",
    capacity: 0,
    location: "",
    status: "AVAILABLE",
    requiresApproval: true, // Mặc định luôn là true
    fixedDevices: [], // Mảng chứa danh sách thiết bị
  });

  // State tạm để nhập tên thiết bị mới trong form
  const [deviceInput, setDeviceInput] = useState("");

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
      toast.error(t('rooms:messages.loadError'));
      // ({/* <span>toast.error("Lỗi khi tải danh sách phòng họp") */})
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

      if (
        statusFilter === "AVAILABLE" ||
        statusFilter === "UNDER_MAINTENANCE"
      ) {
        matchStatus = item.status === statusFilter;
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

  // === Modal Handlers ===
  const handleOpenModal = (room = null) => {
    setDeviceInput(""); // Reset input thiết bị
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        capacity: room.capacity,
        location: room.location,
        status: room.status,
        requiresApproval: true, // Luôn đảm bảo là true khi sửa (hoặc giữ room.requiresApproval nếu muốn)
        fixedDevices: room.fixedDevices.map(dev => DEVICE_MAP[dev] || dev),
      });
    } else {
      setEditingRoom(null);
      setFormData({
        name: "",
        capacity: 0,
        location: "",
        status: "AVAILABLE",
        requiresApproval: true, // Mặc định là true khi tạo mới
        fixedDevices: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
    setDeviceInput("");
  };

  // === Logic thêm/xóa thiết bị trong Form ===
  const handleAddDevice = () => {
    let val = deviceInput.trim();

// Nếu người dùng nhập tiếng Việt → convert sang KEY
const mappedKey = DEVICE_MAP[val];
if (mappedKey) val = mappedKey;

if (val && !formData.fixedDevices.includes(val)) {
  setFormData({
    ...formData,
    fixedDevices: [...formData.fixedDevices, val],
  });
  setDeviceInput("");
} else {
  toast.warning(t('rooms:messages.deviceExists'));
}
  };

  const handleRemoveDevice = (deviceToRemove) => {
    setFormData({
      ...formData,
      fixedDevices: formData.fixedDevices.filter((d) => d !== deviceToRemove),
    });
  };

  const handleKeyDownDevice = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddDevice();
    }
  };

  // === Handle Submit ===
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t('rooms:messages.nameRequired'));
      // ({/* <span>toast.error("Vui lòng nhập tên phòng họp") */})
      return;
    }

    const capacityValue = parseInt(formData.capacity, 10);
    if (isNaN(capacityValue) || capacityValue <= 0) {
      toast.error(t('rooms:messages.capacityInvalid'));
      // ({/* <span>toast.error("Sức chứa phải lớn hơn 0") */})
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        capacity: capacityValue,
        status: formData.status,
        requiresApproval: true, // Luôn yêu cầu duyệt
        fixedDevices: formData.fixedDevices.map(key => DEVICE_MAP_REVERSE[key] || key),
      };

      if (editingRoom) {
        await updateRoom(editingRoom.id, payload);
        toast.success(t('rooms:messages.updateSuccess'));
        // ({/* <span>toast.success("Cập nhật phòng họp thành công!") */})
      } else {
        await createRoom(payload);
        toast.success(t('rooms:messages.createSuccess'));
        // ({/* <span>toast.success("Tạo phòng họp thành công!") */})
      }

      await fetchRooms();
      handleCloseModal();
    } catch (error) {
      toast.error(t('rooms:messages.updateError'));
      // ({/* <span>toast.error("Lỗi khi lưu phòng họp") */})
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
      toast.success(t('rooms:messages.deleteSuccess'));
      // ({/* <span>toast.success("Đã xóa phòng họp!") */})
      await fetchRooms();
      handleCloseDeleteModal();
    } catch (error) {
      toast.error(t('rooms:messages.deleteError'));
      // ({/* <span>toast.error("Không thể xóa phòng họp") */})
    } finally {
      setLoading(false);
    }
  };

  // === Helpers ===
  const getStatusBadge = (status) => {
    const styles = {
      AVAILABLE:
        "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
      UNDER_MAINTENANCE:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    };

    const labels = {
      AVAILABLE: t('rooms:modal.statusOptions.available'),
      UNDER_MAINTENANCE: t('rooms:modal.statusOptions.maintenance'),
    };

    return (
      <span
        className={`px-2.5 py-1 text-xs font-semibold rounded-full border border-transparent ${styles[status]}`}
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

  // Stats
  const totalRooms = rooms.length;
  const totalAvailable = rooms.filter(
    (room) => room.status === "AVAILABLE"
  ).length;
  const totalMaintenance = rooms.filter(
    (room) => room.status === "UNDER_MAINTENANCE"
  ).length;
  // Đã bỏ totalVip

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
          {/* <span>Quản lý phòng họp</span> */}
          <span>{t('rooms:pageTitle')}</span>
        </h1>
      </motion.div>

      {/* FILTERS */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-7 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder={t('rooms:searchPlaceholder')}
              // ({/* <span>placeholder="Tìm kiếm phòng họp..."</span> */}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-400 cursor-pointer"
          >
            <option value="ALL">{t('common:common.filterAll')}</option>
            {/* ({/* <span>Tất cả trạng thái</span> */}
            <option value="AVAILABLE">{t('rooms:modal.statusOptions.available')}</option>
            {/* ({/* <span>Có sẵn/Sẵn sàng sử dụng</span> */}
            <option value="UNDER_MAINTENANCE">{t('rooms:modal.statusOptions.maintenance')}</option>
            {/* ({/* <span>Đang bảo trì</span> */}
          </select>
          <button
            onClick={() => handleOpenModal()}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow hover:shadow-lg transition disabled:opacity-50"
          >
            <Plus size={20} />
            {/* <span>Thêm phòng</span> */}
            <span>{t('rooms:addRoom')}</span>
          </button>
        </div>
      </motion.div>

      {/* STATS */}
      {/* Đã điều chỉnh grid thành 3 cột vì bỏ 1 thẻ VIP */}
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
        {[
          {
            label: t('rooms:stats.total'),
            // ({/* <span>Tổng số phòng</span> */})
            val: totalRooms,
            color: "text-gray-800",
            bg: "bg-white",
          },
          {
            label: t('rooms:stats.available'),
            // ({/* <span>Sẵn sàng</span> */})
            val: totalAvailable,
            color: "text-green-700",
            bg: "bg-green-50",
          },
          {
            label: t('rooms:stats.maintenance'),
            // ({/* <span>Bảo trì</span> */})
            val: totalMaintenance,
            color: "text-orange-700",
            bg: "bg-orange-50",
          },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`${item.bg} dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm`}
          >
            <div
              className={`text-base font-medium mb-1 ${item.color} dark:text-gray-400`}
            >
              {item.label}
            </div>
            <div className={`text-2xl font-bold ${item.color} dark:text-white`}>
              {item.val}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* TABLE */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 relative"
      >
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 uppercase text-xs">
              <tr>
                <th className="p-4 w-16 text-center">{t('common:common.stt')}</th>
                {/* ({/* <span>STT</span> */}
                <th className="p-4">{t('rooms:table.room')}</th>
                {/* ({/* <span>Phòng họp</span> */}
                <th className="p-4">{t('rooms:table.location')}</th>
                {/* ({/* <span>Vị trí</span> */}
                <th className="p-4">{t('rooms:table.capacity')}</th>
                {/* ({/* <span>Sức chứa</span> */}
                <th className="p-4 w-64">{t('rooms:table.equipment')}</th>
                {/* ({/* <span>Thiết bị</span> */}
                <th className="p-4">{t('rooms:table.status')}</th>
                {/* ({/* <span>Trạng thái</span> */}
                <th className="p-4 text-center">{t('common:common.actions')}</th>
                {/* ({/* <span>Tác vụ</span> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginatedRooms.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-gray-500">
                    <Search size={40} className="mx-auto mb-2 opacity-50" />
                    {/* <span>Không tìm thấy dữ liệu</span> */}
                    <span>{t('rooms:messages.noResults')}</span>
                  </td>
                </tr>
              ) : (
                paginatedRooms.map((room, idx) => (
                  <motion.tr
                    key={room.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  >
                    <td className="p-4 text-center">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {room.name}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">
                      {room.location || (
                        <span className="italic text-gray-400">--</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-900 dark:text-white font-medium">
                      {room.capacity} {/* <span>người</span> */}
                    </td>

                    {/* CỘT THIẾT BỊ */}
                    <td className="p-4">
                      {room.fixedDevices && room.fixedDevices.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {room.fixedDevices.slice(0, 3).map((dev, i) => {
  const key = DEVICE_MAP[dev] || dev; // Nếu không có trong map thì dùng nguyên bản
  return (
    <span
      key={i}
      className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded text-xs border border-blue-100 dark:border-blue-800"
    >
      {t(`rooms:modal.equipment.list.${key}`)}
    </span>
  );
})}
                          {room.fixedDevices.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                              +{room.fixedDevices.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          {/* <span>Không có</span> */}
                          <span>{t('rooms:table.noEquipment')}</span>
                        </span>
                      )}
                    </td>

                    <td className="p-4">{getStatusBadge(room.status)}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(room)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                          title={t('common:buttons.edit')}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(room)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"
                          title={t('common:buttons.delete')}
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

      {totalPages > 1 && (
        <Pagination
          totalItems={filteredRooms.length}
          pageSize={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}

      {/* MODAL ADD/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {/* <span>{editingRoom ? "Cập nhật phòng họp" : "Thêm phòng họp mới"}</span> */}
                <span>
                  {editingRoom ? t('rooms:modal.editTitle') : t('rooms:modal.addTitle')}
                </span>
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="roomForm" onSubmit={handleSubmit} className="space-y-5">
                {/* Tên phòng */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {/* <span>Tên phòng họp</span> */}
                    <span>{t('rooms:modal.fields.name')}</span> <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder={t('rooms:modal.placeholders.name')}
                    // ({/* <span>placeholder="VD: Phòng Họp Sao Hỏa"</span> */})
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>

                {/* Grid: Location & Capacity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {/* <span>Vị trí</span> */}
                      <span>{t('rooms:modal.fields.location')}</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder={t('rooms:modal.placeholders.location')}
                      // ({/* <span>placeholder="VD: Tầng 3"</span> */})
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {/* <span>Sức chứa</span> */}
                      <span>{t('rooms:modal.fields.capacity')}</span> <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({ ...formData, capacity: e.target.value })
                      }
                      min="1"
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {/* <span>Trạng thái</span> */}
                    <span>{t('rooms:modal.fields.status')}</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer"
                  >
                    <option value="AVAILABLE">{t('rooms:modal.statusOptions.available')}</option>
                    {/* ({/* <span>Sẵn sàng sử dụng</span> */}
                    <option value="UNDER_MAINTENANCE">{t('rooms:modal.statusOptions.maintenance')}</option>
                    {/* ({/* <span>Đang bảo trì</span> */}
                  </select>
                </div>

                {/* === MỤC THIẾT BỊ CÓ SẴN === */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <Monitor size={16} />
                    {/* <span>Thiết bị có sẵn</span> */}
                    <span>{t('rooms:modal.fields.equipment')}</span>
                  </label>

                  {/* Input nhập tag */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={deviceInput}
                      onChange={(e) => setDeviceInput(e.target.value)}
                      onKeyDown={handleKeyDownDevice}
                      placeholder={t('rooms:modal.placeholders.equipmentInput')}
                      // ({/* <span>placeholder="Nhập tên thiết bị rồi nhấn Enter..."</span> */})
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddDevice}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                    >
                      {/* <span>Thêm</span> */}
                      <span>{t('rooms:modal.equipment.add')}</span>
                    </button>
                  </div>

                  {/* Danh sách Tags đã thêm */}
                  <div className="flex flex-wrap gap-2 mb-3 min-h-[30px]">
                    {formData.fixedDevices.length === 0 && (
                      <span className="text-gray-400 text-xs italic">
                        {/* <span>Chưa có thiết bị nào.</span> */}
                        <span>{t('rooms:modal.equipment.noDevice')}</span>
                      </span>
                    )}
                    {formData.fixedDevices.map((device, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full text-sm shadow-sm"
                      >
                        {t(`rooms:modal.equipment.list.${device}`)}
                        <button
                          type="button"
                          onClick={() => handleRemoveDevice(device)}
                          className="hover:text-red-500 transition-colors rounded-full p-0.5"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Gợi ý thiết bị phổ biến */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {/* <span>Gợi ý nhanh:</span> */}
                      <span>{t('rooms:modal.equipment.suggestions')}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_DEVICES.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            if (!formData.fixedDevices.includes(item.key)) {
                              setFormData((prev) => ({
                                ...prev,
                                fixedDevices: [
                                  ...prev.fixedDevices,
                                  item.key,
                                ],
                              }));
                            }
                          }}
                          className={`px-2 py-1 text-xs rounded border transition-colors ${
                            formData.fixedDevices.includes(item.key)
                              ? "bg-blue-100 text-blue-600 border-blue-200 cursor-default opacity-60"
                              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 hover:border-blue-400 hover:text-blue-500"
                          }`}
                        >
                          + {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
              >
                {/* <span>Hủy bỏ</span> */}
                <span>{t('rooms:modal.buttons.cancel')}</span>
              </button>
              <button
                form="roomForm"
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md transition flex justify-center items-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Check size={18} />
                )}
                {/* <span>{editingRoom ? "Lưu thay đổi" : "Tạo phòng"}</span> */}
                <span>
                  {editingRoom
                    ? t('rooms:modal.buttons.save')
                    : t('rooms:modal.buttons.create')}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL DELETE*/}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center"
          >
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {/* <span>Xóa phòng họp?</span> */}
              <span>{t('rooms:modal.deleteTitle')}</span>
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              {/* <span>Hành động này sẽ xóa vĩnh viễn phòng</span> */}
              {t('rooms:modal.deleteDesc')}
              <br />
              {/* <strong>{roomToDelete?.name}</strong>. Không thể hoàn tác. */}
              <strong>{roomToDelete?.name}</strong>. {t('rooms:modal.deleteWarning')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCloseDeleteModal}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
              >
                {/* <span>Hủy</span> */}
                <span>{t('rooms:modal.buttons.cancel')}</span>
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition shadow-md"
              >
                {/* <span>Xóa ngay</span> */}
                <span>{t('rooms:modal.buttons.delete')}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}