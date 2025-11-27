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
  Modal,
  Tag,
  Spin, 
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

// MUI STATIC TIME PICKER
import { LocalizationProvider } from "@mui/x-date-pickers";
import { StaticTimePicker } from "@mui/x-date-pickers/StaticTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

dayjs.locale("vi");
dayjs.extend(utc);

const { TextArea } = Input;
const { Option } = Select;

const CreateMeetingPage = () => {
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
  const watchedTime = Form.useWatch("time", form);
  const watchedDuration = Form.useWatch("duration", form);
  const watchedCustomHour = Form.useWatch("customHour", form);

  // TIME PICKER STATE
  const [clockOpen, setClockOpen] = useState(false);
  const [clockValue, setClockValue] = useState(dayjs().hour(8).minute(0));

  // Load Rooms
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await getRooms();
        setRooms(res.data || []);
      } catch {
        message.error("Không thể tải danh sách phòng họp!");
      }
    };
    loadRooms();
  }, []);

  // Load Devices khi thời gian thay đổi
  useEffect(() => {
    const fetchDevices = async () => {
      if (!watchedDate || !watchedTime || (!watchedDuration && !watchedCustomHour)) {
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
          .hour(watchedTime.hour())
          .minute(watchedTime.minute())
          .second(0)
          .millisecond(0);

        const realDuration = watchedCustomHour ? parseFloat(watchedCustomHour) * 60 : watchedDuration;
        const endTime = startTimeUTC.add(realDuration, "minute").toISOString();

        const res = await getAvailableDevices(startTimeUTC.toISOString(), endTime);
        setAvailableDevices(res.data || []);
      } catch (err) {
        console.error(err);
        message.error("Không thể tải thiết bị khả dụng!");
      } finally {
        setDevicesLoading(false);
      }
    };

    const t = setTimeout(fetchDevices, 500);
    return () => clearTimeout(t);
  }, [watchedDate, watchedTime, watchedDuration, watchedCustomHour, form]);

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
        toast.error("Không thể tìm kiếm người dùng.");
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  // Validate giờ làm việc
  const validateBusinessTime = (value) => {
    if (!value) return false;
    const totalMin = value.hour() * 60 + value.minute();
    return totalMin >= 480 && totalMin <= 1080;
  };

  // Submit
  const handleCreateMeeting = async (values) => {
    try {
      setLoading(true);

      const date = values.date;
      const time = dayjs(values.time);

      if (!validateBusinessTime(time)) {
        toast.error("⏰ Chỉ được đặt lịch từ 08:00 đến 18:00!");
        return;
      }

      const startUTC = dayjs.utc()
        .year(date.year())
        .month(date.month())
        .date(date.date())
        .hour(time.hour())
        .minute(time.minute());

      const finalDuration = values.customHour ? dayjs.duration(parseFloat(values.customHour), 'hours').asMinutes() : values.duration;
      const payload = {
        title: values.title.trim(),
        description: values.description || "",
        startTime: startUTC.toISOString(),
        endTime: startUTC.add(finalDuration, "minute").toISOString(),
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
        toast.info("📝 Yêu cầu đặt phòng đã được gửi và đang chờ Admin phê duyệt.");
      } else {
        toast.success("Tạo cuộc họp thành công!");
      }

      form.resetFields();
      setClockValue(dayjs().hour(8).minute(0));
      setIsRecurring(false);
      setAvailableDevices([]);

    } catch (err) {
      console.error("ERROR:", err?.response?.data);

      const backendMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Không thể tạo cuộc họp!";

      const raw = backendMsg.toLowerCase();
      let msg = "Không thể tạo cuộc họp!";

      // === 1️⃣ Phòng họp trùng lịch ===
      if (raw.includes("phòng") && raw.includes("đã bị đặt")) {
        msg = "Phòng họp đã được đặt trong khung giờ này";
      }

      // === 2️⃣ Người tham dự trùng lịch ===
      else if (raw.includes("người tham dự") && raw.includes("trùng lịch")) {
        msg = "Người tham gia bị trùng lịch trong khung giờ này";
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
        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 shadow-md">
          <FiPlusCircle className="text-white text-2xl" />
        </div>
        <div>
          <h2 className="text-3xl font-bold dark:text-gray-100">Tạo lịch họp mới</h2>
          <p className="text-gray-500 dark:text-gray-400">Nhập thông tin để tạo cuộc họp</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg bg-white dark:bg-[#1e293b] dark:text-gray-100 border-none">
          <Form form={form} layout="vertical" onFinish={handleCreateMeeting}>

            {/* TITLE */}
            <Form.Item name="title" label="Tên cuộc họp"
              rules={[{ required: true, message: "Vui lòng nhập tên cuộc họp" }, { min: 3, message: "Quá ngắn" }]}>
              <Input placeholder="Nhập tên cuộc họp..." className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
            </Form.Item>

            {/* DATE - TIME - DURATION */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Form.Item name="date" label="Ngày họp" rules={[{ required: true }]}>
                <DatePicker className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600" format="DD/MM/YYYY"
                  disabledDate={(d) => !d || d < dayjs().startOf("day")} />
              </Form.Item>

              <Form.Item name="time" label="Giờ bắt đầu" rules={[{ required: true }]}>
                <div className="flex gap-2">
                  <Input readOnly value={clockValue.format("HH:mm")} onClick={() => setClockOpen(true)}
                    className="cursor-pointer dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                  <Button onClick={() => setClockOpen(true)}>🕒 Chọn</Button>
                </div>

                <Modal title="Chọn giờ họp (08:00 - 18:00)" open={clockOpen} onCancel={() => setClockOpen(false)}
                  onOk={() => {
                    if (!validateBusinessTime(clockValue)) {
                      toast.error("⏰ Chỉ được đặt 08:00 - 18:00!");
                      return;
                    }
                    form.setFieldsValue({ time: clockValue });
                    setClockOpen(false);
                  }} width={350} centered>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <StaticTimePicker orientation="portrait" ampm={false} value={clockValue} onChange={(v) => setClockValue(v)}
                      slotProps={{ actionBar: { actions: [] } }} />
                  </LocalizationProvider>
                </Modal>
              </Form.Item>

              <div className="flex gap-2">
                <Form.Item name="duration" label="Thời lượng" initialValue={60} style={{ flex: 1 }}>
                  <Select className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    <Option value={30}>30 phút</Option>
                    <Option value={60}>1 giờ</Option>
                    <Option value={90}>1.5 giờ</Option>
                    <Option value={120}>2 giờ</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="customHour" label="Khác (giờ)" style={{ width: 80 }}>
                  <Input type="number" step={0.5} min={0.5} max={8}
                    onChange={() => form.setFieldsValue({ duration: undefined })}
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                </Form.Item>
              </div>
            </div>

            {/* ROOM SELECT */}
            <Form.Item name="roomId" label="Phòng họp" rules={[{ required: true, message: "Chọn phòng họp" }]}>
              <Select placeholder="-- Chọn phòng họp --" optionLabelProp="label"
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                popupClassName="dark:bg-gray-700 dark:text-gray-100">
                {rooms.map((r) => (
                  <Option key={r.id} value={r.id} label={r.name} disabled={r.status !== "AVAILABLE"}>
                    <div className="flex justify-between items-center">
                      <span>
                        {r.name} ({r.capacity} chỗ)
                      </span>
                      <Tag color={r.status === "AVAILABLE" ? "green" : "red"}>
                        {r.status === "AVAILABLE" ? "Có sẵn" : "Bảo trì"}
                      </Tag>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Đã xóa Alert VIP */}

            {/* DEVICES */}
            <Form.Item name="deviceIds" label="Thiết bị sử dụng">
              <Select mode="multiple" loading={devicesLoading}
                disabled={!watchedDate || !watchedTime || devicesLoading}
                placeholder={!watchedDate || !watchedTime ? "Vui lòng chọn thời gian trước" : "Chọn thiết bị khả dụng"}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                popupClassName="dark:bg-gray-700 dark:text-gray-100">
                {availableDevices.map((d) => (
                  <Option key={d.id} value={d.id} disabled={d.status !== "AVAILABLE"}>
                    <div className="flex justify-between items-center">
                      <span>{d.name}</span>
                      <Tag color={d.status === "AVAILABLE" ? "green" : "red"}>
                        {d.status === "AVAILABLE" ? "Có sẵn" : "Bảo trì"}
                      </Tag>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Divider className="dark:border-gray-700" />

            {/* === NGƯỜI THAM GIA NỘI BỘ  === */}
            <Form.Item
              name="participantIds"
              label={
                <span>
                  <FiUsers className="inline mr-2" />
                  Người tham gia (Nội bộ)
                </span>
              }
            >
              <Select
                mode="multiple"
                showSearch
                filterOption={false}
                onSearch={handleSearchUsers}
                loading={isSearching}
                placeholder="-- Gõ tên hoặc email để tìm người tham gia --"
                notFoundContent={isSearching ? <Spin size="small" /> : "Không tìm thấy người dùng"}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                popupClassName="dark:bg-gray-700 dark:text-gray-100"
              >
                {searchResults.map((u) => (
                  <Option key={u.id} value={u.id}>
                    {u.fullName} ({u.username})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* GUEST EMAILS */}
            <Form.Item
              name="guestEmails"
              label="Email khách mời (bên ngoài)"
              tooltip="Nhập email, nhấn Enter hoặc dấu phẩy"
              rules={[{
                validator: (_, list) => {
                  if (!list || !list.length) return Promise.resolve();
                  const invalid = list.filter(e => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
                  return invalid.length
                    ? Promise.reject(`Email không hợp lệ: ${invalid.join(", ")}`)
                    : Promise.resolve();
                },
              }]}
            >
              <Select
                mode="tags"
                tokenSeparators={[" ", ",", ";"]}
                placeholder="guest@example.com"
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                popupClassName="dark:bg-gray-700 dark:text-gray-100"
              />
            </Form.Item>

            <Divider className="dark:border-gray-700" />

            {/* RECURRING */}
            <Form.Item name="isRecurring" valuePropName="checked" className="mb-1">
              <Checkbox onChange={(e) => setIsRecurring(e.target.checked)} className="dark:text-gray-200">
                Lặp lại cuộc họp
              </Checkbox>
            </Form.Item>

            {isRecurring && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Form.Item name="frequency" label="Tần suất" initialValue="DAILY" rules={[{ required: true }]}>
                  <Select className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    <Option value="DAILY">Hằng ngày</Option>
                    <Option value="WEEKLY">Hằng tuần</Option>
                    <Option value="MONTHLY">Hằng tháng</Option>
                  </Select>
                </Form.Item>
                <Form.Item name="repeatUntil" label="Lặp đến ngày" rules={[{ required: true }]}>
                  <DatePicker
                    format="DD/MM/YYYY"
                    className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    disabledDate={(c) => c && c <= dayjs().startOf("day")}
                  />
                </Form.Item>
              </div>
            )}

            <Form.Item name="description" label="Ghi chú">
              <TextArea rows={3} placeholder="Ghi chú thêm cho cuộc họp..."
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
            </Form.Item>

            {/* SUBMIT BUTTON */}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Tạo cuộc họp
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default CreateMeetingPage;