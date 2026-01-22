// src/components/user/BookRoomModal.jsx
import { useEffect, useState, useRef } from "react";
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
  TimePicker, // [Updated] Import TimePicker
  Tag,
} from "antd";
import { FiPlusCircle, FiUsers } from "react-icons/fi";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import utc from "dayjs/plugin/utc";
import { toast } from "react-toastify";

import { createMeeting } from "../../services/meetingService";
import { searchUsers } from "../../services/userService";
import { getAvailableDevices } from "../../services/deviceService";
import { useAuth } from "../../context/AuthContext";
import RoomSchedule from "./RoomSchedule";
import { useTranslation } from "react-i18next";

// [Updated] Removed MUI imports

dayjs.locale("vi");
dayjs.extend(utc);

const { TextArea } = Input;
const { Option } = Select;

const BookRoomModal = ({ open, onCancel, prefilledRoom, start, end, onSuccess }) => {
  const { t } = useTranslation("bookRoom");
  const [loading, setLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  const [availableDevices, setAvailableDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const debounceTimer = useRef(null);
  const [form] = Form.useForm();
  const { user } = useAuth();

  // Watch form values để tải devices tự động
  const watchedDate = Form.useWatch("date", form);
  const watchedStartTime = Form.useWatch("startTime", form); // [Updated]
  const watchedEndTime = Form.useWatch("endTime", form);     // [Updated]

  useEffect(() => {
    if (open && prefilledRoom) {
      setIsRecurring(false);

      // Default logic
      let defaultDate = undefined;
      let defaultStart = dayjs().hour(9).minute(0);
      let defaultEnd = dayjs().hour(10).minute(0);

      // Nếu có slot được chọn từ calendar -> dùng giờ đó
      if (start && end) {
        defaultDate = dayjs(start);
        defaultStart = dayjs(start);
        defaultEnd = dayjs(end);
      }

      setTimeout(() => {
        form.setFieldsValue({
          title: "",
          date: defaultDate,
          startTime: defaultStart,
          endTime: defaultEnd,
          roomId: prefilledRoom.id,
          deviceIds: [],
          participantIds: [],
          guestEmails: [],
          isRecurring: false,
          frequency: "DAILY",
          repeatUntil: undefined,
          description: "",
        });
      }, 100);

      setSearchResults([]);
      setAvailableDevices([]);
    }
  }, [open, prefilledRoom, start, end, form]);

  /* ===================================================
          LOAD DEVICES WHEN TIME CHANGES
  ==================================================== */
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
        setAvailableDevices(res.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải thiết bị khả dụng!");
      } finally {
        setDevicesLoading(false);
      }
    };

    const t = setTimeout(fetchDevices, 500);
    return () => clearTimeout(t);
  }, [watchedDate, watchedStartTime, watchedEndTime]);

  /* ===== SEARCH INTERNAL USERS ====== */
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

  /* ===== VALIDATE BUSINESS TIME ====== */
  const validateBusinessTime = (start, end) => {
    if (!start || !end) return false;
    const startMin = start.hour() * 60 + start.minute();
    const endMin = end.hour() * 60 + end.minute();
    // 08:00 - 18:00
    if (startMin < 480 || startMin >= 1080) return false;
    if (endMin <= 480 || endMin > 1080) return false;
    return true;
  };

  /* ===== SUBMIT MEETING ====== */
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
            }
            : null,

        onBehalfOfUserId: null,
      };

      await createMeeting(payload);

      toast.success(t("success", { name: prefilledRoom?.name }));
      form.resetFields();
      setAvailableDevices([]);
      setIsRecurring(false);
      onSuccess?.();
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
    }
    finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setAvailableDevices([]);
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
          <FiPlusCircle /> {t("title", { name: prefilledRoom?.name })}
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
        {prefilledRoom && (
          <RoomSchedule roomId={prefilledRoom.id} />
        )}

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
            label={t("meetingTitle")}
            rules={[
              { required: true, message: t("meetingTitleRequired") },
              { min: 3, message: t("meetingTitleShort") }
            ]}
          >
            <Input
              placeholder={t("meetingTitlePlaceholder")}
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </Form.Item>

          {/* TIME */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* DATE */}
            <Form.Item
              name="date"
              label={t("date")}
              rules={[{ required: true, message: t("dateRequired") }]}
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

            {/* END TIME */}
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

          {/* ROOM (Hidden - prefilled) */}
          <Form.Item name="roomId" hidden>
            <Input />
          </Form.Item>

          {/* Room Info Display */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-semibold">📍 {t("roomLabel")}:</span> {prefilledRoom?.name}
              {prefilledRoom?.location && ` - ${prefilledRoom.location}`}
              {prefilledRoom?.capacity && ` (${prefilledRoom.capacity} ${t("people")})`}
            </p>
          </div>

          {/* DEVICES */}
          <Form.Item name="deviceIds" label={t("deviceLabel")}>
            <Select
              mode="multiple"
              disabled={!watchedDate || !watchedStartTime || !watchedEndTime}
              loading={devicesLoading}
              placeholder={
                !watchedDate || !watchedStartTime || !watchedEndTime
                  ? t("deviceNeedDate")
                  : t("devicePlaceholder")
              }
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
                    <span
                      className={`px-2 py-1 rounded text-xs ${d.status === "AVAILABLE"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                        }`}
                    >
                      {d.status === "AVAILABLE" ? t("deviceAvailable") : t("deviceBusy")}
                    </span>
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
                {t("participants")}
              </span>
            }
          >
            <Select
              mode="multiple"
              showSearch
              loading={isSearching}
              filterOption={false}
              onSearch={handleSearchUsers}
              placeholder={t("participantsPlaceholder")}
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              classNames={{ popup: "dark:bg-gray-700 dark:text-gray-100" }}
              notFoundContent={isSearching ? <Spin size="small" /> : t("noUser")}
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
            label={t("guestEmail")}
            tooltip={t("emailTooltip")}
            rules={[
              {
                validator(_, list) {
                  if (!list || !list.length) return Promise.resolve();
                  const invalid = list.filter(
                    (e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
                  );
                  return invalid.length
                    ? Promise.reject(
                      t("invalidEmail", { list: invalid.join(", ") })
                    )
                    : Promise.resolve();
                },
              },
            ]}
          >
            <Select
              mode="tags"
              tokenSeparators={[",", ";", " "]}
              placeholder={t("guestEmailPlaceholder")}
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
              {t("repeat")}
            </Checkbox>
          </Form.Item>

          {isRecurring && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="frequency"
                label={t("frequency")}
                rules={[{ required: true, message: t("frequencyRequired") }]}
              >
                <Select
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  classNames={{ popup: "dark:bg-gray-700 dark:text-gray-100" }}
                >
                  <Option value="DAILY">{t("daily")}</Option>
                  <Option value="WEEKLY">{t("weekly")}</Option>
                  <Option value="MONTHLY">{t("monthly")}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="repeatUntil"
                label={t("repeatUntil")}
                rules={[{ required: true, message: t("repeatUntilRequired") }]}
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
          <Form.Item name="description" label={t("note")}>
            <TextArea
              rows={3}
              placeholder={t("notePlaceholder")}
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </Form.Item>

          {/* SUBMIT */}
          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={handleCancel} disabled={loading}>
              {t("cancel")}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {t("submit")}
            </Button>
          </div>
        </Form>
      </Card>
    </Modal>
  );
};

export default BookRoomModal;