import React, { useEffect, useState } from "react";
import { Form, Input, Button, Card, Spin, message } from "antd";
import { FiUser, FiSave, FiMail, FiShield } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { getMyProfile, updateMyProfile } from "../../services/userService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Hàm trợ giúp để dịch Role
const formatRole = (role) => {
  if (role === "ROLE_ADMIN") return "Quản trị viên";
  if (role === "ROLE_USER") return "Người dùng";
  return role;
};

const ProfilePage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    form.setFieldsValue({
      username: user.username,
      role: user.roles.map(formatRole).join(", "),
    });

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await getMyProfile();
        form.setFieldsValue({
          fullName: res.data.fullName,
        });
      } catch (err) {
        message.error("Không thể tải thông tin cá nhân.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, form]);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const payload = { fullName: values.fullName };
      await updateMyProfile(payload);
      toast.success("🎉 Cập nhật thông tin thành công!");
    } catch (err) {
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-[#0f172a]">
      <ToastContainer position="top-right" autoClose={2500} />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-300 dark:border-gray-700">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 shadow-md">
          <FiUser className="text-white text-2xl" />
        </div>
        <div>
          <h2 className="text-3xl font-bold dark:text-gray-100">Thông tin cá nhân</h2>
          <p className="text-gray-500 dark:text-gray-400">Xem và chỉnh sửa hồ sơ của bạn</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        <Card className="shadow-lg bg-white dark:bg-[#1e293b] dark:text-gray-100 border-none">
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
              <Form.Item
                label={
                  <span>
                    <FiMail className="inline mr-2" />
                    Email (Tên đăng nhập)
                  </span>
                }
                name="username"
                className="dark:[&_.ant-form-item-label>label]:text-gray-300"
              >
                <Input
                  disabled
                  className="dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600"
                />
              </Form.Item>
              <Form.Item
                label={
                  <span>
                    <FiShield className="inline mr-2" />
                    Vai trò
                  </span>
                }
                name="role"
                className="dark:[&_.ant-form-item-label>label]:text-gray-300"
              >
                <Input
                  disabled
                  className="dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600"
                />
              </Form.Item>
              <Form.Item
                label={
                  <span>
                    <FiUser className="inline mr-2" />
                    Họ và tên
                  </span>
                }
                name="fullName"
                rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
                className="dark:[&_.ant-form-item-label>label]:text-gray-300"
              >
                <Input
                  placeholder="Nhập họ và tên đầy đủ của bạn"
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </Form.Item>
              <Form.Item className="mt-6">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  icon={<FiSave />}
                  size="large"
                  block
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Lưu thay đổi
                </Button>
              </Form.Item>
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;