// src/pages/user/ChangePasswordPage.jsx
import { useState } from 'react';
import * as authService from '../../services/authService';
import { FiLock, FiSave } from 'react-icons/fi';

export default function ChangePasswordPage() {
  const [form, setForm] = useState({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});
const [show, setShow] = useState({
  old: false,
  new: false,
  confirm: false
});
// Hàm cập nhật value
const handleChange = (key, value) => {
  setForm(prev => ({ ...prev, [key]: value }));
};
  const validate = () => {
  if (!form.oldPassword || !form.newPassword || !form.confirmPassword)
    return "Vui lòng điền đầy đủ thông tin.";

  if (form.newPassword.length < 6)
    return "Mật khẩu mới phải có ít nhất 6 ký tự.";

  if (form.newPassword !== form.confirmPassword)
    return "Mật khẩu mới và xác nhận mật khẩu không khớp.";

  return null;
};
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const Input = ({ label, typeKey, placeholder }) => (
  <div>
    <label htmlFor={typeKey} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
    </label>
    <div className="relative">
      <input
        id={typeKey}
        type={show[typeKey] ? "text" : "password"}
        value={form[typeKey]}
        onChange={(e) => handleChange(typeKey, e.target.value)}
        required
        placeholder={placeholder}
        className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
      />
      <button
        type="button"
        onClick={() => setShow(prev => ({ ...prev, [typeKey]: !prev[typeKey] }))}
        className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
        aria-label={show[typeKey] ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      >
        {show[typeKey] ? <FiEyeOff /> : <FiEye />}
      </button>
    </div>
  </div>
);


    // 1. Kiểm tra mật khẩu xác nhận
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và mật khẩu xác nhận không khớp.");
      return;
    }

    if (newPassword.length < 6) { 
        setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
        return;
    }

    setLoading(true);
    try {
      // 2. Gọi API
      await authService.changePassword(oldPassword, newPassword);
      
      setSuccess("Đổi mật khẩu thành công!");
      
      // 3. Xóa các trường
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (err) {
      // 4. Xử lý lỗi
      setError(err.response?.data?.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <FiLock />
        Đổi mật khẩu
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Thông báo Lỗi/Thành công */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Mật khẩu cũ */}
        <div>
          <label 
            htmlFor="oldPassword" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Mật khẩu cũ
          </label>
          <Input label="Mật khẩu cũ" typeKey="old" placeholder="Nhập mật khẩu cũ" />
          <Input label="Mật khẩu mới" typeKey="new" placeholder="Nhập mật khẩu mới" />
          <Input label="Xác nhận mật khẩu mới" typeKey="confirm" placeholder="Nhập lại mật khẩu mới" />
        </div>

        {/* Mật khẩu mới */}
        <div>
          <label 
            htmlFor="newPassword" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Mật khẩu mới
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>

        {/* Xác nhận mật khẩu mới */}
        <div>
          <label 
            htmlFor="confirmPassword" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Xác nhận mật khẩu mới
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>

        {/* Nút Lưu */}
        <div className="text-right">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave className="mr-2" />
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}