import api from "../utils/api"; // Import axios instance đã cấu hình Token

export const sendChatMessage = async (message) => {
  try {
    // Gọi đúng endpoint mà bạn đã test thành công trên Swagger
    // Lưu ý: Nếu Backend nhận String trần (text/plain), bạn gửi object { query: ... } có thể lỗi
    // Dưới đây là gửi text trực tiếp (nếu Backend nhận @RequestBody String)

    // Cách 1: Nếu Backend nhận String
    const response = await api.post("/api/v1/chat/query", message, {
      headers: { "Content-Type": "text/plain" },
    });

    // Cách 2: Nếu Backend nhận JSON object (ChatRequest)
    /*
        const response = await api.post('/api/v1/chat/query', {
            query: message
        });
        */

    // Kiểm tra xem Backend trả về object { message: "..." } hay string
    return response.data;
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};
