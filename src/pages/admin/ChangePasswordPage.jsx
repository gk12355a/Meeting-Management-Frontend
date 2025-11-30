import { useState } from "react";
import { useTranslation } from "react-i18next"; 
import * as authService from "../../services/authService";
import { FiLock, FiSave, FiEye, FiEyeOff } from "react-icons/fi";
import { motion } from "framer-motion";

export default function ChangePasswordPage() {
  const { t } = useTranslation(['admin', 'common']); 

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // trạng thái hiển thị mật khẩu
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      // {/* <span>Mật khẩu mới và mật khẩu xác nhận không khớp.</span> */}
      setError(t('admin:changePassword.errors.mismatch'));
      return;
    }

    if (newPassword.length < 6) {
      // {/* <span>Mật khẩu mới phải có ít nhất 6 ký tự.</span> */}
      setError(t('admin:changePassword.errors.minLength'));
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      // {/* <span>Đổi mật khẩu thành công!</span> */}
      setSuccess(t('admin:changePassword.success'));
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      // {/* <span>Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.</span> */}
      setError(
        err.response?.data?.message ||
          t('admin:changePassword.errors.failed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[75vh]">
      <motion.div
        className="bg-white shadow-xl p-10 rounded-3xl w-full max-w-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700" // ✅ THÊM dark mode class (NEW)
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* <span>Đổi mật khẩu</span> */}
        <h2 className="text-3xl font-bold text-center mb-8 text-blue-700 dark:text-blue-400 flex items-center justify-center gap-2">
          <FiLock /> {t('admin:changePassword.title')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 text-center rounded-lg p-3 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-300 text-green-700 text-center rounded-lg p-3 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
              {success}
            </div>
          )}

          {/* Mật khẩu cũ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {/* <span>Mật khẩu cũ</span> */}
              <span>{t('admin:changePassword.fields.oldPassword')}</span>
            </label>
            <div className="relative">
              <input
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-3 text-gray-500 hover:text-blue-600 transition dark:text-gray-400"
                tabIndex={-1}
              >
                {showOld ? <FiEye size={20} /> : <FiEyeOff size={20} />}
              </button>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {/* <span>Mật khẩu mới</span> */}
              <span>{t('admin:changePassword.fields.newPassword')}</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-3 text-gray-500 hover:text-blue-600 transition dark:text-gray-400"
                tabIndex={-1}
              >
                {showNew ? <FiEye size={20} /> : <FiEyeOff size={20} />}
              </button>
            </div>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {/* <span>Xác nhận mật khẩu mới</span> */}
              <span>{t('admin:changePassword.fields.confirmPassword')}</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3 text-gray-500 hover:text-blue-600 transition dark:text-gray-400"
                tabIndex={-1}
              >
                {showConfirm ? <FiEye size={20} /> : <FiEyeOff size={20} />}
              </button>
            </div>
          </div>

          {/* Nút lưu */}
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-blue-600 text-white font-semibold py-3 mt-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <FiSave />
            {/* <span>Đang lưu...</span> */}
            {/* <span>Lưu thay đổi</span> */}
            {loading ? t('common:messages.loading') : t('common:buttons.save')}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}