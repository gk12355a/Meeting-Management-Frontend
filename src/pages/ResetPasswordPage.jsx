// src/pages/ResetPasswordPage.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // 1. Lấy token từ URL ngay khi trang tải
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError("Link không hợp lệ hoặc bị thiếu token.");
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Mật khẩu không khớp.");
      return;
    }

    setIsLoading(true);

    try {
      // 2. Gọi API Backend (BS-5.3)
      const response = await api.post('/auth/reset-password', {
        token: token,
        newPassword: password,
      });

      setSuccess(response.data); // (Message: "Đặt lại mật khẩu thành công.")

      // Tự động chuyển về trang login sau 3 giây
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      const msg = err.response?.data || "Đã xảy ra lỗi. Token có thể đã hết hạn.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-6">
          Đặt Lại Mật Khẩu Mới
        </h1>

        {/* Nếu thành công, chỉ hiển thị thông báo */}
        {success ? (
          <div className="text-green-700 text-center p-4">
            {success}
            <p>Đang chuyển hướng về trang đăng nhập...</p>
          </div>
        ) : (
          /* Nếu chưa, hiển thị form */
          <form onSubmit={handleSubmit} className="space-y-5">
            <input type="hidden" value={token || ''} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full rounded-xl bg-emerald-600 text-white px-3 py-3 font-semibold"
            >
              {isLoading ? 'Đang lưu...' : 'Đặt Lại Mật Khẩu'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}