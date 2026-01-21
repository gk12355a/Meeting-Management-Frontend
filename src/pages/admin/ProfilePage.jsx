import React, { useEffect, useState } from "react";
import { Form, Input, Button, Card, Spin, message, Tag } from "antd";
import { FiUser, FiSave, FiMail, FiShield, FiCamera } from "react-icons/fi";
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
  const { user, checkAuth, token } = useAuth();

  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

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
    // Init avatar from user context if available immediately, but better wait for fetchProfile
    if (user.avatarUrl) setAvatarPreview(user.avatarUrl);

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await getMyProfile();
        form.setFieldsValue({
          fullName: res.data.fullName,
        });
        if (res.data.avatarUrl) {
          setAvatarPreview(res.data.avatarUrl);
        }
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
      await updateMyProfile({
        fullName: values.fullName,
        avatar: avatarFile
      });
      toast.success(t("messages.updateSuccess"));
      if (token) await checkAuth(token);
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
        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md">
          <FiUser className="text-white text-2xl" />
        </div>
        <div>
          <h2 className="text-3xl font-bold dark:text-gray-100">{t("title")}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
        </div>
      </div>

      {/* AVATAR UPLOAD */}
      <div className="max-w-lg mx-auto mb-8 flex justify-center">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-gray-400 dark:text-gray-500 select-none">
                {(user?.fullName || user?.username || "U").substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <label className="absolute bottom-1 right-1 bg-emerald-600 text-white p-2.5 rounded-full cursor-pointer hover:bg-emerald-700 shadow-lg transition-all active:scale-95 border-2 border-white dark:border-gray-800">
            <FiCamera size={18} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.");
                    return;
                  }
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                }
              }}
            />
          </label>
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
                    focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                    dark:bg-gray-700 dark:text-white dark:border-gray-600 
                    dark:focus:ring-emerald-400 dark:focus:border-emerald-400
                  "
                />
              </Form.Item>

              {/* GOOGLE CALENDAR */}
              <div className="pt-2">
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{t("googleCalendar.title")}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user?.isGoogleLinked ? t("googleCalendar.linkedDesc") || "Đã liên kết với tài khoản Google." : t("googleCalendar.unlinkedDesc") || "Liên kết để đồng bộ lịch họp."}
                    </p>
                  </div>
                  {user?.isGoogleLinked ? (
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-sm font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      ✔ {t("googleCalendar.linked")}
                    </span>
                  ) : (
                    <Button
                      onClick={handleConnectGoogle}
                      className="bg-white border-gray-300 shadow-sm hover:bg-gray-50 text-gray-700 font-medium dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      icon={<img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />}
                    >
                      {t("googleCalendar.connect")}
                    </Button>
                  )}
                </div>
              </div>

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
                    bg-gradient-to-r from-emerald-600 to-teal-600 
                    hover:opacity-90 shadow-md
                    dark:from-emerald-500 dark:to-teal-500
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
