import React, { useEffect, useState } from "react";
import { Form, Input, Button, Card, Spin, message, Tag } from "antd";
import { FiUser, FiSave, FiMail, FiShield } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { getMyProfile, updateMyProfile } from "../../services/userService";
import { getGoogleAuthorizeUrl } from "../../services/googleService"; 
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";

// Hàm trợ giúp để dịch Role
const formatRole = (role) => {
  if (role === "ROLE_ADMIN") return "Quản trị viên";
  if (role === "ROLE_USER") return "Người dùng";
  return role;
};

const ProfilePage = () => {
  const { t } = useTranslation("profile");
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  // THÊM HÀM KẾT NỐI GOOGLE
  const handleConnectGoogle = async () => {
    try {
      const res = await getGoogleAuthorizeUrl();
      const url = res.data.url;
      window.location.href = url; // Redirect → Google OAuth
    } catch {
      toast.error("Không thể kết nối Google Calendar.");
    }
  };

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
      } catch {
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
      await updateMyProfile({ fullName: values.fullName });
      toast.success(t("messages.updateSuccess"));
    } catch {
      toast.error(t("messages.updateFail"));
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
          <h2 className="text-3xl font-bold dark:text-gray-100">{t("title")}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
        </div>
      </div>

      {/* FORM */}
      <div className="max-w-lg mx-auto">
        <Card className="rounded-2xl shadow-xl bg-white dark:bg-[#1e293b] dark:text-gray-100 border-none p-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Spin size="large" />
            </div>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleSave} className="space-y-4">

              {/* EMAIL */}
              <Form.Item
                label={
                  <span className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                    <FiMail /> {t("email")}
                  </span>
                }
                name="username"
              >
                <Input
                  disabled
                  className="
                    rounded-xl py-2 bg-gray-50 border-gray-300 
                    dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600
                  "
                />
              </Form.Item>

              {/* ROLE */}
              <Form.Item
                label={
                  <span className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                    <FiShield /> {t("role")}
                  </span>
                }
                name="role"
              >
                <Input
                  disabled
                  className="
                    rounded-xl py-2 bg-gray-50 border-gray-300 
                    dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600
                  "
                />
              </Form.Item>

              {/* FULL NAME */}
              <Form.Item
                label={
                  <span className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                    <FiUser /> {t("fullName")}
                  </span>
                }
                name="fullName"
                rules={[{ required: true, message: t("errors.requiredFullName") }]}
              >
                <Input
                  placeholder={t("placeholders.fullName")}
                  className="
                    rounded-xl py-2 bg-white border-gray-300
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                    dark:bg-gray-700 dark:text-white dark:border-gray-600 
                    dark:focus:ring-blue-400 dark:focus:border-blue-400
                  "
                />
              </Form.Item>

              {/* GOOGLE CALENDAR */}
              <Form.Item label={t("googleCalendar.title")}>
                {user?.isGoogleLinked ? (
                  <Tag color="green" className="px-3 py-1 text-base">
                    ✔ {t("googleCalendar.linked")}
                  </Tag>
                ) : (
                  <Button type="primary" danger onClick={handleConnectGoogle}>
                    {t("googleCalendar.connect")}
                  </Button>
                )}
              </Form.Item>

              {/* SAVE BUTTON */}
              <Form.Item className="pt-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  icon={<FiSave />}
                  size="large"
                  block
                  className="
                    rounded-xl py-2 text-lg font-semibold 
                    bg-gradient-to-r from-blue-600 to-indigo-600 
                    hover:opacity-90 shadow-md
                    dark:from-blue-500 dark:to-indigo-500
                  "
                >
                  {t("save")}
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
