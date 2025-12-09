// src/components/user/BookDeviceModal.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Modal,
  DatePicker,
  Select,
  Input,
  Button,
  Form,
  Card,
  Divider,
  Checkbox,
  Spin,
  Tag,
  InputNumber, 
} from "antd";
import { FiPlusCircle, FiUsers } from "react-icons/fi";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import utc from "dayjs/plugin/utc";
import { toast } from "react-toastify";

import { createMeeting, getRooms } from "../../services/meetingService";
import { searchUsers } from "../../services/userService";
import { getAvailableDevices } from "../../services/deviceService";
import { useAuth } from "../../context/AuthContext";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { StaticTimePicker } from "@mui/x-date-pickers/StaticTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useTranslation } from "react-i18next";

dayjs.locale("vi");
dayjs.extend(utc);

const { TextArea } = Input;
const { Option } = Select;

const BookDeviceModal = ({ open, onCancel, prefilledDevice, onSuccess }) => {
  const { t } = useTranslation("bookDevices");
  const [loading, setLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [rooms, setRooms] = useState([]);

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [availableDevices, setAvailableDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  // TIME PICKER STATE
  const [clockOpen, setClockOpen] = useState(false);
  const [clockValue, setClockValue] = useState(dayjs().hour(9).minute(0));

  const debounceTimer = useRef(null);
  const [form] = Form.useForm();
  
  const { user } = useAuth();

  // Watch form values để tải devices tự động
  const watchedDate = Form.useWatch("date", form);
  const watchedTime = Form.useWatch("time", form);
  const watchedDuration = Form.useWatch("duration", form);

  /* ===== LOAD DEVICES WHEN TIME CHANGES ====== */
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
        const endTime = startTimeUTC
          .add(watchedDuration, "minute")
          .toISOString();

        const res = await getAvailableDevices(startTime, endTime);
        const availableList = res.data || [];

        // Đảm bảo thiết bị đã chọn luôn có trong danh sách (ngay cả khi đang được sử dụng)
        const prefilledInList = availableList.find(d => d.id === prefilledDevice?.id);
        if (!prefilledInList && prefilledDevice) {
          // Thêm thiết bị đã chọn vào đầu danh sách
          availableList.unshift(prefilledDevice);
        }

        setAvailableDevices(availableList);
      } catch (err) {
        console.error("Error in handleCreateMeeting:", err);
        toast.error("Không thể tải thiết bị khả dụng!");
      } finally {
        setDevicesLoading(false);
      }
    };

    const t = setTimeout(fetchDevices, 500);
    return () => clearTimeout(t);
  }, [watchedDate, watchedTime, watchedDuration, prefilledDevice]);

  useEffect(() => {
    if (!open) return;

    const loadRooms = async () => {
      try {
        const res = await getRooms();
        setRooms(res.data || []);
      } catch {
        toast.error("Không thể tải danh sách phòng họp!");
      }
    };
    loadRooms();
  }, [open]);

  /* ====== SET INITIAL FORM VALUES WITH PREFILLED DEVICE ====== */
  useEffect(() => {
    if (open && prefilledDevice) {
      setIsRecurring(false);
      setClockValue(dayjs().hour(9).minute(0));

      setTimeout(() => {
         form.setFieldsValue({
          title: "",
          date: start,
          time: start,
          hour: start.hour(),
          minute: start.minute(),
          duration: duration <= 0 ? 60 : duration,
          roomId: undefined,
          deviceIds: [],
          participantIds: [],
          guestEmails: [],
          isRecurring: false,
          frequency: "DAILY",
          repeatUntil: undefined,
          daysOfWeek: [],
          description: "",
        });
      }, 100);

      setSearchResults([]);
    }
  }, [open, prefilledDevice, form]);

  /* ====== SEARCH INTERNAL USERS ====== */
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

  /* ====== VALIDATE BUSINESS TIME ====== */
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
          toast.success("🎉 Tạo cuộc họp thành công!");
        }

        form.resetFields();
        setClockValue(dayjs().hour(8).minute(0));
        setIsRecurring(false);
        setAvailableDevices([]);
        
        // Gọi callback onSuccess nếu có
        if (onSuccess) onSuccess();
        onCancel();

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

  const handleCancel = () => {
    form.resetFields();
    setClockValue(dayjs().hour(9).minute(0));
    setIsRecurring(false);
    onCancel();
  };

  /* ===== UI ====== */
  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={650}
      closable={!loading}
      maskClosable={!loading}
      title={
        <span className="flex items-center gap-2 dark:text-white text-lg font-semibold">
          <FiPlusCircle /> {t("modal.title", { name: prefilledDevice?.name })}
        </span>
      }
       className="dark:[&_.ant-modal-content]:bg-gray-800 dark:[&_.ant-modal-content]:text-gray-100 
             dark:[&_.ant-modal-header]:bg-gray-800 dark:[&_.ant-modal-header]:border-b-gray-700"
      styles={{ body: { paddingTop: 18, paddingBottom: 10 } }}
    > 
      <Card
        className="shadow-none bg-white dark:bg-[#1e293b] border-none dark:text-gray-100"
        styles={{ body: { padding: 0 } }}
      >
        <Form
          layout="vertical"
          form={form}
          disabled={loading}
          onFinish={handleCreateMeeting}
          onValuesChange={(vals) => {
            if (vals.isRecurring !== undefined) setIsRecurring(vals.isRecurring);
          }}
        >
          {/* TITLE */}
          <Form.Item
            name="title"
            label={t("form.title")}
            rules={[
              { required: true, message: t("form.titleRequired") },,
              { min: 3, message: t("form.titleShort") },
            ]}
          >
            <Input
              placeholder={t("form.titlePlaceholder")}
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </Form.Item>

          {/* DATE - TIME - DURATION */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

  {/* DATE */}
  <Form.Item 
    name="date" 
    label={t("form.date")}
    rules={[{ required: true, message: t("form.dateRequired") }]}
  >
    <DatePicker
      format="DD/MM/YYYY"
      className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
      disabledDate={(d) =>
        !d || d < dayjs().startOf("day")
      }
    />
  </Form.Item>

  {/* TIME PICKER - MUI CLOCK */}
<Form.Item
  name="time"
  label={t("form.time")}
  rules={[{ required: true, message: t("form.timeRequired") }]}>
  <>
    <div className="flex gap-2">
      <Input
        readOnly
        value={clockValue.format("HH:mm")}
        onClick={() => setClockOpen(true)}
        className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
      />
      <Button
        onClick={() => setClockOpen(true)}
        className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
      >
        🕒 Đồng hồ
      </Button>
    </div>

    <Modal
      title={t("form.timePickerTitle")}
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
      className="dark:[&_.ant-modal-content]:bg-gray-800 dark:[&_.ant-modal-header]:bg-gray-800"
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

  {/* DURATION + CUSTOM HOUR */}
  <div className="flex gap-2 items-end">
    {/* DURATION SELECT */}
    <Form.Item
      name="duration"
      label={t("form.duration")}
      style={{ flex: 1 }}
      initialValue={60}
    >
      <Select
        className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
        onChange={() => form.setFieldsValue({ customHour: undefined })}
        placeholder={t("form.durationPlaceholder")}
        allowClear
      >
        <Option value={30}>{t("form.duration30")}</Option>
        <Option value={60}>{t("form.duration60")}</Option>
        <Option value={90}>{t("form.duration90")}</Option>
        <Option value={120}>{t("form.duration120")}</Option>
      </Select>
    </Form.Item>

    {/* CUSTOM HOUR INPUT */}
    <Form.Item
      name="customHour"
      label={t("form.customHour")}
      style={{ flex: "0 0 80px" }}
    >
      <Input
        type="number"
        step={0.5}
        min={0.5}
        max={8}
        className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
        onChange={(e) => {
          const hour = parseFloat(e.target.value || 0);
          if (hour > 0) {
            form.setFieldsValue({ duration: undefined });
          }
        }}
      />
    </Form.Item>
  </div>
  </div>
          
          {/* ROOM */}
          <Form.Item
            name="roomId"
            label={t("form.room")}
            rules={[{ required: true, message: "Chọn phòng họp" }]}
          >
            <Select
              placeholder={t("form.roomPlaceholder")}
              optionLabelProp="label"
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              popupClassName="dark:bg-gray-700 dark:text-gray-100"
            >
              {rooms.map((r) => (
                <Option
                  key={r.id}
                  value={r.id}
                  label={r.name}
                  disabled={r.status !== "AVAILABLE"}
                >
                  <div className="flex justify-between items-center">
                    <span>
                      {r.name} ({r.capacity} chỗ)
                    </span>

                    <Tag color={r.status === "AVAILABLE" ? "green" : "red"}>
                      {r.status === "AVAILABLE" ? t("form.roomAvailable") : t("form.roomOffline")}
                    </Tag>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
          {/* Đã xóa Alert VIP */}

          <Form.Item
            name="deviceIds"
            label={t("form.devices")}
            tooltip={t("form.deviceTooltip")}
          >
            <Select
              mode="multiple"
              disabled={!watchedDate || !watchedTime}
              loading={devicesLoading}
              placeholder={
                !watchedDate || !watchedTime
                  ? t("form.selectDateTimeFirst")
                  : t("form.selectMoreDevices")
              }
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              popupClassName="dark:bg-gray-700 dark:text-gray-100"
              onChange={(selectedIds) => {
                if (!selectedIds.includes(prefilledDevice?.id)) {
                  form.setFieldsValue({
                    deviceIds: [...selectedIds, prefilledDevice?.id],
                  });
                }
              }}
            >
              {availableDevices.map((d) => {
                const isPrefilled = d.id === prefilledDevice?.id;
                return (
                  <Option
                    key={d.id}
                    value={d.id}
                    disabled={d.status !== "AVAILABLE" && !isPrefilled}
                  >
                    <div className="flex justify-between items-center">
                      <span>
                        {d.name}
                        {isPrefilled && (
                          <span className="ml-2 text-xs text-purple-600 dark:text-purple-400 font-semibold">
                            (Đã chọn - Bắt buộc)
                          </span>
                        )}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          d.status === "AVAILABLE"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {d.status === "AVAILABLE" ? "Có sẵn" : "Bảo trì"}
                      </span>
                    </div>
                  </Option>
                );
              })}
            </Select>
          </Form.Item>

          {/* Device Info Display */}
          <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
            <p className="text-sm text-purple-800 dark:text-purple-300">
              <span className="font-semibold">{t("deviceInfo.title")}</span> {prefilledDevice?.name}
              {prefilledDevice?.description && ` - ${prefilledDevice.description}`}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              💡 {t("deviceInfo.tip")}
            </p>
          </div>

          <Divider className="dark:border-gray-700" />

          {/* PARTICIPANTS */}
          <Form.Item
            name="participantIds"
            label={
              <span>
                <FiUsers className="inline mr-2" />
                {t("form.participants")}
              </span>
            }
          >
            <Select
              mode="multiple"
              showSearch
              loading={isSearching}
              filterOption={false}
              onSearch={handleSearchUsers}
              placeholder={t("form.participantPlaceholder")}
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              popupClassName="dark:bg-gray-700 dark:text-gray-100"
              notFoundContent={isSearching ? <Spin size="small" /> : t("form.noUsers")}
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
            label={t("form.guestEmails")}
            tooltip={t("form.guestTooltip")}
            rules={[
              {
                validator(_, list) {
                  if (!list || !list.length) return Promise.resolve();
                  const invalid = list.filter(
                    (e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
                  );
                  return invalid.length
                    ? Promise.reject(`Email không hợp lệ: ${invalid.join(", ")}`)
                    : Promise.resolve();
                },
              },
            ]}
          >
            <Select
              mode="tags"
              tokenSeparators={[",", ";", " "]}
              placeholder={t("form.guestEmailPlaceholder")}
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              popupClassName="dark:bg-gray-700 dark:text-gray-100"
            />
          </Form.Item>

          <Divider className="dark:border-gray-700" />

          {/* RECURRING MEETING */}
          <Form.Item
            name="isRecurring"
            valuePropName="checked"
            initialValue={false}
            className="mb-1"
          >
            <Checkbox
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="dark:text-gray-200"
            >
              {t("form.recurring")}
            </Checkbox>
          </Form.Item>

          {isRecurring && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="frequency"
                label={t("form.frequency")}
                rules={[{ required: true, message: "Chọn tần suất lặp" }]}
              >
                <Select
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  popupClassName="dark:bg-gray-700 dark:text-gray-100"
                >
                  <Option value="DAILY">{t("form.daily")}</Option>
                  <Option value="WEEKLY">{t("form.weekly")}</Option>
                  <Option value="MONTHLY">{t("form.monthly")}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="repeatUntil"
                label={t("form.repeatUntil")}
                rules={[{ required: true, message: "Chọn ngày kết thúc" }]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  disabledDate={(current) =>
                    current && current <= dayjs().startOf("day")
                  }
                />
              </Form.Item>
            </div>
          )}

          {/* DESCRIPTION */}
          <Form.Item name="description" label={t("form.description")}>
            <TextArea
              rows={3}
              placeholder={t("form.descriptionPlaceholder")}
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </Form.Item>

          {/* SUBMIT */}
          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={handleCancel} disabled={loading}>
              {t("submit.cancel")}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              {t("submit.submit")}
            </Button>
          </div>

        </Form>
      </Card>
    </Modal>
  );
};

export default BookDeviceModal;