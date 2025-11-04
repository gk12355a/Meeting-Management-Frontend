// src/routes/AdminOnlyRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminOnlyRoute = () => {
  const { isAdmin, isAuthenticated } = useAuth();

  // Nếu chưa đăng nhập → về trang login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Nếu đã đăng nhập nhưng không phải Admin → về trang 403 hoặc user dashboard
  // if (!isAdmin) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-slate-950">
  //       <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-lg shadow-lg">
  //         <h1 className="text-6xl font-bold text-red-500 mb-4">403</h1>
  //         <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
  //           Truy cập bị từ chối
  //         </h2>
  //         <p className="text-gray-600 dark:text-gray-400 mb-6">
  //           Bạn không có quyền truy cập trang này.
  //         </p>
  //         <a 
  //           href="/login" 
  //           className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
  //         >
  //           Quay lại đăng nhập
  //         </a>
  //       </div>
  //     </div>
  //   );
  // }

  // Nếu là Admin → cho phép hiển thị route con
  return <Outlet />; 
};

export default AdminOnlyRoute;