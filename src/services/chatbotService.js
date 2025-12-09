// src/services/chatbotService.js
import axios from "axios";
// Import URL từ file cấu hình chung
import { AI_SERVICE_URL } from "../utils/api"; 

export const chatbotService = {
  /**
   * Gửi tin nhắn đến Chatbot AI (Python Service)
   * @param {string} userMessage - Nội dung người dùng chat
   */
  sendMessage: async (userMessage) => {
    try {
      const token = localStorage.getItem("token");

      // Sử dụng axios trực tiếp để gọi sang URL khác (Port 8000)
      // thay vì dùng instance 'api' (Port 8080)
      const response = await axios.post(
        AI_SERVICE_URL, 
        { 
          message: userMessage 
        }, 
        {
          headers: {
            "Content-Type": "application/json",
            // Tự thêm token thủ công vì chúng ta không dùng interceptor của 'api'
            "Authorization": token ? `Bearer ${token}` : "", 
          }
        }
      );

      return response.data; // Trả về { reply: "..." }
    } catch (error) {
      console.error("Chatbot AI Error:", error);
      throw error;
    }
  },
};