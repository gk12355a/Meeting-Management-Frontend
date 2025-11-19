import api from "../utils/api";

/**
 * 🧍‍♂️ Lấy toàn bộ người dùng
 */
export const getAllUsers = () => api.get("/admin/users");

/**
 * 🧍‍♂️ Lấy người dùng theo ID
 */
export const getUserById = (id) => api.get(`/admin/users/${id}`);

/**
 * 🆕 TẠO NGƯỜI DÙNG MỚI (Bởi Admin)
 * (ĐÃ SỬA LỖI: Trỏ đến /admin/users)
 *
 * API này không cần mật khẩu. Backend sẽ tự tạo và gửi email.
 * @param {object} data - { fullName, username, roles }
 */
export const createUser = (data) => {
  // Sửa từ "/auth/register" thành "/admin/users"
  return api.post("/admin/users", data);
};

/**
 * ✏️ Cập nhật thông tin người dùng
 */
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data);

/**
 * ❌ Xóa người dùng
 */
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

/**
 * 🔍 Tìm kiếm người dùng theo tên hoặc email
 * @param {string} keyword - từ khóa tìm kiếm (ví dụ: "anh", "khoa", "nguyen@...")
 */
export const searchUsers = (query) => {
  return api.get(`/users/search`, { params: { query } });
};

/**
 * Lấy thông tin profile của tôi
 */
export const getMyProfile = () => {
  return api.get('/users/profile'); 
};

/**
 * Cập nhật thông tin profile của tôi
 * @param {object} profileData - { fullName: "Tên Mới" }
 */
export const updateMyProfile = (profileData) => {
  return api.put('/users/profile', profileData);
};