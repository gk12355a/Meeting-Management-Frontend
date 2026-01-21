// src/pages/user/CreateMeetingPage.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  DatePicker,
  Select,
  Input,
  Button,
  Form,
  message,
  Card,
  Divider,
  Checkbox,
  Tag,
  Spin,
  TimePicker, // [Updated]
} from "antd";
import { FiPlusCircle, FiUsers } from "react-icons/fi";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import utc from "dayjs/plugin/utc";
import { useAuth } from "../../context/AuthContext";

import { createMeeting, getRooms } from "../../services/meetingService";
import { searchUsers } from "../../services/userService";
import { getAvailableDevices } from "../../services/deviceService";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useTranslation } from "react-i18next";

// [UPdated] Removed MUI imports

dayjs.locale("vi");
dayjs.extend(utc);

const { TextArea } = Input;
const { Option } = Select;

const CreateMeetingPage = () => {
  const { t, i18n } = useTranslation("meeting");
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);

  const [availableDevices, setAvailableDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const debounceTimer = useRef(null);
  const [form] = Form.useForm();
  const { user } = useAuth();

  const [isRecurring, setIsRecurring] = useState(false);

  const watchedDate = Form.useWatch("date", form);
  const watchedStartTime = Form.useWatch("startTime", form); // [Updated]
  const watchedEndTime = Form.useWatch("endTime", form);     // [Updated]

  // Load Rooms
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await getRooms();
        setRooms(res.data || []);
      } catch {
        message.error(
          i18n.language === "vi"
            ? "Không thể tải danh sách phòng họp!"
            : "Cannot load meeting rooms!"
        );
      }
    };
    loadRooms();
  }, []);

  // Load Devices khi thời gian thay đổi
  useEffect(() => {
    const fetchDevices = async () => {
      if (!watchedDate || !watchedStartTime || !watchedEndTime) {
        setAvailableDevices([]);
        return;
      }

      // Validate order
      const startMin = watchedStartTime.hour() * 60 + watchedStartTime.minute();
      const endMin = watchedEndTime.hour() * 60 + watchedEndTime.minute();
      if (endMin <= startMin) {
        setAvailableDevices([]);
        return;
      }

      setDevicesLoading(true);
      form.setFieldsValue({ deviceIds: [] }); // Clear thiết bị cũ

      try {
        const startTimeUTC = dayjs.utc()
          .year(watchedDate.year())
          .month(watchedDate.month())
          .date(watchedDate.date())
          .hour(watchedStartTime.hour())
          .minute(watchedStartTime.minute())
          .second(0)
          .millisecond(0);

        const endTimeUTC = dayjs.utc()
          .year(watchedDate.year())
          .month(watchedDate.month())
          .date(watchedDate.date())
          .hour(watchedEndTime.hour())
          .minute(watchedEndTime.minute())
          .second(0)
          .millisecond(0);

        const startTime = startTimeUTC.toISOString();
        const endTime = endTimeUTC.toISOString();

        const res = await getAvailableDevices(startTime, endTime);
        setAvailableDevices(res.data || []);
      } catch (err) {
        console.error(err);
        message.error(t("errorLoadMeeting"));
      } finally {
        setDevicesLoading(false);
      }
    };

    const t = setTimeout(fetchDevices, 500);
    return () => clearTimeout(t);
  }, [watchedDate, watchedStartTime, watchedEndTime, form]);

  // SEARCH USERS 
  const handleSearchUsers = (query) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!query || !query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await searchUsers(query);
        setSearchResults((res.data || []).filter((u) => u.id !== user?.id));
      } catch {
        toast.error(
          i18n.language === "vi"
            ? "Không thể tìm kiếm người dùng."
            : "Cannot search users."
        );
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  // Validate giờ làm việc
  const validateBusinessTime = (start, end) => {
    if (!start || !end) return false;
    const startMin = start.hour() * 60 + start.minute();
    const endMin = end.hour() * 60 + end.minute();
    // 08:00 - 18:00
    if (startMin < 480 || startMin >= 1080) return false;
    if (endMin <= 480 || endMin > 1080) return false;
    return true;
  };

  // Submit
  const handleCreateMeeting = async (values) => {
    if (!user?.id) {
      toast.error("Không thể tạo cuộc họp: Tài khoản của bạn chưa được đồng bộ đầy đủ. Vui lòng đăng xuất và đăng nhập lại!");
      return;
    }
    try {
      setLoading(true);

      const date = values.date;
      const startTime = dayjs(values.startTime);
      const endTime = dayjs(values.endTime);

      // Validate Time Order
      if (endTime.isBefore(startTime) || endTime.isSame(startTime)) {
        toast.error(i18n.language === "vi" ? "Giờ kết thúc phải sau giờ bắt đầu!" : "End time must be after start time!");
        return;
      }

      if (!validateBusinessTime(startTime, endTime)) {
        toast.error(
          i18n.language === "vi"
            ? "⏰ Chỉ được đặt lịch từ 08:00 đến 18:00!"
            : "⏰ You can only book between 08:00 and 18:00!"
        );
        return;
      }

      const startUTC = dayjs.utc()
        .year(date.year())
        .month(date.month())
        .date(date.date())
        .hour(startTime.hour())
        .minute(startTime.minute());

      const endUTC = dayjs.utc()
        .year(date.year())
        .month(date.month())
        .date(date.date())
        .hour(endTime.hour())
        .minute(endTime.minute());

      const payload = {
        title: values.title.trim(),
        description: values.description || "",
        startTime: startUTC.toISOString(),
        endTime: endUTC.toISOString(),
        roomId: values.roomId,
        participantIds: Array.from(new Set([user.id, ...(values.participantIds || [])])),
        deviceIds: values.deviceIds || [],
        guestEmails: values.guestEmails || [],
        recurrenceRule: values.isRecurring ? {
          frequency: values.frequency || "DAILY",
          interval: 1,
          repeatUntil: dayjs(values.repeatUntil).format("YYYY-MM-DD"),
        } : null,
        onBehalfOfUserId: null,
      };

      const res = await createMeeting(payload);

      if (res.data?.status === "PENDING_APPROVAL") {
        toast.info(
          i18n.language === "vi"
            ? "Yêu cầu đặt phòng đã được gửi và đang chờ Admin phê duyệt."
            : "Booking request sent and awaiting admin approval."
        );
      } else {
        toast.success(t("successCreate"));
      }

      form.resetFields();
      setIsRecurring(false);
      setAvailableDevices([]);

    } catch (err) {
      console.error("ERROR:", err?.response?.data);

      const backendMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Không thể tạo cuộc họp!";

      const raw = backendMsg.toLowerCase();
      let msg = i18n.language === "vi"
        ? "Không thể tạo cuộc họp!"
        : "Failed to create meeting!";

      // === Phòng họp trùng lịch ===
      if (raw.includes("phòng") && raw.includes("đã bị đặt")) {
        msg = i18n.language === "vi"
          ? "Phòng họp đã được đặt trong khung giờ này"
          : "The meeting room is already booked during this time.";
      }

      // === Người tham dự trùng lịch ===
      else if (raw.includes("người tham dự") && raw.includes("trùng lịch")) {
        msg = i18n.language === "vi"
          ? "Người tham gia bị trùng lịch trong khung giờ này"
          : "A participant has a schedule conflict during this time.";
      }

      // fallback chung nếu BE trả lỗi khác
      else {
        msg = `⚠️ ${backendMsg}`;
      }

      toast.error(msg, {
        position: "top-right",
        autoClose: 3500,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-[#0f172a]">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-300 dark:border-gray-700">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md">
          <FiPlusCircle className="text-white text-2xl" />
        </div>
        <div>
          <h2 className="text-3xl font-bold dark:text-gray-100">{t("createMeetingTitle")}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t("description")}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg bg-white dark:bg-[#1e293b] dark:text-gray-100 border-none">
          <Form form={form} layout="vertical" onFinish={handleCreateMeeting}>

            {/* TITLE */}
            <Form.Item name="title" label={t("meetingName")}
              rules={[
                { required: true, message: t("meetingName") + " " + t("errorTimeInvalid") },
                { min: 3, message: t("meetingName") + " quá ngắn" }
              ]}>
              <Input placeholder={t("meetingName")} className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
            </Form.Item>

            {/* DATE - TIME - DURATION */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Form.Item name="date" label={t("date")} rules={[{ required: true }]}>
                <DatePicker className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600" format="DD/MM/YYYY"
                  disabledDate={(d) => !d || d < dayjs().startOf("day")} />
              </Form.Item>

              <Form.Item
                name="startTime"
                label={t("startTime")}
                rules={[{ required: true, message: "Chọn giờ bắt đầu" }]}
              >
                <TimePicker
                  format="HH:mm"
                  minuteStep={15}
                  className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  placeholder="Giờ bắt đầu"
                  showNow={false}
                />
              </Form.Item>

              <Form.Item
                name="endTime"
                label="Giờ kết thúc"
                rules={[{ required: true, message: "Chọn giờ kết thúc" }]}
              >
                <TimePicker
                  format="HH:mm"
                  minuteStep={15}
                  className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  placeholder="Giờ kết thúc"
                  showNow={false}
                />
              </Form.Item>
            </div>

            {/* ROOM */}
            <Form.Item name="roomId" label={t("room")} rules={[{ required: true, message: t("room") + " không được để trống" }]}>
              <Select placeholder={t("room")} className="dark:bg-gray-700 dark:text-white dark:border-gray-600" classNames={{ popup: "dark:bg-gray-700 dark:text-gray-100" }}>
                {rooms.map((r) => (
                  <Option key={r.id} value={r.id} disabled={r.status !== "AVAILABLE"}>
                    <div className="flex justify-between">
                      <span>{r.name} ({r.capacity} chỗ)</span>
                      <Tag color={r.status === "AVAILABLE" ? "green" : "red"}>{r.status === "AVAILABLE" ? "Sẵn sàng" : "Bảo trì"}</Tag>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* DEVICE */}
            <Form.Item name="deviceIds" label={t("devices")}>
              <Select
                mode="multiple"
                placeholder={!watchedDate || !watchedStartTime || !watchedEndTime ? "Vui lòng chọn thời gian" : t("devices")}
                disabled={!watchedDate || !watchedStartTime || !watchedEndTime || devicesLoading}
                loading={devicesLoading}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                classNames={{ popup: "dark:bg-gray-700 dark:text-gray-100" }}
              >
                {availableDevices.map((d) => (
                  <Option key={d.id} value={d.id} disabled={d.status !== "AVAILABLE"}>
                    <div className="flex justify-between">
                      <span>{d.name}</span>
                      <Tag color={d.status === "AVAILABLE" ? "green" : "red"}>{d.status === "AVAILABLE" ? "Sẵn sàng" : "Bảo trì"}</Tag>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Divider className="dark:border-gray-700" />

            {/* PARTICIPANTS */}
            <Form.Item label={t("participants")} name="participantIds">
              <Select
                mode="multiple"
                showSearch
                placeholder={t("participants")}
                onSearch={handleSearchUsers}
                loading={isSearching}
                filterOption={false}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                classNames={{ popup: "dark:bg-gray-700 dark:text-gray-100" }}
              >
                {searchResults.map((u) => (
                  <Option key={u.id} value={u.id}>{u.fullName} ({u.username})</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="guestEmails"
              label={t("guestEmail")}
              rules={[{
                validator: (_, list) => {
                  if (!list || !list.length) return Promise.resolve();
                  const invalid = list.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
                  return invalid.length ? Promise.reject("Email không hợp lệ: " + invalid.join(", ")) : Promise.resolve();
                }
              }]}
            >
              <Select mode="tags" placeholder="email@example.com" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
            </Form.Item>

            <Divider className="dark:border-gray-700" />

            {/* RECURRING */}
            <Form.Item name="isRecurring" valuePropName="checked" className="mb-0">
              <Checkbox onChange={(e) => setIsRecurring(e.target.checked)} className="dark:text-gray-200">{t("recurring")}</Checkbox>
            </Form.Item>

            {isRecurring && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Form.Item name="frequency" label={t("frequency")} rules={[{ required: true }]}>
                  <Select className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    <Option value="DAILY">Hàng ngày</Option>
                    <Option value="WEEKLY">Hàng tuần</Option>
                    <Option value="MONTHLY">Hàng tháng</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="repeatUntil" label={t("repeatUntil")} rules={[{ required: true }]}>
                  <DatePicker className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600" format="DD/MM/YYYY" disabledDate={(d) => !d || d < dayjs()} />
                </Form.Item>
              </div>
            )}

            <Form.Item name="description" label={t("note")} className="mt-4">
              <TextArea rows={4} className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} block size="large" className="bg-emerald-600 hover:bg-emerald-700 text-white mt-4">
              {t("createButton")}
            </Button>

          </Form>
        </Card>
      </div>
    </div>
  );
};

export default CreateMeetingPage;