import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
// 👇 SỬA DÒNG NÀY: "../" thay vì "../../"
import { useAuth } from "../context/AuthContext";
import { FiEye, FiEyeOff, FiLogIn, FiGlobe, FiMail, FiLock } from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// 👇 SỬA DÒNG NÀY: "../" thay vì "../../"
import { loginWithSSO } from "../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Fix lỗi toast bị "nuốt" sau logout
  useEffect(() => {
    setUsername("");
    setPassword("");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Hàm login trong Context bây giờ sẽ trả về Role chuẩn từ API
      const realRoles = await login(username, password);

      toast.success("Đăng nhập thành công!", { autoClose: 1000 });

      setTimeout(() => {
        // Điều hướng dựa trên Role thật
        if (realRoles.includes("ROLE_ADMIN")) {
          navigate("/admin/dashboard");
        } else {
          navigate("/user/dashboard");
        }
      }, 1000);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Sai tài khoản hoặc mật khẩu. Vui lòng thử lại!";

      toast.error(msg, { autoClose: 2000 });
    }
  };

  // Xử lý đăng nhập SSO
  const handleSSOLogin = () => {
    try {
      loginWithSSO(); // Chuyển hướng sang Auth Service
    } catch (error) {
      toast.error("Không thể kết nối tới hệ thống SSO");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-200/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-200/20 rounded-full blur-[100px]"></div>
      </div>

      {/* Minh họa (Cột trái) */}
      <div className="hidden md:flex w-1/2 items-center justify-center p-10 z-10">
        <motion.img
          src="https://cdn.dribbble.com/userupload/20125976/file/original-667ec660862f67bdc1b849ddd5822829.gif"
          alt="Meeting illustration"
          className="w-4/5 max-w-2xl rounded-3xl shadow-2xl shadow-emerald-900/10 rotate-1 border-4 border-white/50 backdrop-blur-sm"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 0.8 }}
        />
      </div>

      {/* Form (Cột phải) */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-6 z-10">
        <motion.div
          className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl shadow-2xl p-8 md:p-12 rounded-3xl w-full max-w-md border border-white/50 dark:border-slate-700"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center justified-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 mb-4">
              <span className="text-2xl font-bold w-full text-center">6x6</span>
            </div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
              Meeting Management
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Chào mừng trở lại! Vui lòng đăng nhập.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                  <FiMail size={20} />
                </div>
                <input
                  type="text"
                  placeholder="name@example.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 text-gray-800 dark:text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                Mật khẩu
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                  <FiLock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 text-gray-800 dark:text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-0 h-full flex items-center px-1 text-gray-400 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <FiEye size={20} /> : <FiEyeOff size={20} />}
                </button>
              </div>

              <div className="text-right mt-2">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
            >
              <FiLogIn size={20} />
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </motion.button>
          </form>

          {/* --- PHẦN MỚI: NÚT SSO --- */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                  Hoặc tiếp tục với
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 mt-6">
              <motion.button
                type="button"
                onClick={handleSSOLogin}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white dark:bg-slate-700 text-gray-700 dark:text-white font-medium py-3 rounded-xl border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-3 shadow-sm group"
              >
                <div className="p-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 group-hover:bg-emerald-100 transition-colors">
                  <FiGlobe className="text-emerald-600 dark:text-emerald-400 text-lg" />
                </div>
                <span>SSO (Auth Service)</span>
              </motion.button>
            </div>
          </div>

          <p className="text-xs text-center text-gray-400 dark:text-slate-500 mt-10">
            © 2026 GREENPOWER JSC. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}