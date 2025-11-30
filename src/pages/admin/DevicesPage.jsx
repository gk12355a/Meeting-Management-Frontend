// DevicesPage.jsx
import { useEffect, useState } from "react";
import { getDevices, createDevice, updateDevice, deleteDevice } from "../../services/deviceService";
import { Search, Plus, Edit2, Trash2, X, Check, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import Pagination from "../../components/Pagination";
import { useTranslation } from "react-i18next";
const toastColors = {
  success: "#10b981", // xanh ngọc dịu
  error: "#ef4444", // đỏ ấm
  warning: "#e4650aff", // vàng dịu
  info: "#3b82f6", // xanh dương nhạt
};

/* Áp dụng màu cho Toastify */
const setToastTheme = () => {
  const root = document.documentElement;
  root.style.setProperty("--toastify-color-success", toastColors.success);
  root.style.setProperty("--toastify-color-error", toastColors.error);
  root.style.setProperty("--toastify-color-warning", toastColors.warning);
  root.style.setProperty("--toastify-color-info", toastColors.info);
};
setToastTheme();

export default function DevicesPage() {
  const { t } = useTranslation(['devices', 'common']);
  // Danh sách thiết bị
  const [devices, setDevices] = useState([]);  
  // Tìm kiếm & lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Modal thêm/sửa thiết bị
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "AVAILABLE"
  });
  
  // Modal xác nhận xóa
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  
  // Trạng thái loading
  const [loading, setLoading] = useState(false);
  // ===== PHÂN TRANG =====//
  const ITEMS_PER_PAGE = 5; // số thiết bị mỗi trang
  const [currentPage, setCurrentPage] = useState(1);
  // Fetch danh sách thiết bị khi component mount
  useEffect(() => {
    fetchDevices();
  }, []);
  // Lọc thiết bị theo search term và status filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filteredDevices = devices.filter(d => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      !term ||
      d.name?.toLowerCase().includes(term) ||
      d.description?.toLowerCase().includes(term);

    const matchStatus = statusFilter === "ALL" ? true : d.status === statusFilter;

    return matchSearch && matchStatus;
  });
  const paginatedDevices = filteredDevices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /**
   * Lấy danh sách tất cả thiết bị từ API
   */
  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await getDevices();
      let data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      // Sort giảm dần theo id
      data = [...data].sort((a, b) => (b.id || 0) - (a.id || 0));
      setDevices(data);
    } catch (error) {
      toast.error("❌ " + t("devices:messages.loadError")); // ({/* <span>Không thể tải danh sách thiết bị!</span> */} )
      console.error("Fetch devices error:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mở modal thêm mới hoặc chỉnh sửa thiết bị
   * @param {Object|null} device - Thiết bị cần sửa, null nếu thêm mới
   */
  const handleOpenModal = (device = null) => {
    if (device) {
      // Chế độ chỉnh sửa
      setEditingDevice(device);
      setFormData({
        name: device.name,
        description: device.description,
        status: device.status
      });
    } else {
      // Chế độ thêm mới
      setEditingDevice(null);
      setFormData({ name: "", description: "", status: "AVAILABLE" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDevice(null);
    setFormData({ name: "", description: "", status: "AVAILABLE" });
  };

  // Khi tạo mới thiết bị, show thiết bị lên đầu 
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate tên thiết bị
    if (!formData.name.trim()) {
      toast.warning("⚠️ " + t("devices:messages.nameRequired")); // ({/* <span>Vui lòng nhập tên thiết bị!</span> */})
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
      };

      if (editingDevice) {
        // Cập nhật thiết bị
        await updateDevice(editingDevice.id, submitData);
        toast.success(t("devices:messages.updateSuccess")); // ({/* <span>Cập nhật thiết bị thành công!</span> */})
        await fetchDevices();
        handleCloseModal();
      } else {
        // Thêm mới thiết bị
        const res = await createDevice(submitData);
        toast.success(t("devices:messages.createSuccess")); // ({/* <span>Thêm thiết bị mới thành công!</span> */})

        let createdDevice = res?.data;
        if (createdDevice && createdDevice.data) createdDevice = createdDevice.data;

        createdDevice = {
          ...createdDevice,
          status: createdDevice.status || submitData.status || "AVAILABLE",
        };

        // Cập nhật list thiết bị
        setDevices(prev => {
          const newDevices = [{ ...createdDevice }, ...prev];
          return newDevices.sort((a, b) => (b.id || 0) - (a.id || 0));
        });

        // Đợi 0.3s rồi tắt modal (mượt hơn)
        setTimeout(() => {
          handleCloseModal();
        }, 300);
      }
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || t('common:messages.error');
      toast.error(
        (editingDevice
          ? t("devices:messages.updateError")
          : t("devices:messages.createError")
        ) +
        ": " +
        errorMsg
      ); // ({/* <span>Thêm thiết bị thất bại: ...</span> */})
      console.error("Submit error:", error?.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mở modal xác nhận xóa thiết bị
   * @param {Object} device - Thiết bị cần xóa
   */
  const handleOpenDeleteModal = (device) => {
    setDeviceToDelete(device);
    setIsDeleteModalOpen(true);
  };

  /**
   * Đóng modal xác nhận xóa
   */
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeviceToDelete(null);
  };

  /**
   * Xác nhận xóa thiết bị
   */
  const handleConfirmDelete = async () => {
    if (!deviceToDelete) return;

    try {
      setLoading(true);
      await deleteDevice(deviceToDelete.id);
      toast.success(t("devices:messages.deleteSuccess")); // ({/* <span>Đã xóa thiết bị thành công!</span> */})
      // Refresh danh sách và đóng modal
      await fetchDevices();
      handleCloseDeleteModal();
    } catch (error) {
      const errorMsg = error?.response?.data?.message || t('devices:messages.deleteError');
      toast.error(t("devices:messages.deleteError") + ": " + errorMsg); // ({/* <span>Xóa thiết bị thất bại: ...</span> */})
      console.error("Delete error:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Tạo badge hiển thị trạng thái thiết bị
   * @param {string} status - Trạng thái thiết bị (AVAILABLE, UNDER_MAINTENANCE)
   * @returns {JSX.Element} Badge component
   */
  const getStatusBadge = (status) => {
    const styles = {
      AVAILABLE:
        "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
      UNDER_MAINTENANCE:
        "bg-orange-100 text-orange-700 dark:bg-orange-700 dark:text-orange-100"
    };

    const labels = {
      AVAILABLE: t('devices:modal.statusOptions.available'), // ({/* <span>Có sẵn</span> */})
      UNDER_MAINTENANCE: t('devices:modal.statusOptions.maintenance'), // ({/* <span>Đang bảo trì</span> */})
    };

    return (
      <span
        className={`px-3 py-1 text-sm font-medium rounded-full ${styles[status]}`}
        style={{ fontSize: "0.95rem", letterSpacing: 0 }}
      >
        {labels[status]}
      </span>
    );
  };

  /**
   * Đếm số lượng thiết bị theo trạng thái
   * @param {string} status - Trạng thái cần đếm
   * @returns {number} Số lượng thiết bị
   */
  const getStatsByStatus = (status) => {
    return devices.filter((d) => d.status === status).length;
  };

  return (
    <div className="p-8 min-h-screen transition-colors bg-gray-50 dark:bg-gray-900">
      {/* ===== HEADER ===== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2 mb-8"
      >
        <span>
          <svg
            width={32}
            height={32}
            viewBox="0 0 24 24"
            className="text-blue-600 dark:text-blue-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </span>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          {/* <span>Quản lý thiết bị</span> */}
          <span>{t('devices:pageTitle')}</span>
        </h1>
      </motion.div>

      {/* ===== FILTERS & ACTIONS ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-7 border border-gray-100 dark:border-gray-700 transition"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Ô tìm kiếm */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              placeholder={t('devices:searchPlaceholder') /* <span>Tìm kiếm thiết bị...</span> */}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-gray-900
              placeholder-gray-400 dark:placeholder-gray-500
              focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent
              transition-all duration-200 text-base"
            />
          </div>

          {/* Lọc theo trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-base px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white
            text-gray-900 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent
             transition-all duration-200 cursor-pointer"
          >
            {/* Sử dụng common:common.filterAll và trạng thái i18n */}
            <option value="ALL">{t('common:common.filterAll') /* <span>Tất cả trạng thái</span> */}</option>
            <option value="AVAILABLE">{t('devices:modal.statusOptions.available') /* <span>Có sẵn</span> */}</option>
            <option value="UNDER_MAINTENANCE">{t('devices:modal.statusOptions.maintenance') /* <span>Đang bảo trì</span> */}</option>
          </select>

          {/* Nút thêm thiết bị */}
          <button
            onClick={() => handleOpenModal()}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-base
              disabled:bg-blue-400 disabled:cursor-not-allowed
              text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            {/* <span>Thêm thiết bị</span> */}
            <span>{t('devices:addDevice')}</span>
          </button>
        </div>
      </motion.div>

      {/* ===== STATS CARDS ===== */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.55,
          ease: [0.18, 0.71, 0.35, 0.98],
        }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7"
      >
        {/* Tổng số thiết bị */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow transition"
        >
          <div className="text-gray-500 dark:text-gray-400 text-base mb-0.5">
            {/* <span>Tổng số thiết bị</span> */}
            <span>{t('devices:stats.total')}</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {devices.length}
          </div>
        </motion.div>
        {/* Số thiết bị có sẵn */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800 shadow transition"
        >
          <div className="text-green-700 dark:text-green-400 text-base mb-0.5">
            {/* <span>Có sẵn</span> */}
            <span>{t('devices:stats.available')}</span>
          </div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-200">
            {getStatsByStatus("AVAILABLE")}
          </div>
        </motion.div>
        {/* Số thiết bị đang bảo trì */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800 shadow transition"
        >
          <div className="text-orange-700 dark:text-orange-400 text-base mb-0.5">
            {/* <span>Đang bảo trì</span> */}
            <span>{t('devices:stats.maintenance')}</span>
          </div>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-100">
            {getStatsByStatus("UNDER_MAINTENANCE")}
          </div>
        </motion.div>
      </motion.div>

      {/* ===== TABLE - DANH SÁCH THIẾT BỊ ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
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
            {/* Table header */}
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                {/* {t('common:common.stt')}, {t('devices:table.name')}, ... */}
                <th className="p-4 text-base font-semibold w-16 text-center">{t('common:common.stt')}</th>
                <th className="p-4 text-base font-semibold">{t('devices:table.name')}</th>
                <th className="p-4 text-base font-semibold">{t('devices:table.description')}</th>
                <th className="p-4 text-base font-semibold">{t('devices:table.status')}</th>
                <th className="p-4 text-base font-semibold text-center">{t('common:common.actions')}</th>
              </tr>
            </thead>
            
            {/* Table body */}
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-base">
              {filteredDevices.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={48} className="text-gray-300 dark:text-gray-600" />
                      {/* <p className="text-lg font-semibold">Không tìm thấy thiết bị nào</p> */}
                      {/* <p className="text-base">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p> */}
                      <p className="text-lg font-semibold">{t('devices:messages.noDevices')}</p>
                      <p className="text-base">{t('devices:messages.noDevicesDesc')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDevices.map((device, i) => (
                  <motion.tr
                    key={device.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="p-4 font-semibold text-center">
                      {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                    </td>

                    <td className="p-4 font-medium text-gray-900 dark:text-white">
                      {device.name}
                    </td>

                    <td className="p-4 text-gray-600 dark:text-gray-400">
                      {device.description || (
                        <span className="text-gray-400 dark:text-gray-600 italic">
                          {/* <span>Chưa có mô tả</span> */}
                          {t('devices:table.noDescription')}
                        </span>
                      )}
                    </td>

                    <td className="p-4">{getStatusBadge(device.status)}</td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Nút chỉnh sửa */}
                        <button
                          onClick={() => handleOpenModal(device)}
                          disabled={loading}
                          className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300
                            hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md transition
                            disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t('common:buttons.edit')}
                        >
                          <Edit2 size={18} />
                        </button>

                        {/* Nút xoá */}
                        <button
                          onClick={() => handleOpenDeleteModal(device)}
                          disabled={loading}
                          className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300
                            hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition
                            disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Phân trang */}
      <Pagination
        totalItems={filteredDevices.length}
        pageSize={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* ===== MODAL THÊM/SỬA THIẾT BỊ ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 animate-slide-up"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {/* {editingDevice ? "Chỉnh sửa thiết bị" : "Thêm thiết bị mới"} */}
                {editingDevice ? t("devices:modal.editTitle") : t("devices:modal.addTitle")}
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

            {/* Modal Body - Form */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Trường tên thiết bị */}
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {/* Tên thiết bị <span className="text-red-500">*</span> */}
                    {t('devices:modal.fields.name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('devices:modal.placeholders.name') /* <span>VD: Máy chiếu Epson X123</span> */}
                    disabled={loading}
                    className="w-full px-4 py-2.5 text-base rounded-lg border border-gray-300 dark:border-gray-600
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    placeholder-gray-400 dark:placeholder-gray-500
                    focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200"
                    required
                  />
                </div>

                {/* Trường mô tả */}
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {/* Mô tả */}
                    {t('devices:modal.fields.description')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('devices:modal.placeholders.description') /* <span>VD: Máy chiếu full HD,...</span> */}
                    rows="3"
                    disabled={loading}
                    className="w-full px-4 py-2.5 text-base rounded-lg border border-gray-300 dark:border-gray-600
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    placeholder-gray-400 dark:placeholder-gray-500
                    focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200 resize-none"
                  />
                </div>

                {/* Trường trạng thái */}
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {/* Trạng thái <span className="text-red-500">*</span> */}
                    {t('devices:modal.fields.status')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    disabled={loading}
                    className="w-full px-4 py-2.5 text-base rounded-lg border border-gray-300 dark:border-gray-600
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200 cursor-pointer"
                    required
                  >
                    {/* <option value="AVAILABLE">Có sẵn</option>
                    <option value="UNDER_MAINTENANCE">Đang bảo trì</option> */}
                    <option value="AVAILABLE">{t('devices:modal.statusOptions.available')}</option>
                    <option value="UNDER_MAINTENANCE">{t('devices:modal.statusOptions.maintenance')}</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer - Nút hành động */}
              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-base bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
                    text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Hủy */}
                  {t("common:buttons.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-base
                    bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold 
                    transition-all duration-200 shadow-sm hover:shadow-md
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {/* <span>Đang xử lý...</span> */}
                      <span>{t('common:messages.processing')}</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      {/* {editingDevice ? "Cập nhật" : "Thêm mới"} */}
                      {editingDevice ? t("common:buttons.save") : t("common:buttons.add")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ===== MODAL XÁC NHẬN XÓA THIẾT BỊ ===== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 animate-slide-up"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {/* Xác nhận xóa */}
                  {t('devices:modal.deleteTitle')}
                </h2>
              </div>
              <button
                onClick={handleCloseDeleteModal}
                disabled={loading}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-base text-gray-700 dark:text-gray-300 mb-4">
                {/* Bạn có chắc chắn muốn xóa thiết bị này không? */}
                {t('devices:modal.deleteDesc')}
              </p>
              
              {/* Thông tin thiết bị sẽ bị xóa */}
              {deviceToDelete && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">
                        {deviceToDelete.name}
                      </p>
                      <p className="text-base text-gray-600 dark:text-gray-400">
                        {deviceToDelete.description || t('devices:table.noDescription')}
                      </p>
                    </div>
                    {getStatusBadge(deviceToDelete.status)}
                  </div>
                </div>
              )}
              
              {/* Cảnh báo */}
              <p className="text-base text-red-600 dark:text-red-400">
                {/* ⚠️ Hành động này không thể hoàn tác! */}
                {t('devices:modal.deleteWarning')}
              </p>
            </div>

            {/* Modal Footer - Nút hành động */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-base bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
                  text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Hủy */}
                {t('common:buttons.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-base
                  bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold
                  transition-all duration-200 shadow-sm hover:shadow-md
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {/* <span>Đang xóa...</span> */}
                    <span>{t('common:messages.processing')}</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    {/* Xóa thiết bị */}
                    {t('common:buttons.delete')}
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