// src/components/user/QuickBookingModal.jsx
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

const QuickBookingModal = ({ open, onCancel, quickBookingData, onSuccess, onLockViewDate }) => {
  const { t } = useTranslation("quickBook");
  const DAYS_OF_WEEK = [
    { value: "MONDAY", label: t("week.mon") },
    { value: "TUESDAY", label: t("week.tue") },
    { value: "WEDNESDAY", label: t("week.wed") },
    { value: "THURSDAY", label: t("week.thu") },
    { value: "FRIDAY", label: t("week.fri") },
    { value: "SATURDAY", label: t("week.sat") },
    { value: "SUNDAY", label: t("week.sun") },
  ];
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);

  const [availableDevices, setAvailableDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  const [selectedDays, setSelectedDays] = useState([]);

  const debounceTimer = useRef(null);
  const [form] = Form.useForm();
  const { user } = useAuth();

  // Watch form values
  const watchedDate = Form.useWatch("date", form);
  const watchedStartTime = Form.useWatch("startTime", form); // [Updated] Watch startTime
  const watchedEndTime = Form.useWatch("endTime", form);     // [Updated] Watch endTime
  const watchedRoomId = Form.useWatch("roomId", form);
  const watchedFrequency = Form.useWatch("frequency", form);

  /* LOAD ROOMS */
  useEffect(() => {
    if (!open) return;

    const loadRooms = async () => {
      try {
        const res = await getRooms();
        setRooms(res.data || []);
      } catch {
        toast.error(t("errors.loadRooms"));
      }
    };
    loadRooms();
  }, [open]);

  /* ===== SET INITIAL FORM VALUES =====*/
  useEffect(() => {
    if (open && quickBookingData?.start) {
      const { start, end } = quickBookingData;
      // Default duration is calculated but we will use start and end times directly
      let duration = end.diff(start, "minute");

      // If duration is 0 or negative (invalid), default to 1 hour
      let defaultEnd = end;
      if (duration <= 0) {
        defaultEnd = start.add(60, 'minute');
      }

      setIsRecurring(false);
      setSelectedDays([]);

      setTimeout(() => {
        form.setFieldsValue({
          title: "",
          date: start,
          startTime: start,
          endTime: defaultEnd,
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
      setAvailableDevices([]);
    }
  }, [open, quickBookingData, form]);

  /* ===== LOAD DEVICES WHEN TIME CHANGES =====*/
  useEffect(() => {
    const fetchDevices = async () => {
      // Need all 3 fields to calculate interval
      if (!watchedDate || !watchedStartTime || !watchedEndTime) {
        setAvailableDevices([]);
        return;
      }

      // Check if end > start
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
        setAvailableDevices(res.data || []);
      } catch (err) {
        console.error(err);
        toast.error(t("errors.loadDevices"));
      } finally {
        setDevicesLoading(false);
      }
    };

    const t = setTimeout(fetchDevices, 500);
    return () => clearTimeout(t);
  }, [watchedDate, watchedStartTime, watchedEndTime]);

  /* SEARCH INTERNAL USERS */
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
        toast.error(t("errors.searchUsers"));
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  /* VALIDATE BUSINESS TIME */
  const validateBusinessTime = (start, end) => {
    if (!start || !end) return false;
    const startMin = start.hour() * 60 + start.minute();
    const endMin = end.hour() * 60 + end.minute();

    // Business hours: 08:00 (480) - 18:00 (1080)
    // Allow end time to be exactly 18:00
    if (startMin < 480 || startMin >= 1080) return false;
    if (endMin <= 480 || endMin > 1080) return false;

    return true;
  };

  /* SUBMIT MEETING */
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
        toast.error("Giờ kết thúc phải sau giờ bắt đầu!");
        return;
      }

      if (!validateBusinessTime(startTime, endTime)) {
        toast.error(t("errors.outsideBusiness")); // 08:00 - 18:00
        return;
      }

      const startUTC = dayjs
        .utc()
        .year(date.year())
        .month(date.month())
        .date(date.date())
        .hour(startTime.hour())
        .minute(startTime.minute());

      const endUTC = dayjs
        .utc()
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
              ...(values.frequency === "WEEKLY" && values.daysOfWeek?.length > 0
                ? { daysOfWeek: values.daysOfWeek }
                : {}),
            }
            : null,
        onBehalfOfUserId: null,
      };

      const res = await createMeeting(payload);

      if (res.data?.status === "PENDING_APPROVAL") {
        toast.info(t("messages.pendingApproval"));
      } else {
        toast.success(t("messages.createSuccess"));

        if (onLockViewDate && quickBookingData?.start) {
          onLockViewDate(quickBookingData.start.toDate());
        }
      }

      handleCancel();
      onSuccess?.();
    } catch (err) {
      console.error("ERROR:", err?.response?.data);

      const backendMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        t("errors.createFailed");

      const raw = backendMsg.toLowerCase();
      let msg = t("errors.createFailed");

      if (raw.includes("phòng") && raw.includes("đã bị đặt")) {
        msg = t("errors.roomBusy");
      }
      else if (raw.includes("người tham dự") && raw.includes("trùng lịch")) {
        msg = t("errors.participantBusy");
      }
      else if (raw.includes("bảo trì") && raw.includes("phòng")) {
        msg = t("errors.roomMaintenance");
      }
      else if (raw.includes("thiết bị") && raw.includes("bảo trì")) {
        msg = t("errors.deviceMaintenance");
      }
      else if (raw.includes("recurrence") || raw.includes("định kỳ")) {
        msg = t("errors.recurrenceConflict");
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
    setAvailableDevices([]);
    setIsRecurring(false);
    setSelectedDays([]);
    onCancel();
  };

  /* RENDER */
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
          <FiPlusCircle /> {t("title")}
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
            label={t("fields.meetingTitle")}
            rules={[
              { required: true, message: t("fields.meetingTitleRequired") },
              { min: 3, message: t("fields.meetingTitleTooShort") }
            ]}
          >
            <Input
              placeholder={t("fields.meetingTitlePlaceholder")}
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </Form.Item>

          {/* DATE - TIME - DURATION */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Form.Item
              name="date"
              label={t("fields.date")}
              rules={[{ required: true, message: t("fields.dateRequired") }]}
            >
              <DatePicker
                className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                format="DD/MM/YYYY"
                disabledDate={(d) => d && d < dayjs().startOf("day")}
              />
            </Form.Item>

            {/* START TIME */}
            <Form.Item
              name="startTime"
              label={t("fields.startTime")}
              rules={[{ required: true, message: "Vui lòng chọn giờ bắt đầu" }]}
            >
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
              label={t("fields.endTime")} // Ensure this key exists in your translation or use a hardcoded fallback
              rules={[{ required: true, message: "Vui lòng chọn giờ kết thúc" }]}
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

          {/* ROOM SELECT */}
          <Form.Item
            name="roomId"
            label={t("fields.room")}
            rules={[{ required: true, message: t("fields.roomRequired") }]}
          >
            <Select
              placeholder={t("fields.roomPlaceholder")}
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
                      {r.name} ({r.capacity} {t("fields.seat")})
                    </span>
                    <Tag color={r.status === "AVAILABLE" ? "green" : "red"}>
                      {r.status === "AVAILABLE" ? t("fields.roomAvailable") : t("fields.roomMaintenance")}
                    </Tag>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* DEVICES */}
          <Form.Item name="deviceIds" label={t("fields.devices")}>
            <Select
              mode="multiple"
              placeholder={
                !watchedDate || !watchedStartTime || !watchedEndTime
                  ? t("fields.deviceSelectBefore") // Or "Vui lòng chọn ngày giờ trước"
                  : t("fields.devices")
              }
              loading={devicesLoading}
              disabled={!watchedDate || !watchedStartTime || !watchedEndTime || devicesLoading}
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              classNames={{ popup: "dark:bg-gray-700 dark:text-gray-100" }}
            >
              {availableDevices.map((d) => (
                <Option
                  key={d.id}
                  value={d.id}
                  disabled={d.status !== "AVAILABLE"}
                >
                  <div className="flex justify-between items-center">
                    <span>{d.name}</span>
                    <Tag color={d.status === "AVAILABLE" ? "green" : "red"}>
                      {d.status === "AVAILABLE"
                        ? t("fields.deviceAvailable")
                        : t("fields.deviceUnavailable")}
                    </Tag>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider className="dark:border-gray-700" />

          {/* PARTICIPANTS */}
          <Form.Item
            name="participantIds"
            label={
              <span>
                <FiUsers className="inline mr-2" />
                {t("fields.participantsInternal")}
              </span>
            }
          >
            <Select
              mode="multiple"
              showSearch
              filterOption={false}
              onSearch={handleSearchUsers}
              loading={isSearching}
              placeholder={t("fields.participantPlaceholder")}
              notFoundContent={isSearching ? <Spin size="small" /> : t("fields.participantNotFound")}
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              classNames={{ popup: "dark:bg-gray-700 dark:text-gray-100" }}
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
            label={t("fields.guestEmails")}
            tooltip={t("fields.guestEmailTooltip")}
            rules={[
              {
                validator: (_, list) => {
                  if (!list || !list.length) return Promise.resolve();
                  const invalid = list.filter(
                    (e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
                  );
                  return invalid.length
                    ? Promise.reject(t("fields.guestEmailInvalid") + invalid.join(", "))
                    : Promise.resolve();
                },
              },
            ]}
          >
            <Select
              mode="tags"
              tokenSeparators={[" ", ",", ";"]}
              placeholder="guest@example.com"
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </Form.Item>

          <Divider className="dark:border-gray-700" />

          {/* RECURRING */}
          <Form.Item name="isRecurring" valuePropName="checked" className="mb-1">
            <Checkbox
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="dark:text-gray-200"
            >
              {t("fields.repeatMeeting")}
            </Checkbox>
          </Form.Item>

          {/* Recurring UI */}
          {isRecurring && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="frequency"
                label={t("fields.frequency")}
                rules={[{ required: true, message: t("fields.frequencyRequired") }]}
              >
                <Select
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  onChange={(value) => {
                    // Reset daysOfWeek khi đổi frequency
                    if (value !== "WEEKLY") {
                      setSelectedDays([]);
                      form.setFieldsValue({ daysOfWeek: [] });
                    }
                  }}
                >
                  <Option value="DAILY">{t("fields.frequencyDaily")}</Option>
                  <Option value="WEEKLY">{t("fields.frequencyWeekly")}</Option>
                  <Option value="MONTHLY">{t("fields.frequencyMonthly")}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="repeatUntil"
                label={t("fields.repeatUntil")}
                rules={[{ required: true, message: t("fields.repeatUntilRequired") }]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  disabledDate={(c) => c && c <= dayjs().startOf("day")}
                />
              </Form.Item>
            </div>
          )}

          {/* Chọn riêng được các ngày trong tuần */}
          {isRecurring && watchedFrequency === "WEEKLY" && (
            <Form.Item
              name="daysOfWeek"
              label={t("fields.weeklyDays")}
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || value.length === 0) {
                      return Promise.reject(t("fields.weeklyDaysRequired"))
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              className="mt-4"
            >
              <Checkbox.Group
                value={selectedDays}
                onChange={(checkedValues) => {
                  setSelectedDays(checkedValues);
                  form.setFieldsValue({ daysOfWeek: checkedValues });
                }}
                className="w-full"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DAYS_OF_WEEK.map((day) => (
                    <Checkbox
                      key={day.value}
                      value={day.value}
                      className="dark:text-gray-200"
                    >
                      {day.label}
                    </Checkbox>
                  ))}
                </div>
              </Checkbox.Group>
            </Form.Item>
          )}

          {/* DESCRIPTION */}
          <Form.Item name="description" label={t("fields.note")}>
            <TextArea
              rows={3}
              placeholder={t("fields.notePlaceholder")}
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </Form.Item>

          {/* SUBMIT BUTTONS */}
          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={handleCancel} disabled={loading}>
              {t("buttons.cancel")}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              {t("buttons.submit")}
            </Button>
          </div>
        </Form>
      </Card>
    </Modal>
  );
};

export default QuickBookingModal;