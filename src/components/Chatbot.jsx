import React, { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../services/chatService";
import "./Chatbot.css"; // Chúng ta sẽ tạo file css ở bước 3

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Xin chào! Tôi có thể giúp gì cho bạn? (Ví dụ: Đặt phòng A lúc 9h sáng mai)",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;

    // 1. Hiển thị tin nhắn người dùng ngay lập tức
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      // 2. Gọi API Backend
      const responseData = await sendChatMessage(userMessage);

      // 3. Hiển thị phản hồi từ Bot
      // Lưu ý: responseData có thể là String hoặc Object {message: "..."} tùy Backend trả về
      const botText =
        typeof responseData === "object" ? responseData.message : responseData;

      setMessages((prev) => [...prev, { sender: "bot", text: botText }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "❌ Lỗi kết nối. Vui lòng thử lại." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="chatbot-container">
      {/* Nút mở chat */}
      {!isOpen && (
        <button className="chatbot-toggle-btn" onClick={() => setIsOpen(true)}>
          💬 Skibidi_kun
        </button>
      )}

      {/* Cửa sổ chat */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>Skibidi_kun</span>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <div className="message-content">
                  {/* Hiển thị xuống dòng nếu có */}
                  {msg.text.split("\n").map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <div className="message-content">Đang nhập...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập yêu cầu..."
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading}>
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
