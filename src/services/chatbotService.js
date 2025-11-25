import api from "../utils/api"; // Giả sử bạn đã có axios instance cấu hình sẵn (nếu chưa có, xem ghi chú bên dưới)

export const chatbotService = {
  /**
   * Gửi tin nhắn đến Chatbot Backend
   * @param {string} query - Câu hỏi của người dùng
   */
  sendMessage: async (query) => {
    try {
      // Gọi đến API Backend Java: /api/v1/chat/query
      const response = await api.post("/chat/query", { query });
      return response.data; // Trả về { reply: "..." }
    } catch (error) {
      console.error("Chatbot Error:", error);
      throw error;
    }
  },
};
