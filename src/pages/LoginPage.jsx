import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiEye, FiEyeOff, FiLogIn } from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 🟢 Fix lỗi toast bị "nuốt" sau logout
  useEffect(() => {
    setUsername("");
    setPassword("");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const roles = await login(username, password);

      toast.success("Đăng nhập thành công!", { autoClose: 1000 });

      setTimeout(() => {
        if (roles.includes("ROLE_ADMIN")) navigate("/admin/dashboard");
        else navigate("/user/dashboard");
      }, 1000);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Sai tài khoản hoặc mật khẩu. Vui lòng thử lại!";

      toast.error(msg, { autoClose: 2000 });

      setUsername("");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100">
      {/* Minh họa */}
      <div className="hidden md:flex w-1/2 items-center justify-center p-10">
        <motion.img
          src="https://cdn.dribbble.com/users/1162077/screenshots/3848914/programmer.gif"
          alt="Meeting illustration"
          className="w-3/4 rounded-2xl shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        />
      </div>

      {/* Form */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-6">
        <motion.form
          onSubmit={handleSubmit}
          className="bg-white shadow-2xl p-10 rounded-3xl w-full max-w-md border border-blue-100"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-center mb-8 text-blue-700">
            🗓️ Meeting Management
          </h2>

          {/* Username */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
              type="text"
              placeholder="Nhập email..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="
                w-full 
                border border-blue-300 
                p-3 
                rounded-xl 
                bg-white
                placeholder-gray-400
                shadow-sm
                focus:outline-none 
                focus:ring-2 
                focus:ring-blue-500 
                focus:border-blue-500
                transition
                "
              required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="
                  w-full 
                  border border-blue-300 
                  p-3 
                  rounded-xl 
                  bg-white
                  placeholder-gray-400
                  shadow-sm
                  focus:outline-none 
                  focus:ring-2 
                  focus:ring-blue-500 
                  focus:border-blue-500
                  transition
                  pr-10
                  "
                required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-blue-600"
                >
                  {showPassword ? <FiEye size={20} /> : <FiEyeOff size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-blue-600 text-white font-semibold py-3 mt-6 rounded-lg hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <FiLogIn />
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </motion.button>

          <div className="text-right mt-3">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <p className="text-sm text-gray-500 text-center mt-4">
            © 2025 CMC Global - Meeting Management
          </p>
        </motion.form>
      </div>
    </div>
  );
}
