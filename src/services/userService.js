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
 * TẠO NGƯỜI DÙNG MỚI (Bởi Admin)
 * (ĐÃ SỬA LỖI: Trỏ đến /admin/users)
 *
 * API này không cần mật khẩu. Backend sẽ tự tạo và gửi email.
 * @param {object} data - { fullName, username, roles }
 */
/**
 * TẠO NGƯỜI DÙNG MỚI (Bởi Admin)
 * URL: /admin/users
 * Content-Type: multipart/form-data
 * Parts:
 *   - request: JSON string { fullName, username, password, roles }
 *   - avatar: File (optional)
 */
export const createUser = (data) => {
  const formData = new FormData();
  const { avatar, ...userData } = data;

  // 'request' part as JSON
  formData.append(
    "request",
    new Blob([JSON.stringify(userData)], { type: "application/json" })
  );

  // 'avatar' part if exists
  if (avatar instanceof File) {
    formData.append("avatar", avatar);
  }

  return api.post("/admin/users", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Cập nhật thông tin người dùng
 */
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data);

/**
 * Xóa người dùng
 */
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

/**
 * Tìm kiếm người dùng theo tên hoặc email
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
 * URL: /users/profile
 * Content-Type: multipart/form-data
 * Parts:
 *   - request: JSON string { fullName }
 *   - avatar: File (optional)
 */
export const updateMyProfile = (data) => {
  const formData = new FormData();
  const { avatar, ...profileData } = data;

  formData.append(
    "request",
    new Blob([JSON.stringify(profileData)], { type: "application/json" })
  );

  if (avatar instanceof File) {
    formData.append("avatar", avatar);
  }

  return api.put('/users/profile', formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
