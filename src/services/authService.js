// src/services/authService.js
import api from "../utils/api";

// login dùng "username" theo Swagger
export const login = (username, password) => {
  return api.post("/auth/login", { username, password });
};

// Nếu backend dùng /register, /forgot-password
export const register = (data) => api.post("/auth/register", data);
export const forgotPassword = (data) => api.post("/auth/forgot-password", data);
export const resetPassword = (data) => api.post("/auth/reset-password", data);
export const changePassword = (oldPassword, newPassword) => {
  return api.post('/auth/change-password', { 
    oldPassword,
    newPassword
  });
};