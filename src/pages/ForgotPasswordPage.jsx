import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../utils/api";
import { FiMail, FiArrowLeft, FiLock, FiSend, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null); // Hiển thị thông báo thành công hoặc chuỗi thông báo từ BE
  const [error, setError] = useState(null); // Hiển thị lỗi

  // Gửi yêu cầu quên mật khẩu
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await api.post("/auth/forgot-password", {
        email: email.trim(),
      });
      // Giả sử BE trả về string message trực tiếp hoặc object {message: "..."}
      setMessage(response.data?.message || response.data || "Link đặt lại mật khẩu đã được gửi!");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Không thể gửi yêu cầu. Vui lòng kiểm tra lại email.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-200/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-200/20 rounded-full blur-[100px]"></div>
      </div>

      {/* CỘT TRÁI: ẢNH MINH HỌA */}
      <div className="hidden md:flex w-1/2 items-center justify-center p-10 z-10">
        <motion.img
          src="https://cdn.dribbble.com/userupload/20125976/file/original-667ec660862f67bdc1b849ddd5822829.gif"
          alt="Forgot password illustration"
          className="w-4/5 max-w-2xl rounded-3xl shadow-2xl shadow-emerald-900/10 rotate-1 border-4 border-white/50 backdrop-blur-sm"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 0.8 }}
        />
      </div>

      {/* CỘT PHẢI: FORM */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-6 z-10">
        <motion.div
          className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl shadow-2xl p-8 md:p-12 rounded-3xl w-full max-w-md border border-white/50 dark:border-slate-700"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 mb-4">
              <span className="text-xl font-bold">6x6</span>
            </div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
              Quên Mật Khẩu?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              Đừng lo, hãy nhập email để khôi phục tài khoản.
            </p>
          </div>

          {/* VIEW: THÀNH CÔNG */}
          {message ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-6 rounded-2xl"
            >
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Đã gửi yêu cầu!</h3>
              <p className="text-emerald-700 dark:text-emerald-300 text-sm mb-6">
                {message}
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors"
              >
                <FiArrowLeft /> Quay lại đăng nhập
              </Link>
            </motion.div>
          ) : (
            /* VIEW: FORM */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Alert Error */}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4 rounded-xl text-red-600 dark:text-red-300 text-sm">
                  <FiAlertCircle className="shrink-0 mt-0.5" size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                  Email đã đăng ký
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                    <FiMail size={20} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 text-gray-800 dark:text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <FiSend size={18} />
                    <span>Gửi liên kết xác nhận</span>
                  </>
                )}
              </motion.button>

              <div className="text-center mt-6">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors font-medium"
                >
                  <FiArrowLeft /> Quay lại Đăng nhập
                </Link>
              </div>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-center text-gray-400 dark:text-slate-500">
              © 2026 GREENPOWER JSC. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
