import api from "../utils/api";
import dayjs from "dayjs";

export const getRooms = () => api.get("/rooms");

export const createRoom = (data) => api.post("/rooms", data);

export const updateRoom = (id, data) => api.put(`/rooms/${id}`, data);

export const deleteRoom = (id) => api.delete(`/rooms/${id}`);

export const getAvailableRooms = (params) =>
  api.get("/rooms/available", { params });

export const getAllRooms = () => {
  return api.get("/rooms");
};

/**
 * 🆕 LẤY DANH SÁCH CUỘC HỌP CỦA MỘT PHÒNG
 * API: GET /api/v1/rooms/{id}/meetings
 * Trả về: [{ id, title, startTime, endTime, organizerName }]
 */
export const getRoomMeetings = (roomId) => {
  const startTime = dayjs().startOf("day").toISOString();
  const endTime = dayjs().add(7, "day").endOf("day").toISOString();

  return api.get(`/rooms/${roomId}/meetings`, {
    params: {
      startTime: startTime,
      endTime: endTime,
    },
  });
};

