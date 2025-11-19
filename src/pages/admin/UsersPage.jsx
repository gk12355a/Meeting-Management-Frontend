import { useEffect, useState } from "react";
import {
  getAllUsers,
  updateUser,
  createUser,
  deleteUser,
} from "../../services/userService";
import { toast } from "react-toastify";
import { FiUsers, FiPlus, FiTrash2, FiEdit2, FiSearch } from "react-icons/fi";
import { motion } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import Pagination from "../../components/Pagination";
/* Tuỳ chỉnh màu cho Toast theo theme */
const toastColors = {
  success: "#079830ff", // xanh ngọc dịu
  error: "#ef4444", // đỏ ấm
  warning: "#e4650aff", // vàng dịu
  info: "#3b82f6", // xanh dương nhạt
};

const setToastTheme = () => {
  const root = document.documentElement;
  root.style.setProperty("--toastify-color-success", toastColors.success);
  root.style.setProperty("--toastify-color-error", toastColors.error);
  root.style.setProperty("--toastify-color-warning", toastColors.warning);
  root.style.setProperty("--toastify-color-info", toastColors.info);
};
setToastTheme();

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Tìm kiếm / lọc
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal thêm
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: "",
    username: "",
    role: "ROLE_USER",
  });

  // Modal sửa
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  /* Lấy danh sách người dùng */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAllUsers();
      let data = Array.isArray(res.data) ? res.data : res.data.data || [];
      // Sắp xếp giảm dần theo id
      data = [...data].sort((a, b) => (b.id || 0) - (a.id || 0));
      setUsers(data);
    } catch (err) {
      console.error("Lỗi khi tải danh sách:", err);
      toast.error("Không thể tải danh sách người dùng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* Kiểm tra dữ liệu nhập */
  const validateUserInput = () => {
    if (!newUser.fullName.trim() || !newUser.username.trim()) {
      toast.warning("Vui lòng điền đầy đủ Họ tên và Email!");
      return false;
    }
    return true;
  };

  /* Tạo người dùng mới */
  const handleCreateUser = async () => {
    if (!validateUserInput()) return;

    try {
      setCreating(true);
      const payload = {
        username: newUser.username,
        fullName: newUser.fullName,
        roles: [newUser.role],
      };

      const res = await createUser(payload);
      toast.success("Tạo người dùng thành công! Mật khẩu đã được gửi qua email.");
      setNewUser({
        fullName: "",
        username: "",
        role: "ROLE_USER",
      });
      setShowAddModal(false);
      fetchUsers();
      let createdUser = res.data;
      if (createdUser && createdUser.data) createdUser = createdUser.data;
      createdUser = {
        ...createdUser,
        roles: createdUser.roles || [payload.roles[0]],
        active:
          typeof createdUser.active === "boolean"
            ? createdUser.active
            : true,
      };
      setUsers((prev) => [{ ...createdUser }, ...prev]);
    } catch (err) {
      console.error("Lỗi tạo người dùng:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.username ||
        err.response?.data?.fullName ||
        "Không thể tạo người dùng!";

      if (
        msg.toLowerCase().includes("exists") ||
        msg.toLowerCase().includes("duplicate") ||
        msg.toLowerCase().includes("đã được sử dụng")
      ) {
        toast.warning("Email (username) này đã tồn tại!");
      } else {
        toast.error(" " + msg);
      }
    } finally {
      setCreating(false);
    }
  };

  /* Mở modal cập nhật quyền/trạng thái */
  const openEditModal = (user) => {
    setSelectedUser({
      ...user,
      role: user.roles?.[0] || "ROLE_USER",
      active: user.active,
    });
    setShowEditModal(true);
  };

  /* Cập nhật quyền + trạng thái */
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      await updateUser(selectedUser.id, {
        roles: [selectedUser.role],
        isActive: selectedUser.active,
      });
      toast.success("Cập nhật quyền/trạng thái thành công!");
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Lỗi cập nhật người dùng:", err);
      toast.error("Không thể cập nhật quyền/trạng thái!");
    }
  };

  /* Xoá người dùng – giữ nguyên logic toast confirm */
  const handleDeleteUser = async (id) => {
    if (!id) {
      toast.error("Không xác định được ID người dùng!");
      return;
    }

    const isDark = document.documentElement.classList.contains("dark");

    toast.info(
      <div className="p-5 text-center select-none">
        <div className="flex justify-center items-center gap-3 mb-3">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              isDark ? "bg-blue-900" : "bg-blue-100"
            }`}
          >
            <FiTrash2
              className={`text-xl ${
                isDark ? "text-blue-300" : "text-blue-600"
              }`}
            />
          </div>
          <h3
            className={`text-lg font-semibold ${
              isDark ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Xác nhận xoá người dùng?
          </h3>
        </div>
        <div className="flex justify-center gap-4 mt-5">
          <button
            onClick={async () => {
              try {
                await deleteUser(id);
                toast.dismiss();
                toast.success("Đã xoá người dùng!");
                setUsers((prev) => prev.filter((u) => u.id !== id));
              } catch (err) {
                console.error("Lỗi khi xoá:", err.response?.data || err);
                toast.dismiss();
                toast.error(
                  err.response?.data?.message ||
                  "Không thể xoá người dùng! Có thể do quyền hoặc ràng buộc dữ liệu."
                );
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
          >
            Xoá
          </button>
          <button
            onClick={() => toast.dismiss()}
            className={`font-semibold px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 ${
              isDark
                ? "bg-gray-700 hover:bg-gray-600 text-gray-100"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            Huỷ
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        position: "top-center",
        style: {
          background: isDark ? "#1e293b" : "#ffffff",
          color: isDark ? "#e2e8f0" : "#1f2937",
          borderRadius: "14px",
          boxShadow: isDark
            ? "0 6px 25px rgba(0,0,0,0.45)"
            : "0 6px 20px rgba(0,0,0,0.15)",
          minWidth: "360px",
        },
        icon: false,
      }
    );
  };

  // Filter users to show
  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      !term ||
      user.fullName?.toLowerCase().includes(term) ||
      user.username?.toLowerCase().includes(term);

    const matchStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? user.active
        : !user.active;

    return matchSearch && matchStatus;
  });

  // Pagination logic
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + pageSize
  );
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  return (
    <div className="p-8 min-h-screen transition-colors bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-2">
          <FiUsers className="text-3xl text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Quản lý người dùng
          </h1>
        </div>
      </motion.div>

      {/* Thanh tìm kiếm + lọc + nút thêm */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 mb-7 border border-gray-100 dark:border-gray-700 transition flex flex-col md:flex-row gap-4 items-center"
      >
        {/* Ô tìm kiếm */}
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
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
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Vô hiệu hoá</option>
        </select>
        {/* Nút thêm người dùng */}
        <button
          onClick={() => setShowAddModal(true)}
          disabled={creating}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-base
              disabled:bg-blue-400 disabled:cursor-not-allowed
              text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <FiPlus size={20} />
          Thêm người dùng
        </button>
      </motion.div>

      {/* Thống kê người dùng */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
        {/* Tổng số người dùng */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow transition">
          <div className="text-gray-500 dark:text-gray-400 text-base mb-0.5">
            Tổng số người dùng
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {users.length}
          </div>
        </div>
        {/* Số đang hoạt động */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800 shadow transition">
          <div className="text-green-700 dark:text-green-400 text-base mb-0.5">Đang hoạt động</div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-200">
            {users.filter((u) => u.active).length}
          </div>
        </div>
        {/* Số vô hiệu hoá */}
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800 shadow transition">
          <div className="text-orange-700 dark:text-orange-400 text-base mb-0.5">Vô hiệu hoá</div>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-100">
            {users.filter((u) => !u.active).length}
          </div>
        </div>
      </div>

      {/* TABLE - DANH SÁCH NGƯỜI DÙNG */}
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
                <th className="p-4 text-base font-semibold w-16 text-center">STT</th>
                <th className="p-4 text-base font-semibold">Họ và tên</th>
                <th className="p-4 text-base font-semibold">Email</th>
                <th className="p-4 text-base font-semibold text-center">Trạng thái</th>
                <th className="p-4 text-base font-semibold text-center">Hành động</th>
              </tr>
            </thead>
            {/* Table body */}
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-base">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-500 dark:text-gray-400">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <FiSearch size={48} className="text-gray-300 dark:text-gray-600" />
                      <p className="text-lg font-semibold">Không có người dùng nào</p>
                      <p className="text-base">Hệ thống chưa có dữ liệu người dùng</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <FiSearch size={48} className="text-gray-300 dark:text-gray-600" />
                      <p className="text-lg font-semibold">Không tìm thấy người dùng nào</p>
                      <p className="text-base">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, idx) => {
                  const roleCode = user.roles?.[0] || "ROLE_USER";
                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.025 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <td className="p-4 font-semibold text-center">
                        {startIndex + idx + 1}
                      </td>
                      <td className="p-4 font-medium text-gray-900 dark:text-white">{user.fullName}</td>
                      <td className="p-4 text-gray-700 dark:text-gray-300">{user.username}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          roleCode === "ROLE_ADMIN"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100"
                            : "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100"
                        }`}>
                          {roleCode === "ROLE_ADMIN" ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          user.active
                            ? "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100"
                            : "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100"
                        }`}>
                          {user.active ? "Đang hoạt động" : "Vô hiệu"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Nút chỉnh sửa */}
                          <button
                            onClick={() => openEditModal(user)}
                            disabled={loading}
                            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300
                              hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md transition
                              disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Cập nhật quyền / trạng thái"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          {/* Nút xóa */}
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={loading}
                            className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300
                              hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition
                              disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Xóa người dùng"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Phân trang */}
      <Pagination
        totalItems={filteredUsers.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* MODAL THÊM NGƯỜI DÙNG */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 animate-slide-up"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Thêm người dùng mới
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                disabled={creating}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ×
              </button>
            </div>
            {/* Modal Body - Form */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Họ và tên */}
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.fullName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, fullName: e.target.value })
                    }
                    placeholder="VD: Nguyễn Văn A"
                    disabled={creating}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-gray-900
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent
                      transition-all duration-200 text-base"
                  />
                </div>
                {/* Tên người dùng */}
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser({ ...newUser, username: e.target.value })
                    }
                    placeholder="VD: admin@gmail.com"
                    disabled={creating}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-gray-900
                      placeholder-gray-400 dark:placeholder-gray-500
                      focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent
                      transition-all duration-200 text-base"
                  />
                </div>
                {/* Vai trò */}
                {/* <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vai trò <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value })
                    }
                    disabled={creating}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-gray-900
                        focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent
                        transition-all duration-200 text-base"
                  >
                    <option value="ROLE_USER">User</option>
                    <option value="ROLE_ADMIN">Admin</option>
                  </select>
                </div> */}
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={creating}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={creating}
                  className={`px-4 py-2 rounded-lg font-semibold text-white shadow-md active:scale-95 transition ${
                    creating
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {creating ? "Đang thêm..." : "Thêm"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL SỬA NGƯỜI DÙNG */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 animate-slide-up"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Cập nhật quyền / trạng thái
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                ×
              </button>
            </div>
            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-4">
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {selectedUser.fullName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedUser.username}
                </p>
              </div>
              <div className="space-y-4">
                {/* Trạng thái */}
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={selectedUser.active ? "active" : "inactive"}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        active: e.target.value === "active",
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-gray-900
                      focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-400 focus:border-transparent
                      transition-all duration-200 text-base"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Vô hiệu</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleUpdateUser}
                  className="px-4 py-2 rounded-lg font-semibold text-white shadow-md active:scale-95 transition bg-blue-600 hover:bg-blue-700"
                >
                  Lưu
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}