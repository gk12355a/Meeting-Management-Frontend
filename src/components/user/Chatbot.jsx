// src/components/user/Chatbot.jsx
import React, { useState, useRef, useEffect } from "react";
import { chatbotService } from "../../services/chatbotService";
import { FaRobot, FaPaperPlane, FaMinus, FaUser } from "react-icons/fa";
import ReactMarkdown from "react-markdown";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Chào bạn! Tôi là trợ lý AI của MeetFlow, giúp bạn đặt lịch họp và quản lý cuộc họp dễ dàng hơn. Tôi có thể hỗ trợ gì cho bạn?",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

    // Tự động cuộn xuống
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Gửi tin nhắn
  const handleInputChange = (e) => {
    setInput(e.target.value);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  const handleSend = async (e, manualText = null) => {
    if (e) e.preventDefault();
    
    const textToSend = manualText || input;
    if (!textToSend.trim()) return;

    const userMessage = { id: Date.now(), text: textToSend, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      // Gọi API sang Python Service
      const data = await chatbotService.sendMessage(textToSend);

      const botMessage = {
        id: Date.now() + 1,
        text: data.reply,
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "⚠️ **Lỗi kết nối AI:** Hệ thống đang bận hoặc token hết hạn. Vui lòng đăng nhập lại hoặc thử sau.",
        sender: "bot",
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Các câu hỏi gợi ý 
  const suggestedQuestions = [
    "Tìm phòng trống chiều nay",
    "Lịch họp của tôi hôm nay",
    "Quy định hủy phòng là gì?",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end">
      {/* CỬA SỔ CHAT */}
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden animate-fade-in-up font-sans">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                <FaRobot className="text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Trợ lý AI</h3>
                <span className="text-[10px] text-blue-100 flex items-center gap-1 opacity-90">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  Sẵn sàng hỗ trợ
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
            >
              <FaMinus size={12} />
            </button>
          </div>

          {/* Nội dung tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4 scroll-smooth">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "bot" && (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 mt-1 shrink-0 text-indigo-600">
                    <FaRobot size={12} />
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm break-words overflow-hidden ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : `bg-white text-gray-800 border border-gray-200 rounded-bl-none ${msg.isError ? "border-red-200 bg-red-50 text-red-800" : ""}`
                  }`}
                >
                  {msg.sender === "bot" ? (
                    // Render Markdown cho tin nhắn của Bot
                    <div className="markdown-body prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>

                {msg.sender === "user" && (
                   <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center ml-2 mt-1 shrink-0 text-blue-600">
                     <FaUser size={10} />
                   </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start items-center gap-2">
                 <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <FaRobot size={12} />
                  </div>
                <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-gray-200 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Gợi ý câu hỏi */}
          {!isLoading && messages.length < 5 && (
             <div className="px-4 pb-2 bg-gray-50 flex gap-2 overflow-x-auto no-scrollbar">
                {suggestedQuestions.map((q, idx) => (
                   <button 
                      key={idx}
                      onClick={() => handleSend(null, q)}
                      className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-blue-50 transition-colors"
                   >
                      {q}
                   </button>
                ))}
             </div>
          )}

          {/* Input Area */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-gray-100 flex gap-2 items-end"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              placeholder="Nhập yêu cầu (vd: đặt phòng...)"
              className="flex-1 px-4 py-2.5 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 transition-all placeholder:text-gray-400 resize-none min-h-[40px] max-h-[120px] overflow-y-auto"
              disabled={isLoading}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95 shrink-0"
            >
              <FaPaperPlane className="text-sm ml-0.5" />
            </button>
          </form>
        </div>
      )}

      {/* NÚT TRÒN MỞ CHAT */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-4 rounded-full shadow-xl transition-all hover:scale-110 flex items-center justify-center group z-50"
        >
          <FaRobot className="text-2xl animate-bounce-slow" />
          
          {/* Badge thông báo */}
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>

          {/* Tooltip */}
          <span className="absolute right-full mr-4 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all translate-x-2 group-hover:translate-x-0 shadow-lg">
            Hỏi AI Chatbot
            <div className="absolute top-1/2 -right-1 w-2 h-2 bg-gray-900 rotate-45 -translate-y-1/2"></div>
          </span>
        </button>
      )}

      {/* Markdown */}
      <style>{`
        .markdown-body ul { list-style-type: disc; padding-left: 1.5em; margin: 0.5em 0; }
        .markdown-body ol { list-style-type: decimal; padding-left: 1.5em; margin: 0.5em 0; }
        .markdown-body p { margin: 0.5em 0; }
        .markdown-body strong { font-weight: 600; color: #1e40af; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Chatbot;