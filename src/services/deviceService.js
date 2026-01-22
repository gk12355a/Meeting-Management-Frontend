//deviceSevice.js
import api from "../utils/api";

export const getDevices = () => api.get("/devices");
export const createDevice = (data) => {
  if (data instanceof FormData) {
    return api.post("/devices", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return api.post("/devices", data);
};

export const updateDevice = (id, data) => {
  if (data instanceof FormData) {
    return api.put(`/devices/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return api.put(`/devices/${id}`, data);
};
export const deleteDevice = (id) => api.delete(`/devices/${id}`);
export const getAvailableDevices = (startTime, endTime) => {
  return api.get('/devices/available', {
    params: { 
      startTime, 
      endTime 
    }
  });
};