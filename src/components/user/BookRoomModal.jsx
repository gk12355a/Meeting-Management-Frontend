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

// MUI STATIC TIME PICKER
import { LocalizationProvider } from "@mui/x-date-pickers";
import { StaticTimePicker } from "@mui/x-date-pickers/StaticTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

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

  /* ===== SET INITIAL FORM VALUES WITH PREFILLED ROOM ====== */
  useEffect(() => {
  if (open && prefilledRoom) {
    setIsRecurring(false);

    // Mặc định 09:00
    let defaultClock = dayjs().hour(9).minute(0);

    // Nếu có slot được chọn từ calendar -> dùng giờ đó
    if (start && end) {
      const startD = dayjs(start);
      const endD = dayjs(end);
      const durationMin = Math.max(endD.diff(startD, "minute"), 15); // tối thiểu 15p

      defaultClock = startD;

      setTimeout(() => {
        form.setFieldsValue({
          title: "",
          date: startD,
          time: startD,
          duration: durationMin,
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
    } else {
      // Trường hợp user mở modal mà không đi qua calendar
      setTimeout(() => {
        form.setFieldsValue({
          title: "",
          date: undefined,
          time: undefined,
          duration: 60,
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
    }

    setClockValue(defaultClock);
    setSearchResults([]);
    setAvailableDevices([]);
  }
}, [open, prefilledRoom, start, end, form]);

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
        const endTime = startTimeUTC
          .add(watchedDuration, "minute")
          .toISOString();

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
  }, [watchedDate, watchedTime, watchedDuration]);

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
  const validateBusinessTime = (value) => {
    if (!value) return false;
    const totalMin = value.hour() * 60 + value.minute();
    return totalMin >= 480 && totalMin <= 1080; // 08:00 - 18:00
  };

  /* ===== SUBMIT MEETING ====== */
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

      const payload = {
        title: values.title.trim(),
        description: values.description || "",
        startTime: startUTC.toISOString(),
        endTime: startUTC.add(values.duration, "minute").toISOString(),
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
      setClockValue(dayjs().hour(9).minute(0));
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
}
 finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setClockValue(dayjs().hour(9).minute(0));
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
      bodyStyle={{ paddingTop: 18, paddingBottom: 10 }}
    >
      <Card
  className="shadow-none bg-white dark:bg-[#1e293b] border-none dark:text-gray-100"
  bodyStyle={{ padding: 0 }}
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

            {/* TIME PICKER */}
            <Form.Item
              name="time"
              label={t("startTime")}
              rules={[{ required: true, message: "Chọn giờ bắt đầu" }]}
            >
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
                    🕒 {t("chooseClock")}
                  </Button>
                </div>

                <Modal
                  title={t("chooseTimeTitle")}
                  open={clockOpen}
                  onCancel={() => setClockOpen(false)}
                  onOk={() => {
                    if (!validateBusinessTime(clockValue)) {
                      toast.error(t("invalidTime"));
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

            {/* DURATION */}
            <Form.Item
              name="duration"
              label={t("duration")}
              initialValue={60}
              rules={[{ required: true, message: "Chọn thời lượng" }]}
            >
              <Select
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                popupClassName="dark:bg-gray-700 dark:text-gray-100"
              >
                <Option value={15}>15 phút</Option>
                <Option value={30}>30 phút</Option>
                <Option value={45}>45 phút</Option>
                <Option value={60}>1 giờ</Option>
                <Option value={90}>1 giờ 30 phút</Option>
                <Option value={120}>2 giờ</Option>
              </Select>
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
              disabled={!watchedDate || !watchedTime}
              loading={devicesLoading}
              placeholder={
                !watchedDate || !watchedTime
                  ? t("deviceNeedDate")
                  : t("devicePlaceholder")
              }
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              popupClassName="dark:bg-gray-700 dark:text-gray-100"
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
              popupClassName="dark:bg-gray-700 dark:text-gray-100"
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
                  popupClassName="dark:bg-gray-700 dark:text-gray-100"
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