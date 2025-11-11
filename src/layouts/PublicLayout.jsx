// src/layouts/PublicLayout.jsx
import { Outlet } from 'react-router-dom';

/**
 * Layout này dùng cho các trang công khai (public).
 * Nó không có Sidebar hay Navbar.
 * <Outlet /> sẽ là nơi render LoginPage hoặc ForgotPasswordPage.
 */
export default function PublicLayout() {
  return (
    <div className="public-container">
      <Outlet />
    </div>
  );
}
//test,