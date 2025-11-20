// src/pages/user/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { Form, Input, Button, message, Card, Spin } from "antd";
import { FiUser, FiSave, FiMail, FiShield } from "react-icons/fi"; // <-- Thêm icon
import { useAuth } from "../../context/AuthContext";
import { getMyProfile, updateMyProfile } from "../../services/userService";

// Hàm trợ giúp để dịch Role
const formatRole = (role) => {
  if (role === "ROLE_ADMIN") return "Quản trị viên";
  if (role === "ROLE_USER") return "Người dùng";
  return role;
};

const ProfilePage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true); // Bắt đầu là true để tải
  const [saving, setSaving] = useState(false); // Loading cho nút Lưu
  const { user } = useAuth(); // <-- Lấy dữ liệu user từ Context

  // 1. Tải thông tin động (fullName) VÀ set thông tin tĩnh (email, role)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // === Set dữ liệu tĩnh từ Auth Context ===
    // Không cần gọi API vì nó có sẵn trong token
    form.setFieldsValue({
      username: user.username,
      role: user.roles.map(formatRole).join(', '), // Hiển thị vai trò
    });

    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Gọi API GET /api/v1/users/profile (chỉ để lấy fullName)
        const res = await getMyProfile(); 
        
        // Gán fullName (dữ liệu có thể thay đổi)
        form.setFieldsValue({
          fullName: res.data.fullName,
        });
      } catch (err) {
        console.error("Lỗi tải thông tin cá nhân:", err);
        message.error("Không thể tải thông tin cá nhân.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, form]); // Chạy lại nếu user thay đổi

  // 2. Xử lý khi nhấn nút Lưu (Giữ nguyên)
  const handleSave = async (values) => {
    setSaving(true);
    try {
      // Chỉ gửi đi fullName theo yêu cầu của API
      const payload = {
        fullName: values.fullName,
      };

      // Gọi API PUT /api/v1/users/profile
      await updateMyProfile(payload);
      message.success("Cập nhật thông tin thành công!");

    } catch (err) {
      console.error("Lỗi cập nhật thông tin:", err);
      message.error("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <FiUser />
        Thông tin cá nhân
      </h1>
      
      <Card 
        className="shadow-lg bg-white dark:bg-[#1e293b] border dark:border-gray-700"
        variant="borderless"
      >
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Spin size="large" />
          </div>
        ) : (
          <Form 
            form={form} 
            layout="vertical" 
            onFinish={handleSave}
            className="dark:text-gray-100"
          >
            {/* === Tên đăng nhập (Email) === */}
            <Form.Item
              label="Email (Tên đăng nhập)"
              name="username"
              className="dark:[&_.ant-form-item-label>label]:text-gray-300"
            >
              <Input 
                prefix={<FiMail className="text-gray-400" />}
                disabled // Không cho phép sửa
                className="dark:bg-slate-700 dark:text-gray-400 dark:border-slate-600"
              />
            </Form.Item>

            {/* === Vai trò === */}
            <Form.Item
              label="Vai trò"
              name="role"
              className="dark:[&_.ant-form-item-label>label]:text-gray-300"
            >
              <Input 
                prefix={<FiShield className="text-gray-400" />}
                disabled // Không cho phép sửa
                className="dark:bg-slate-700 dark:text-gray-400 dark:border-slate-600"
              />
            </Form.Item>

            {/* Họ và tên (Cho phép sửa) */}
            <Form.Item
              label="Họ và tên"
              name="fullName"
              rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
              className="dark:[&_.ant-form-item-label>label]:text-gray-300"
            >
              <Input 
                prefix={<FiUser className="text-gray-400" />}
                placeholder="Nhập họ và tên đầy đủ của bạn"
                className="dark:bg-slate-700 dark:text-white dark:border-slate-600"
              />
            </Form.Item>

            {/* Nút Lưu */}
            <Form.Item className="mt-4">
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                icon={<FiSave />}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Lưu thay đổi
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default ProfilePage;