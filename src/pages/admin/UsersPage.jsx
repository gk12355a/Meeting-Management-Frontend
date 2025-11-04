// src/pages/admin/UsersPage.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiEdit2, FiTrash2, FiPlus, FiX, FiAlertCircle } from "react-icons/fi";
import api from "../../utils/api";

// Modal Component
const Modal = ({ children, isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Alert Component
const Alert = ({ type = "error", message, onClose }) => {
  const styles = {
    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300",
    success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${styles[type]} mb-4`}
    >
      <FiAlertCircle className="flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm">{message}</p>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0 hover:opacity-70">
          <FiX />
        </button>
      )}
    </motion.div>
  );
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ 
    username: "",
    password: "",
    fullName: "",
    roles: ["ROLE_USER"], 
    isActive: true 
  });

  // ========== 1. LẤY DANH SÁCH USER (US-19) ==========
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // API: GET /api/v1/admin/users
      const response = await api.get("/admin/users");
      
      setUsers(response.data);
      console.log("✅ Đã tải danh sách users:", response.data);
    } catch (err) {
      console.error("❌ Lỗi khi tải users:", err);
      
      if (err.response?.status === 403) {
        setError("Bạn không có quyền truy cập. Vui lòng đăng nhập với tài khoản Admin.");
      } else if (err.response?.status === 401) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      } else {
        setError(err.response?.data?.message || "Không thể tải danh sách người dùng.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ========== 2. TẠO USER MỚI (US-18) ==========
  const handleCreateUser = async (userData) => {
    try {
      setSubmitting(true);
      setError(null);
      
      // API: POST /api/v1/auth/register
      // Body: {"username": "user.moi@cmc.com", "password": "password123", "fullName": "User Moi"}
      const response = await api.post("/auth/register", {
        username: userData.username,
        password: userData.password,
        fullName: userData.fullName,
      });
      
      console.log("✅ User mới đã được tạo:", response.data);
      
      // Nếu cần cập nhật roles ngay sau khi tạo (nếu khác ROLE_USER)
      if (userData.roles.length > 0 && !userData.roles.includes('ROLE_USER')) {
        // Giả sử API trả về user ID, cập nhật roles
        if (response.data.id) {
          await handleUpdateUser(response.data.id, {
            roles: userData.roles,
            isActive: userData.isActive,
          });
        }
      }
      
      // Refresh danh sách users
      await fetchUsers();
      
      setSuccess("✅ Tạo người dùng mới thành công!");
      closeModal();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("❌ Lỗi khi tạo user:", err);
      
      if (err.response?.status === 409) {
        setError("Email/Username đã tồn tại trong hệ thống.");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || "Dữ liệu không hợp lệ.");
      } else {
        setError(err.response?.data?.message || "Lỗi khi tạo người dùng mới.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ========== 3. CẬP NHẬT USER (US-18) ==========
  const handleUpdateUser = async (userId, updateData) => {
    try {
      setSubmitting(true);
      setError(null);
      
      // API: PUT /api/v1/admin/users/{id}
      // Body: {"roles": ["ROLE_USER"], "isActive": false}
      const response = await api.put(`/admin/users/${userId}`, updateData);
      
      // Cập nhật state
      setUsers(users.map(u => u.id === userId ? response.data : u));
      
      setSuccess("✅ Cập nhật thông tin người dùng thành công!");
      console.log("✅ User đã cập nhật:", response.data);
      
      closeModal();
      
      // Tự động ẩn thông báo sau 3s
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật user:", err);
      
      if (err.response?.status === 403) {
        setError("Bạn không có quyền thực hiện thao tác này.");
      } else if (err.response?.status === 404) {
        setError("Không tìm thấy người dùng.");
      } else {
        setError(err.response?.data?.message || "Lỗi khi cập nhật người dùng.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ========== 3. XÓA USER (Nếu có API DELETE) ==========
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;
    
    try {
      setError(null);
      
      // API: DELETE /api/v1/admin/users/{id} (nếu backend có)
      await api.delete(`/admin/users/${userId}`);
      
      // Cập nhật state
      setUsers(users.filter(u => u.id !== userId));
      
      setSuccess("✅ Đã xóa người dùng thành công!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("❌ Lỗi khi xóa user:", err);
      
      if (err.response?.status === 403) {
        setError("Bạn không có quyền xóa người dùng.");
      } else if (err.response?.status === 404) {
        setError("Không tìm thấy người dùng.");
      } else {
        setError(err.response?.data?.message || "Lỗi khi xóa người dùng.");
      }
    }
  };

  // ========== 4. XỬ LÝ FORM SUBMIT ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!formData.roles || formData.roles.length === 0) {
      setError("Vui lòng chọn ít nhất một quyền cho người dùng.");
      return;
    }

    if (!editingUser) {
      // TẠO USER MỚI
      if (!formData.username || !formData.password || !formData.fullName) {
        setError("Vui lòng điền đầy đủ thông tin.");
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.username)) {
        setError("Email không hợp lệ.");
        return;
      }
      
      // Validate password length
      if (formData.password.length < 6) {
        setError("Mật khẩu phải có ít nhất 6 ký tự.");
        return;
      }

      await handleCreateUser({
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        roles: formData.roles,
        isActive: formData.isActive,
      });
    } else {
      // CẬP NHẬT USER
      await handleUpdateUser(editingUser.id, {
        roles: formData.roles,
        isActive: formData.isActive,
      });
    }
  };

  // ========== 5. MỞ/ĐÓNG MODAL ==========
  const openModal = (user = null) => {
    if (user) {
      // EDIT MODE
      setEditingUser(user);
      setFormData({ 
        username: "",
        password: "",
        fullName: "",
        roles: user.roles || ["ROLE_USER"], 
        isActive: user.isActive ?? true
      });
    } else {
      // CREATE MODE
      setEditingUser(null);
      setFormData({ 
        username: "",
        password: "",
        fullName: "",
        roles: ["ROLE_USER"], 
        isActive: true
      });
    }
    setIsModalOpen(true);
    setError(null);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setError(null);
  };

  // ========== 6. RENDER ==========
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            Quản lý Người dùng
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tổng số: {users.length} người dùng
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
        >
          <FiPlus />
          Thêm mới
        </button>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Họ Tên
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email (Username)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Quyền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  Không có dữ liệu người dùng
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    #{user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.fullName || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.map((role, idx) => (
                        <span 
                          key={idx}
                          className={`px-2 py-1 rounded-full text-xs font-medium
                            ${role === 'ROLE_ADMIN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 
                              role === 'ROLE_VIP' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}
                        >
                          {role.replace('ROLE_', '')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${user.isActive 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                    >
                      {user.isActive ? '✓ Hoạt động' : '✕ Vô hiệu hóa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => openModal(user)} 
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition"
                        title="Chỉnh sửa"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)} 
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition"
                        title="Xóa"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Edit User */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingUser ? "Cập nhật thông tin người dùng" : "Tạo người dùng mới"}
            </h3>
            <button 
              onClick={closeModal} 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              <FiX size={20} />
            </button>
          </div>

          {error && <Alert type="error" message={error} />}

          <form onSubmit={handleSubmit}>
            {/* Thông tin user - Chỉ hiển thị khi EDIT */}
            {editingUser && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-900 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold">
                    {editingUser.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {editingUser.fullName || "N/A"}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {editingUser.username}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form tạo mới - Chỉ hiển thị khi CREATE */}
            {!editingUser && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Họ và Tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email (Username) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="user@cmc.com"
                    className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={6}
                  />
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    Mật khẩu phải có ít nhất 6 ký tự
                  </p>
                </div>
              </>
            )}

            {/* Roles Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quyền (Roles) <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {['ROLE_USER', 'ROLE_ADMIN', 'ROLE_VIP'].map((role) => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.roles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, roles: [...formData.roles, role] });
                        } else {
                          setFormData({ ...formData, roles: formData.roles.filter(r => r !== role) });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {role.replace('ROLE_', '')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Status Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trạng thái <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.isActive ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="true">✓ Hoạt động</option>
                <option value="false">✕ Vô hiệu hóa</option>
              </select>
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {formData.isActive 
                  ? 'Người dùng có thể đăng nhập và sử dụng hệ thống' 
                  : 'Người dùng sẽ không thể đăng nhập vào hệ thống'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 transition disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Đang lưu...
                  </>
                ) : (
                  editingUser ? 'Cập nhật' : 'Tạo mới'
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}