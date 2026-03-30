// src/pages/admin/RoomsPage.jsx
import { useEffect, useState } from "react";
import {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../../services/roomService";
import { getDevices } from "../../services/deviceService";
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
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import ImageLightbox from "../../components/ImageLightbox";
import BuildingViewer from "../../components/3d/BuildingViewer";
import { FiBox } from "react-icons/fi";
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
  // const SUGGESTED_DEVICES ... (Removed legacy static list)

  // === States ===
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [availableDevices, setAvailableDevices] = useState([]); // [NEW] List of devices from DB
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
    buildingName: "",
    floor: "",
    status: "AVAILABLE",
    requiresApproval: true, // Mặc định luôn là true
    deviceIds: [], // [NEW] Mảng chứa ID thiết bị
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [viewRoom, setViewRoom] = useState(null);
  const [lightbox, setLightbox] = useState({ open: false, index: 0, images: [] });
  const [is3DOpen, setIs3DOpen] = useState(false);

  // State tạm để nhập tên thiết bị mới trong form
  const [deviceInput, setDeviceInput] = useState("");
  const [existingImages, setExistingImages] = useState([]); // Ảnh cũ từ server
  const [imagesToDelete, setImagesToDelete] = useState([]); // Danh sách URL ảnh cần xóa

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // === Fetch Rooms ===
  useEffect(() => {
    fetchRooms();
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await getDevices();
      setAvailableDevices(res.data || []);
    } catch (err) {
      console.error("Failed to load devices", err);
    }
  };

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

  const [semanticResults, setSemanticResults] = useState(null);

  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      setSemanticResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("http://localhost:8006/api/semantic-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: term, type: "rooms" }),
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
  }, [searchTerm, rooms]);

  useEffect(() => {
    const term = searchTerm.trim();

    const filtered = rooms.filter((item) => {
      const matchSearch = !term || (semanticResults !== null && semanticResults.includes(item.id));

      let matchStatus = true;

      if (
        statusFilter === "AVAILABLE" ||
        statusFilter === "UNDER_MAINTENANCE"
      ) {
        matchStatus = item.status === statusFilter;
      }

      return matchSearch && matchStatus;
    });

    if (term && semanticResults) {
      filtered.sort((a, b) => {
        return semanticResults.indexOf(a.id) - semanticResults.indexOf(b.id);
      });
    }

    setFilteredRooms(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, rooms, semanticResults]);

  const totalPages = Math.ceil(filteredRooms.length / ITEMS_PER_PAGE);

  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // === Modal Handlers ===
  const handleOpenModal = (room = null) => {
    setDeviceInput(""); // Reset input thiết bị
    setSelectedImages([]);
    setImagesToDelete([]);
    if (room) {
      setEditingRoom(room);
      setExistingImages(room.images || []);
      setFormData({
        name: room.name,
        capacity: room.capacity,
        location: room.location,
        buildingName: room.buildingName || "",
        floor: room.floor || "",
        status: room.status,
        status: room.status,
        requiresApproval: true,
        deviceIds: room.devices ? room.devices.map(d => d.id) : [],
      });
    } else {
      setEditingRoom(null);
      setExistingImages([]);
      setFormData({
        name: "",
        capacity: 0,
        location: "",
        buildingName: "",
        floor: "",
        status: "AVAILABLE",
        requiresApproval: true, // Mặc định là true khi tạo mới
        status: "AVAILABLE",
        requiresApproval: true,
        deviceIds: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
    setDeviceInput("");
    setSelectedImages([]);
    setExistingImages([]);
    setImagesToDelete([]);
  };

  const handleViewRoom = (room) => {
    setViewRoom(room);
  };

  // === Logic chọn thiết bị (Multi-select toggler) ===
  const toggleDevice = (deviceId) => {
    setFormData(prev => {
      const currentIds = prev.deviceIds || [];
      if (currentIds.includes(deviceId)) {
        return { ...prev, deviceIds: currentIds.filter(id => id !== deviceId) };
      } else {
        return { ...prev, deviceIds: [...currentIds, deviceId] };
      }
    });
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
        buildingName: formData.buildingName.trim(),
        floor: formData.floor ? parseInt(formData.floor, 10) : null,
        capacity: capacityValue,
        status: formData.status,
        status: formData.status,
        requiresApproval: true,
        deviceIds: formData.deviceIds,
        deleteImages: imagesToDelete,
      };

      const submitData = new FormData();
      submitData.append("request", new Blob([JSON.stringify(payload)], { type: "application/json" }));

      selectedImages.forEach((image) => {
        submitData.append("images", image);
      });

      // Gửi danh sách ảnh cần xóa (nếu có)
      imagesToDelete.forEach((imgUrl) => {
        submitData.append("deleteImages", imgUrl);
      });

      if (editingRoom) {
        await updateRoom(editingRoom.id, submitData);
        toast.success(t('rooms:messages.updateSuccess'));
        // ({/* <span>toast.success("Cập nhật phòng họp thành công!") */})
      } else {
        await createRoom(submitData);
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
        <Building size={32} className="text-emerald-600 dark:text-emerald-400" />
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
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-400 transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-400 cursor-pointer"
          >
            <option value="ALL">{t('common:common.filterAll')}</option>
            {/* ({/* <span>Tất cả trạng thái</span> */}
            <option value="AVAILABLE">{t('rooms:modal.statusOptions.available')}</option>
            {/* ({/* <span>Có sẵn/Sẵn sàng sử dụng</span> */}
            <option value="UNDER_MAINTENANCE">{t('rooms:modal.statusOptions.maintenance')}</option>
            {/* ({/* <span>Đang bảo trì</span> */}
          </select>
          <button
            onClick={() => setIs3DOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow hover:shadow-lg transition disabled:opacity-50"
          >
            <FiBox size={20} />
            {/* <span>Xem 3D</span> */}
            <span>Xem 3D</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow hover:shadow-lg transition disabled:opacity-50"
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
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
                    onClick={() => handleViewRoom(room)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer"
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
                      {room.buildingName ? (
                        <div className="flex flex-col">
                          <span className="font-medium">{room.buildingName}</span>
                          <span className="text-xs text-gray-500">Tầng {room.floor}</span>
                        </div>
                      ) : (
                        room.location || <span className="italic text-gray-400">--</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-900 dark:text-white font-medium">
                      {room.capacity} {/* <span>người</span> */}
                    </td>

                    {/* CỘT THIẾT BỊ [UPDATED] */}
                    <td className="p-4">
                      {room.devices && room.devices.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {room.devices.slice(0, 3).map((dev, i) => (
                            <span
                              key={dev.id || i}
                              className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 rounded text-xs border border-emerald-100 dark:border-emerald-800"
                            >
                              {dev.name}
                            </span>
                          ))}
                          {room.devices.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                              +{room.devices.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          <span>{t('rooms:table.noEquipment')}</span>
                        </span>
                      )}
                    </td>

                    <td className="p-4">{getStatusBadge(room.status)}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(room)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition"
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  />
                </div>

                {/* Grid: Building, Floor, Capacity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tòa nhà/Khu vực
                    </label>
                    <input
                      type="text"
                      value={formData.buildingName}
                      onChange={(e) =>
                        setFormData({ ...formData, buildingName: e.target.value })
                      }
                      placeholder="VD: Tòa A"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tầng
                    </label>
                    <input
                      type="number"
                      value={formData.floor}
                      onChange={(e) =>
                        setFormData({ ...formData, floor: e.target.value })
                      }
                      placeholder="VD: 3"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
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
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    />
                  </div>
                </div>

                {/* Location (Optional/Computed) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {/* <span>Vị trí</span> */}
                    <span>{t('rooms:modal.fields.location')} (Hiển thị)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder={t('rooms:modal.placeholders.location')}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  />
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition cursor-pointer"
                  >
                    <option value="AVAILABLE">{t('rooms:modal.statusOptions.available')}</option>
                    {/* ({/* <span>Sẵn sàng sử dụng</span> */}
                    <option value="UNDER_MAINTENANCE">{t('rooms:modal.statusOptions.maintenance')}</option>
                    {/* ({/* <span>Đang bảo trì</span> */}
                  </select>
                </div>

                {/* === MỤC CHỌN THIẾT BỊ (CHECKBOX GRID) === */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <Monitor size={16} />
                    <span>{t('rooms:modal.fields.equipment')}</span>
                  </label>

                  {/* List of Available Devices */}
                  {availableDevices.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {availableDevices.map((device) => {
                        const isSelected = formData.deviceIds?.includes(device.id);
                        // Check if device is available or assigned to THIS room
                        const canSelect = device.status === 'AVAILABLE' || device.roomId === editingRoom?.id || !device.roomId;

                        return (
                          <div
                            key={device.id}
                            onClick={() => canSelect && toggleDevice(device.id)}
                            className={`
                               flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all
                               ${isSelected
                                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                                : "bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-600 hover:border-emerald-300"}
                               ${!canSelect && !isSelected ? "opacity-50 cursor-not-allowed bg-gray-100" : ""}
                             `}
                          >
                            <div className={`
                               w-4 h-4 rounded border flex items-center justify-center
                               ${isSelected ? "bg-emerald-500 border-emerald-500" : "border-gray-400"}
                             `}>
                              {isSelected && <Check size={10} className="text-white" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{device.name}</span>
                              {!canSelect && !isSelected && <span className="text-[10px] text-red-400">(Đã dùng ở phòng khác)</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Chưa có thiết bị nào trong hệ thống.</p>
                  )}
                </div>
                {/* === ẢNH PHÒNG HỌP === */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <ImageIcon size={16} />
                    <span>{t('rooms:modal.fields.images') || "Hình ảnh phòng họp"}</span>
                  </label>

                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                        <p className="text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">{t('rooms:modal.clickToUpload') || "Click để tải ảnh"}</span></p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG (MAX. 5MB)</p>
                      </div>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files) {
                            const files = Array.from(e.target.files);
                            setSelectedImages(prev => [...prev, ...files]);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Preview Existing Images (Server) */}
                  {existingImages.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Ảnh hiện có:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {existingImages.map((imgUrl, idx) => (
                          // Nếu ảnh đã bị mark xóa thì ẩn đi
                          !imagesToDelete.includes(imgUrl) && (
                            <div key={idx} className="relative group w-full h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                              <img
                                src={imgUrl}
                                alt="existing"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setImagesToDelete((prev) => [...prev, imgUrl]);
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Xóa ảnh này"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview Selected Images (New Uploads) */}
                  {selectedImages.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Ảnh mới chọn:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {selectedImages.map((file, idx) => (
                          <div key={idx} className="relative group w-full h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                            <img
                              src={URL.createObjectURL(file)}
                              alt="preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-md transition flex justify-center items-center gap-2"
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
      )
      }

      {/* MODAL DELETE*/}
      {
        isDeleteModalOpen && (
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
        )
      }

      {/* MODAL CHI TIẾT PHÒNG */}
      {
        viewRoom && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewRoom(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full text-left overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-64 bg-gray-200 dark:bg-gray-700">
                {viewRoom.images && viewRoom.images.length > 0 ? (
                  <img
                    src={viewRoom.images[0]}
                    alt={viewRoom.name}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-700"
                    onClick={() => setLightbox({ open: true, index: 0, images: viewRoom.images })}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 flex-col">
                    <ImageIcon size={48} />
                    <span>{t('rooms:messages.noImage') || "Chưa có hình ảnh"}</span>
                  </div>
                )}
                <div className="absolute top-4 right-4 z-10">
                  <button onClick={() => setViewRoom(null)} className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition">
                    <X size={20} />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20 pointer-events-none">
                  <h2 className="text-3xl font-bold text-white mb-1">{viewRoom.name}</h2>
                  <p className="text-gray-200 flex items-center gap-2">
                    <Building size={16} /> {viewRoom.location || "N/A"}
                  </p>
                </div>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Info */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Description/Specs */}
                    <div className="flex gap-4">
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl flex-1 border border-emerald-100 dark:border-emerald-800">
                        <span className="block text-xs uppercase text-emerald-600 dark:text-emerald-400 font-bold mb-1">{t('rooms:table.capacity') || "Sức chứa"}</span>
                        <span className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{viewRoom.capacity} <span className="text-sm font-normal">người</span></span>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex-1 border border-blue-100 dark:border-blue-800">
                        <span className="block text-xs uppercase text-blue-600 dark:text-blue-400 font-bold mb-1">{t('rooms:table.status') || "Trạng thái"}</span>
                        <div className="mt-1">{getStatusBadge(viewRoom.status)}</div>
                      </div>
                    </div>

                    {/* Equipment */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                        <Monitor size={20} className="text-emerald-500" />
                        {t('rooms:table.equipment') || "Thiết bị & Tiện ích"}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {viewRoom.fixedDevices && viewRoom.fixedDevices.length > 0 ? (
                          viewRoom.fixedDevices.map((dev, i) => {
                            const key = DEVICE_MAP[dev] || dev;
                            return (
                              <span key={i} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600">
                                {DEVICE_MAP_REVERSE[dev] ? t(`rooms:modal.equipment.list.${key}`) : dev}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-gray-400 italic">Không có thiết bị đặc biệt.</span>
                        )}
                      </div>
                    </div>

                    {/* More Images */}
                    {viewRoom.images && viewRoom.images.length > 1 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                          <ImageIcon size={20} className="text-emerald-500" />
                          <span>Thư viện ảnh</span>
                        </h3>
                        <div className="grid grid-cols-4 gap-2">
                          {viewRoom.images.map((img, idx) => (
                            <div
                              key={idx}
                              className="aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition shadow-sm hover:shadow-md"
                              onClick={() => setLightbox({ open: true, index: idx, images: viewRoom.images })}
                            >
                              <img src={img} alt={`Room ${idx}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Actions? or History? */}
                  <div className="md:col-span-1 space-y-4">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                      <h4 className="font-bold text-gray-800 dark:text-white mb-2">Thao tác nhanh</h4>
                      <div className="space-y-2">
                        <button onClick={() => { setViewRoom(null); handleOpenModal(viewRoom); }} className="w-full py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
                          <Edit2 size={16} /> {t('common:buttons.edit') || "Chỉnh sửa"}
                        </button>
                        <button onClick={() => { setViewRoom(null); handleOpenDeleteModal(viewRoom); }} className="w-full py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
                          <Trash2 size={16} /> {t('common:buttons.delete') || "Xóa phòng"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )
      }
      {/* IMAGES LIGHTBOX */}
      <ImageLightbox
        open={lightbox.open}
        onClose={() => setLightbox((prev) => ({ ...prev, open: false }))}
        images={lightbox.images}
        initialIndex={lightbox.index}
      />

      <BuildingViewer
        open={is3DOpen}
        onClose={() => setIs3DOpen(false)}
        rooms={rooms}
        onRoomClick={(room) => {
          setViewRoom(room);
          setIs3DOpen(false);
          // Optionally trigger edit or view logic here
        }}
      />
    </div >
  );
}