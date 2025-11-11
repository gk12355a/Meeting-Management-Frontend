// src/pages/ForgotPasswordPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api"; // Import Axios

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null); // Để hiển thị thông báo

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await api.post("/auth/forgot-password", {
        email: email,
      });
      setMessage(response.data); // (Hiển thị: "Nếu email tồn tại...")
    } catch (err) {
      setMessage("Đã xảy ra lỗi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-6">
          Quên Mật khẩu
        </h1>

        {message ? (
          <div className="text-green-700 text-center p-4">{message}</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-gray-600 text-sm text-center">
              Nhập email, chúng tôi sẽ gửi link đặt lại mật khẩu.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-blue-600 text-white px-3 py-3 font-semibold"
            >
              {isLoading ? "Đang gửi..." : "Gửi link"}
            </button>
          </form>
        )}
        <div className="text-sm text-center mt-4">
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
