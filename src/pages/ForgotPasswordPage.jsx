import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../utils/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null); // Hiển thị thông báo

  // Gửi yêu cầu quên mật khẩu
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await api.post("/auth/forgot-password", {
        email: email,
      });
      setMessage(response.data);
    } catch (err) {
      setMessage("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-100">
      {/* Hình minh họa bên trái */}
      <div className="hidden md:flex w-1/2 items-center justify-center p-10">
        <motion.img
          src="https://cdn.dribbble.com/users/1162077/screenshots/3848914/programmer.gif"
          alt="Forgot password illustration"
          className="w-3/4 rounded-2xl shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        />
      </div>

      {/* Form bên phải */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-6">
        <motion.div
          className="bg-white shadow-2xl p-10 rounded-3xl w-full max-w-md border border-emerald-100"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-center mb-4 text-emerald-700">
            🔒 Quên Mật khẩu
          </h2>

          <p className="text-gray-600 text-center text-sm mb-8">
            Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.
          </p>

          {message ? (
            <div className="text-center text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg mb-4">
              {message}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileTap={{ scale: 0.97 }}
                className="w-full bg-emerald-600 text-white font-semibold py-3 mt-2 rounded-lg hover:bg-emerald-700 transition duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLoading ? "Đang gửi..." : "📩 Gửi link"}
              </motion.button>
            </form>
          )}

          <div className="text-center mt-4">
            <Link
              to="/login"
              className="text-sm text-emerald-600 hover:text-emerald-800 hover:underline"
            >
              ← Quay lại Đăng nhập
            </Link>
          </div>

          <p className="text-sm text-gray-500 text-center mt-4">
            © 2025 CMC Global - Meeting Management
          </p>
        </motion.div>
      </div>
    </div>
  );
}
