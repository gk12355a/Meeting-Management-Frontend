// src/services/meetingService.js
import api from '../utils/api';

/**
 * Phản hồi một lời mời họp (Chấp nhận / Từ chối)
 * API: POST /api/v1/meetings/{id}/respond
 * @param {number} meetingId - ID của cuộc họp
 * @param {'ACCEPTED' | 'DECLINED'} status - Trạng thái phản hồi
 */
export const respondToMeeting = (meetingId, status) => {
  return api.post(`/meetings/${meetingId}/respond`, {
    status: status 
  });
};

/**
 * Lấy danh sách các cuộc họp của người dùng
 * API: GET /api/v1/meetings/my-meetings
 * @param {number} page - trang (tùy chọn)
 * @param {number} size - số phần tử mỗi trang (tùy chọn)
 */
export const getMyMeetings = (page = 0, size = 9000) => {
  return api.get("/meetings/my-meetings", { params: { page, size } });
};

/**
 * Lấy chi tiết một cuộc họp (chỉ người tham gia / tổ chức)
 * API: GET /api/v1/meetings/{id}
 * @param {number} meetingId - ID cuộc họp
 */
export const getMeetingById = (meetingId) => {
  return api.get(`/meetings/${meetingId}`);
};

/* Bổ sung các API phục vụ tạo cuộc họp */

/**
 * Tạo một cuộc họp mới
 * API: POST /api/v1/meetings
 * @param {Object} meetingData - dữ liệu cuộc họp
 */
export const createMeeting = (meetingData) => {
  return api.post("/meetings", meetingData);
};

/**
 * Lấy danh sách tất cả phòng họp (cho mọi user)
 * API: GET /api/v1/rooms
 */
export const getRooms = () => {
  return api.get("/rooms");
};

/**
 * Lấy danh sách tất cả thiết bị (cho mọi user)
 * API: GET /api/v1/devices
 */
export const getDevices = () => {
  return api.get("/devices");
};

/**
 * Lấy danh sách tất cả người dùng (Admin only)
 * API: GET /api/v1/admin/users
 * Dùng để chọn người tham gia cuộc họp (participantIds)
 */
export const getAllUsers = () => {
  return api.get("/admin/users");
};

/* Thêm các API cập nhật và xóa cuộc họp, cập nhật/hủy chuỗi recurring     */

// Cập nhật cuộc họp
export const updateMeeting = (meetingId, payload) => {
  return api.put(`/meetings/${meetingId}`, payload);
};

// Xóa/Hủy cuộc họp
export const deleteMeeting = (meetingId, payload) => {
  return api.delete(`/meetings/${meetingId}`, { data: payload });
};

// Cập nhật toàn bộ chuỗi lịch định kỳ
export const updateRecurringSeries = (seriesId, data) => {
  return api.put(`/meetings/series/${seriesId}`, data);
};

// Hủy toàn bộ chuỗi lịch định kỳ
export const deleteRecurringSeries = (seriesId, data) => {
   return api.delete(`/meetings/series/${seriesId}`, { data });
};
export const approveMeeting = (meetingId, approved, reason = null) => {
  return api.put(`/admin/meetings/${meetingId}/approval`, {
    approved, // true = Duyệt, false = Từ chối
    reason    // Bắt buộc nếu từ chối
  });
};

export const checkInWithQRCode = (qrCode) => {
  return api.post("/meetings/check-in/qr", { qrCode });
};