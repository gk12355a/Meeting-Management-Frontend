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
  TimePicker, // [Updated] Import TimePicker
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
import { useTranslation } from "react-i18next";

// [Updated] Removed MUI imports

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

  const debounceTimer = useRef(null);
  const [form] = Form.useForm();

  const { user } = useAuth();

  // Watch form values để tải devices tự động
  const watchedDate = Form.useWatch("date", form);
  const watchedStartTime = Form.useWatch("startTime", form); // [Updated]
  const watchedEndTime = Form.useWatch("endTime", form);     // [Updated]

  /* ===== LOAD DEVICES WHEN TIME CHANGES ====== */
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

      try {
        const startTimeUTC = dayjs
          .utc()
          .year(watchedDate.year())
          .month(watchedDate.month())
          .date(watchedDate.date())
          .hour(watchedStartTime.hour())
          .minute(watchedStartTime.minute());

        const endTimeUTC = dayjs
          .utc()
          .year(watchedDate.year())
          .month(watchedDate.month())
          .date(watchedDate.date())
          .hour(watchedEndTime.hour())
          .minute(watchedEndTime.minute());

        const startTime = startTimeUTC.toISOString();
        const endTime = endTimeUTC.toISOString();

        const res = await getAvailableDevices(startTime, endTime);
        const availableList = res.data || [];

        // Đảm bảo thiết bị đã chọn luôn có trong danh sách (ngay cả khi đang được sử dụng)
        const prefilledInList = availableList.find(d => d.id === prefilledDevice?.id);
        if (!prefilledInList && prefilledDevice) {
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
  }, [watchedDate, watchedStartTime, watchedEndTime, prefilledDevice]);

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

      const defaultStart = dayjs().hour(9).minute(0);
      const defaultEnd = dayjs().hour(10).minute(0);

      setTimeout(() => {
        form.setFieldsValue({
          title: "",
          date: defaultStart,
          startTime: defaultStart,
          endTime: defaultEnd,
          roomId: undefined,
          deviceIds: [prefilledDevice.id], // Auto select prefilled
          participantIds: [],
          guestEmails: [],
          isRecurring: false,
          frequency: "DAILY",
          repeatUntil: undefined,
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
    try {
      setLoading(true);

      const date = values.date;
      const startTime = dayjs(values.startTime);
      const endTime = dayjs(values.endTime);

      if (endTime.isBefore(startTime) || endTime.isSame(startTime)) {
        toast.error("Giờ kết thúc phải sau giờ bắt đầu!");
        return;
      }

      if (!validateBusinessTime(startTime, endTime)) {
        toast.error("⏰ Chỉ được đặt lịch từ 08:00 đến 18:00!");
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
        toast.info("📝 Yêu cầu đặt phòng đã được gửi và đang chờ Admin phê duyệt.");
      } else {
        toast.success("🎉 Tạo cuộc họp thành công!");
      }

      form.resetFields();
      setIsRecurring(false);
      setAvailableDevices([]);

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

      if (raw.includes("phòng") && raw.includes("đã bị đặt")) {
        msg = "Phòng họp đã được đặt trong khung giờ này";
      }
      else if (raw.includes("người tham dự") && raw.includes("trùng lịch")) {
        msg = "Người tham gia bị trùng lịch trong khung giờ này";
      }
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
    setIsRecurring(false);
    onCancel();
  };

  /* ====== UI ====== */
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
              { required: true, message: t("form.titleRequired") },
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

            {/* START TIME */}
            <Form.Item
              name="startTime"
              label={t("form.time")}
              rules={[{ required: true, message: t("form.timeRequired") }]}>
              <TimePicker
                format="HH:mm"
                minuteStep={15}
                className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="Giờ bắt đầu"
                showNow={false}
              />
            </Form.Item>

            {/* END TIME */}
            <Form.Item
              name="endTime"
              label="Giờ kết thúc" // Hardcoded label as no key in i18n file yet maybe
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

            {/* REMOVED DURATION + CUSTOM HOUR */}
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
              classNames={{ popup: "dark:bg-gray-700 dark:text-gray-100" }}
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

          <Form.Item
            name="deviceIds"
            label={t("form.devices")}
            tooltip={t("form.deviceTooltip")}
          >
            <Select
              mode="multiple"
              disabled={!watchedDate || !watchedStartTime || !watchedEndTime}
              loading={devicesLoading}
              placeholder={
                !watchedDate || !watchedStartTime || !watchedEndTime
                  ? t("form.selectDateTimeFirst")
                  : t("form.selectMoreDevices")
              }
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              classNames={{ popup: "dark:bg-gray-700 dark:text-gray-100" }}
              onChange={(selectedIds) => {
                if (prefilledDevice && !selectedIds.includes(prefilledDevice.id)) {
                  // Prevent unselecting the prefilled device? Or allow?
                  // The logic above ensures it stays in option list.
                  // If user unselects it, maybe we should warn or auto-reselect?
                  // For now, let user deselect if they want, but usually BookDevice means booking THAT device.
                  // Let's force it:
                  form.setFieldsValue({
                    deviceIds: [...selectedIds, prefilledDevice.id],
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
                          <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            (Đã chọn - Bắt buộc)
                          </span>
                        )}
                      </span>
                      <Tag color={d.status === "AVAILABLE" ? "green" : "red"}>
                        {d.status === "AVAILABLE" ? "Có sẵn" : "Bảo trì"}
                      </Tag>
                    </div>
                  </Option>
                );
              })}
            </Select>
          </Form.Item>

          {/* Device Info Display */}
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg">
            <p className="text-sm text-emerald-800 dark:text-emerald-300">
              <span className="font-semibold">{t("deviceInfo.title")}</span> {prefilledDevice?.name}
              {prefilledDevice?.description && ` - ${prefilledDevice.description}`}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
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
              classNames={{ popup: "dark:bg-gray-700 dark:text-gray-100" }}
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
            initialValue={[]}
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
              classNames={{ popup: "dark:bg-gray-700 dark:text-gray-100" }}
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
                  classNames={{ popup: "dark:bg-gray-700 dark:text-gray-100" }}
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600"
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