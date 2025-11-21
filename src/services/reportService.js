import api from "../utils/api";

export const getRoomUsageReport = (from, to, format) =>
  api.get("/reports/room-usage", { params: { from, to, format } });

export const getCancelStats = (from, to, format) =>
  api.get("/reports/cancelation-stats", { params: { from, to, format } });

export const getAllMeetings = (page = 0, size = 1000) => {
  // Lấy 1000 cuộc họp để đảm bảo lịch hiển thị đủ
  return api.get('/reports/all-meetings', {
    params: {
      page,
      size,
      sort: 'startTime,desc' // Sắp xếp theo mới nhất
    }
  });
};

export const getVisitorReport = (date) => {
  return api.get('/reports/visitors', {
    params: { date }
  });
};

// Tải Excel từ backend
export const downloadRoomUsageExcel = (from, to) =>
  api.get("/reports/room-usage", {
    params: { from, to, format: "excel" },
    responseType: "blob", // rất quan trọng
  });

export const downloadCancelStatsExcel = (from, to) =>
  api.get("/reports/cancelation-stats", {
    params: { from, to, format: "excel" },
    responseType: "blob", // rất quan trọng
  });