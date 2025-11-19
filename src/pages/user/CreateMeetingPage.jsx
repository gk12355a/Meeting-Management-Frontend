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
} from "antd";
import { FiPlusCircle } from "react-icons/fi";
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
  const [clockValue, setClockValue] = useState(dayjs());

  /* ===================================================
                    DARK MODE FIX
  ==================================================== */
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      html.dark .ant-form-item-label > label { color: #f1f5f9 !important; }
      html.dark .ant-input, 
      html.dark .ant-picker, 
      html.dark .ant-select-selector {
        background-color: #1e293b !important;
        color: #f8fafc !important;
        border-color: #334155 !important;
      }
      html.dark .ant-input::placeholder, 
      html.dark textarea.ant-input::placeholder {
        color: #94a3b8 !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  /* ===================================================
                    LOAD ROOMS
  ==================================================== */
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

  /* ===================================================
                LOAD DEVICES WHEN TIME CHANGES
  ==================================================== */
  useEffect(() => {
    const fetchDevices = async () => {
      if (!watchedDate || !watchedTime || !watchedDuration) {
        setAvailableDevices([]);
        return;
      }

      setDevicesLoading(true);

      try {
        const startTimeUTC = dayjs
          .utc()
          .year(watchedDate.year())
          .month(watchedDate.month())
          .date(watchedDate.date())
          .hour(watchedTime.hour())
          .minute(watchedTime.minute());

        const startTime = startTimeUTC.toISOString();
        // ⭐ Lấy đúng thời lượng (ưu tiên customHour)
        const realDuration = watchedCustomHour
        ? watchedCustomHour * 60
        : watchedDuration;

        const endTime = startTimeUTC.add(realDuration, "minute").toISOString();

        const res = await getAvailableDevices(startTime, endTime);
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
}, [watchedDate, watchedTime, watchedDuration, watchedCustomHour]);

  /* ===================================================
                SEARCH INTERNAL USERS
  ==================================================== */
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
        message.error("Không thể tìm kiếm người dùng.");
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  /* ===================================================
                  VALIDATE BUSINESS TIME
  ==================================================== */
  const validateBusinessTime = (value) => {
    if (!value) return false;
    const totalMin = value.hour() * 60 + value.minute();
    return totalMin >= 480 && totalMin <= 1080; // 08:00 - 18:00
  };

  /* ===================================================
                    SUBMIT MEETING
  ==================================================== */
  const handleCreateMeeting = async (values) => {
    try {
      setLoading(true);

      const date = values.date;
      const time = dayjs(values.time);

      if (!validateBusinessTime(time)) {
        toast.error("⏰ Chỉ được đặt lịch từ 08:00 đến 18:00!");
        return;
      }

      const startUTC = dayjs
        .utc()
        .year(date.year())
        .month(date.month())
        .date(date.date())
        .hour(time.hour())
        .minute(time.minute());
      // ⭐ Tính thời lượng cuối cùng
      const finalDuration = values.customHour
        ? values.customHour * 60
        : values.duration;
      const payload = {
      title: values.title.trim(),
      description: values.description || "",
      startTime: startUTC.toISOString(),
      endTime: startUTC.add(finalDuration, "minute").toISOString(),

      roomId: values.roomId,
      participantIds: Array.from(
        new Set([user.id, ...(values.participantIds || [])])
      ),
      deviceIds: values.deviceIds || [],
      guestEmails: values.guestEmails || [],

      recurrenceRule:
        values.isRecurring === true
          ? {
              frequency: values.frequency,
              interval: 1,
              repeatUntil: dayjs(values.repeatUntil).format("YYYY-MM-DD"),
            }
          : null,

      onBehalfOfUserId: null,
    };

    await createMeeting(payload);

      toast.success("🎉 Tạo cuộc họp thành công!");
      form.resetFields();
      setClockValue(dayjs());
      setAvailableDevices([]);
      setIsRecurring(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể tạo cuộc họp!");
    } finally {
      setLoading(false);
    }
  };

  /* ===================================================
                        UI
  ==================================================== */
  return (
    <div className="p-6 min-h-screen bg-white dark:bg-[#0f172a]">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-300 dark:border-gray-700">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 shadow-md">
          <FiPlusCircle className="text-white text-2xl" />
        </div>
        <div>
          <h2 className="text-3xl font-bold dark:text-gray-100">
            Tạo lịch họp mới
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Nhập thông tin để tạo cuộc họp
          </p>
        </div>
      </div>

      {/* FORM */}
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg bg-white dark:bg-[#1e293b] dark:text-gray-100">
          <Form form={form} layout="vertical" onFinish={handleCreateMeeting}>
            {/* TITLE */}
            <Form.Item
              name="title"
              label="Tên cuộc họp"
              rules={[
                { required: true, message: "Vui lòng nhập tên cuộc họp" },
                { min: 3, message: "Tên cuộc họp quá ngắn" },
              ]}
            >
              <Input placeholder="Nhập tên cuộc họp..." />
            </Form.Item>

            {/* TIME */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* DATE */}
              <Form.Item
  name="date"
  label="Ngày họp"
  rules={[{ required: true, message: "Chọn ngày họp" }]}
>
  <DatePicker
    className="w-full"
    format="DD/MM/YYYY"
    disabledDate={(d) => {
      if (!d) return true;

      // Không cho chọn ngày quá khứ
      if (d < dayjs().startOf("day")) return true;

      // Không cho chọn T7 (6) và CN (0)
      const dayOfWeek = d.day();
      return dayOfWeek === 0 || dayOfWeek === 6;
    }}
  />
</Form.Item>

              {/* TIME PICKER */}
              <Form.Item
                name="time"
                label="Giờ bắt đầu"
                rules={[{ required: true, message: "Chọn giờ bắt đầu" }]}
              >
                <>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={clockValue.format("HH:mm")}
                      onClick={() => setClockOpen(true)}
                    />
                    <Button onClick={() => setClockOpen(true)}>
                      🕒 Đồng hồ
                    </Button>
                  </div>

                  <Modal
                    title="Chọn giờ họp (08:00 - 18:00)"
                    open={clockOpen}
                    onCancel={() => setClockOpen(false)}
                    onOk={() => {
                      if (!validateBusinessTime(clockValue)) {
                        toast.error("⏰ Chỉ được đặt 08:00 - 18:00!");
                        return;
                      }
                      form.setFieldsValue({ time: clockValue });
                      setClockOpen(false);
                    }}
                    width={520}
                    style={{ overflow: "visible" }}
                    bodyStyle={{ overflow: "visible", paddingTop: 8 }}
                  >
                    <div className="text-center text-gray-500 dark:text-gray-300 mb-2 text-sm">
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">
                        Giờ (HH)
                      </span>{" "}
                      :{" "}
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">
                        Phút (MM)
                      </span>
                    </div>

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <StaticTimePicker
                        orientation="landscape"
                        ampm={false}
                        value={clockValue}
                        onChange={(v) => setClockValue(v)}
                        slotProps={{
                          actionBar: { actions: [] },
                        }}
                      />
                    </LocalizationProvider>
                  </Modal>
                </>
              </Form.Item>

              {/* THỜI LƯỢNG + KHÁC (GIỜ) */}
            <div className="flex gap-4">
              {/* Select thời lượng cố định */}
              <Form.Item
                name="duration"
                label="Thời lượng"
                initialValue={60}
                style={{ flex: 1 }}
              >
                <Select>
                  <Option value={15}>15 phút</Option>
                  <Option value={30}>30 phút</Option>
                  <Option value={45}>45 phút</Option>
                  <Option value={60}>1 giờ</Option>
                  <Option value={90}>1 giờ 30 phút</Option>
                  <Option value={120}>2 giờ</Option>
                </Select>
              </Form.Item>

              {/* Nhập giờ tự do */}
              <Form.Item
              name="customHour"
              label="Khác (giờ)"
              style={{ width: 140 }}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value) return Promise.resolve();
                    if (isNaN(value) || value <= 0) return Promise.reject("Giờ phải lớn hơn 0");
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Input
                type="number"
                min={0.1}
                step={0.1}
                placeholder="VD: 1.5"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    form.setFieldsValue({ duration: undefined }); // clear Select khi nhập khác
                  }
                }}
              />
            </Form.Item>
            </div>
            </div>

            {/* ROOM */}
            <Form.Item
              name="roomId"
              label="Phòng họp"
              rules={[{ required: true, message: "Chọn phòng họp" }]}
            >
              <Select placeholder="-- Chọn phòng họp --">
                {rooms.map((r) => (
                  <Option
                    key={r.id}
                    value={r.id}
                    disabled={r.status !== "AVAILABLE"}
                  >
                    <div className="flex justify-between items-center">
                      <span>
                        {r.name} ({r.location || "Không rõ"})
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          r.status === "AVAILABLE"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {r.status === "AVAILABLE" ? "Có sẵn" : "Bảo trì"}
                      </span>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* DEVICES */}
            <Form.Item name="deviceIds" label="Thiết bị sử dụng">
              <Select
                mode="multiple"
                disabled={!watchedDate || !watchedTime}
                loading={devicesLoading}
                placeholder={
                  !watchedDate || !watchedTime
                    ? "Chọn ngày và giờ trước"
                    : "Chọn thiết bị khả dụng"
                }
              >
                {availableDevices.map((d) => (
                  <Option
                    key={d.id}
                    value={d.id}
                    disabled={d.status !== "AVAILABLE"}
                  >
                    <div className="flex justify-between items-center">
                      <span>{d.name}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          d.status === "AVAILABLE"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {d.status === "AVAILABLE" ? "Có sẵn" : "Bảo trì"}
                      </span>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Divider />

            {/* PARTICIPANTS */}
            <Form.Item name="participantIds" label="Người tham gia (Nội bộ)">
              <Select
                mode="multiple"
                showSearch
                loading={isSearching}
                filterOption={false}
                onSearch={handleSearchUsers}
              >
                {searchResults.map((u) => (
                  <Option key={u.id} value={u.id}>
                    {u.fullName} ({u.username})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* GUEST EMAIL */}
            <Form.Item
              name="guestEmails"
              label="Email khách mời"
              rules={[
                {
                  validator(_, list) {
                    if (!list || !list.length) return Promise.resolve();
                    const invalid = list.filter(
                      (e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
                    );
                    return invalid.length
                      ? Promise.reject(
                          `Email không hợp lệ: ${invalid.join(", ")}`
                        )
                      : Promise.resolve();
                  },
                },
              ]}
            >
              <Select mode="tags" tokenSeparators={[",", ";", " "]} />
            </Form.Item>

            <Divider />

            {/* ===================================================
                        RECURRING MEETING
            =================================================== */}
            <Form.Item
              name="isRecurring"
              valuePropName="checked"
              initialValue={false}
            >
              <Checkbox onChange={(e) => setIsRecurring(e.target.checked)}>
                Lặp lại cuộc họp
              </Checkbox>
            </Form.Item>

            {isRecurring && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Form.Item
                  name="frequency"
                  label="Tần suất"
                  rules={[{ required: true, message: "Chọn tần suất lặp" }]}
                >
                  <Select>
                    <Option value="DAILY">Hằng ngày</Option>
                    <Option value="WEEKLY">Hằng tuần</Option>
                    <Option value="MONTHLY">Hằng tháng</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="repeatUntil"
                  label="Lặp đến ngày"
                  rules={[{ required: true, message: "Chọn ngày kết thúc" }]}
                >
                  <DatePicker
                    format="DD/MM/YYYY"
                    className="w-full"
                    disabledDate={(current) =>
                      current && current <= dayjs().startOf("day")
                    }
                  />
                </Form.Item>
              </div>
            )}

            {/* DESCRIPTION */}
            <Form.Item name="description" label="Mô tả">
              <TextArea rows={4} placeholder="Nhập mô tả..." />
            </Form.Item>

            {/* SUBMIT */}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full sm:w-auto"
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
