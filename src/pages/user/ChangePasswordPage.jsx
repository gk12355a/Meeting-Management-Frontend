// src/pages/user/ChangePasswordPage.jsx
import { useState } from 'react';
import * as authService from '../../services/authService';
import { FiLock, FiSave, FiEye, FiEyeOff } from 'react-icons/fi';

export default function ChangePasswordPage() {
  // State form
  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // State toggle show/hide mật khẩu
  const [show, setShow] = useState({
    old: false,
    new: false,
    confirm: false
  });

  // State alert
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  // Cập nhật value input
  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Validate mật khẩu
  const validate = () => {
    const { oldPassword, newPassword, confirmPassword } = form;

    if (!oldPassword || !newPassword || !confirmPassword)
      return "Vui lòng điền đầy đủ thông tin.";

    if (newPassword.length < 6)
      return "Mật khẩu mới phải có ít nhất 6 ký tự.";

    // Kiểm tra mật khẩu mạnh
    const uppercase = /[A-Z]/;
    const lowercase = /[a-z]/;
    const number = /[0-9]/;
    const special = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

    if (!uppercase.test(newPassword))
      return "Mật khẩu phải có ít nhất 1 chữ hoa.";
    if (!lowercase.test(newPassword))
      return "Mật khẩu phải có ít nhất 1 chữ thường.";
    if (!number.test(newPassword))
      return "Mật khẩu phải có ít nhất 1 số.";
    if (!special.test(newPassword))
      return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt.";

    if (newPassword !== confirmPassword)
      return "Mật khẩu mới và xác nhận mật khẩu không khớp.";

    return null;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    const errorMsg = validate();
    if (errorMsg) {
      setAlert({ type: 'error', message: errorMsg });
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(form.oldPassword, form.newPassword);

      setAlert({ type: 'success', message: "Đổi mật khẩu thành công!" });
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });

    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || "Mật khẩu cũ không đúng."
      });
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Component Input
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

      {typeKey === 'new' && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
        </p>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <FiLock /> Đổi mật khẩu
      </h2>

      {alert.message && (
        <div className={`p-3 rounded-lg border mb-4 ${alert.type === 'error'
          ? "bg-red-100 border-red-300 text-red-700"
          : "bg-green-100 border-green-300 text-green-700"
        }`}>
          {alert.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Mật khẩu cũ" typeKey="old" placeholder="Nhập mật khẩu cũ" />
        <Input label="Mật khẩu mới" typeKey="new" placeholder="Nhập mật khẩu mới" />
        <Input label="Xác nhận mật khẩu mới" typeKey="confirm" placeholder="Nhập lại mật khẩu mới" />

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
