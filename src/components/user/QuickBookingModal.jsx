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

dayjs.locale("vi");
dayjs.extend(utc);

const { TextArea } = Input;
const { Option } = Select;

// Thêm constant DAYS_OF_WEEK TRƯỚC COMPONENT
const DAYS_OF_WEEK = [
  { value: "MONDAY", label: "Thứ 2" },
  { value: "TUESDAY", label: "Thứ 3" },
  { value: "WEDNESDAY", label: "Thứ 4" },
  { value: "THURSDAY", label: "Thứ 5" },
  { value: "FRIDAY", label: "Thứ 6" },
  { value: "SATURDAY", label: "Thứ 7" },
  { value: "SUNDAY", label: "Chủ nhật" },
];

const QuickBookingModal = ({ open, onCancel, quickBookingData, onSuccess, onLockViewDate }) => {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);

  const [availableDevices, setAvailableDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  // ← THÊM 2 DÒNG NÀY
  const [selectedDays, setSelectedDays] = useState([]);

  // TIME PICKER STATE
  const [clockOpen, setClockOpen] = useState(false);
  const [clockValue, setClockValue] = useState(dayjs());

  const debounceTimer = useRef(null);
  const [form] = Form.useForm();
  const { user } = useAuth();

  // Watch form values
  const watchedDate = Form.useWatch("date", form);
  const watchedTime = Form.useWatch("time", form);
  const watchedDuration = Form.useWatch("duration", form);
  const watchedRoomId = Form.useWatch("roomId", form); // Vẫn watch để logic form hoạt động, nhưng không set state VIP nữa
  const watchedFrequency = Form.useWatch("frequency", form);

  /* LOAD ROOMS */
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

  // Đã xóa useEffect theo dõi selectedRoom VIP

  /* ===== SET INITIAL FORM VALUES =====*/
  useEffect(() => {
    if (open && quickBookingData?.start) {
      const { start, end } = quickBookingData;
      let duration = end.diff(start, "minute");
      if (duration <= 0) duration = 60;

      setIsRecurring(false);
      setSelectedDays([]);

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
      setAvailableDevices([]);
    }
  }, [open, quickBookingData, form]);

  /* ===== LOAD DEVICES WHEN TIME CHANGES =====*/
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
        const endTime = startTimeUTC.add(watchedDuration, "minute").toISOString();

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
        toast.error("Không thể tìm kiếm người dùng.");
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  /* VALIDATE BUSINESS TIME */
  const validateBusinessTime = (value) => {
    if (!value) return false;
    const totalMin = value.hour() * 60 + value.minute();
    return totalMin >= 480 && totalMin <= 1080; // 08:00 - 18:00
  };

  /* SUBMIT MEETING */
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

      // Cập nhật payload: Nếu weekly thì thêm daysOfWeek nếu có
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
                ...(values.frequency === "WEEKLY" && values.daysOfWeek?.length > 0
                  ? { daysOfWeek: values.daysOfWeek }
                  : {}),
              }
            : null,
        onBehalfOfUserId: null,
      };

      const res = await createMeeting(payload);

      if (res.data?.status === "PENDING_APPROVAL") {
        toast.info("Yêu cầu đặt phòng đã được gửi và đang chờ Admin phê duyệt.");
      } else {
        toast.success("Tạo cuộc họp thành công!");

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

      // === 3️⃣ Phòng họp đang bảo trì ===
      else if (raw.includes("bảo trì") && raw.includes("phòng")) {
        msg = "🚫 Phòng họp đang bảo trì, vui lòng chọn phòng khác!";
      }

      // === 4️⃣ Thiết bị đang bảo trì ===
      else if (raw.includes("thiết bị") && raw.includes("bảo trì")) {
        msg = "Một thiết bị bạn chọn đang bảo trì • vui lòng bỏ chọn thiết bị đó.";
      }

      // === 5️⃣ Xung đột lịch định kỳ ===
      else if (raw.includes("recurrence") || raw.includes("định kỳ")) {
        msg = "❌ Lịch họp định kỳ bị trùng lịch • vui lòng kiểm tra lại.";
      }

      // === 6️⃣ Fallback chung ===
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

  // Cập nhật hàm handleCancel: reset selectedDays
  const handleCancel = () => {
    form.resetFields();
    setClockValue(dayjs());
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
          <FiPlusCircle /> Đặt lịch phòng họp nhanh
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
        <Form
          layout="vertical"
          form={form}
          disabled={loading}
          onFinish={handleCreateMeeting}
          initialValues={{
            hour: 8,
            minute: 0,
            time: dayjs().hour(8).minute(0),
            duration: 60
          }}
          onValuesChange={(vals) => {
            if (vals.isRecurring !== undefined) setIsRecurring(vals.isRecurring);
          }}
        >
          {/* TITLE */}
          <Form.Item
            name="title"
            label="Tên cuộc họp"
            rules={[
              { required: true, message: "Vui lòng nhập tên cuộc họp" },
              { min: 3, message: "Tên cuộc họp quá ngắn" },
            ]}
          >
            <Input
              placeholder="Nhập tên cuộc họp..."
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </Form.Item>

          {/* DATE - TIME - DURATION */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Form.Item
              name="date"
              label="Ngày họp"
              rules={[{ required: true, message: "Chọn ngày họp" }]}
            >
              <DatePicker
                className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                format="DD/MM/YYYY"
                disabledDate={(d) => d && d < dayjs().startOf("day")}
              />
            </Form.Item>

            <Form.Item name="hour" hidden><Input /></Form.Item>
                          <Form.Item name="minute" hidden><Input /></Form.Item>
            
                          <Form.Item name="time" label="Giờ bắt đầu" rules={[{ required: true }]}>
                          <div className="grid grid-cols-2 gap-2">
            
                          {/* Chọn giờ */}
                          <Select
                        placeholder="Giờ"
                        value={form.getFieldValue("hour")}
                        onChange={(h) => {
                          const m = form.getFieldValue("minute") || 0;
                          const time = dayjs().hour(h).minute(m);
                          form.setFieldsValue({ time, hour: h });
                        }}
                        className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        options={Array.from({ length: 11 }, (_, i) => {
                          const hour = i + 8; // 8 → 18
                          return {
                            label: hour.toString().padStart(2, "0"),
                            value: hour,
                          };
                        })}
                      />
            
                          <Select
                        placeholder="Phút"
                        value={form.getFieldValue("minute")}
                        onChange={(m) => {
                          const h = form.getFieldValue("hour") || 8;
                          const time = dayjs().hour(h).minute(m);
                          form.setFieldsValue({ time, minute: m });
                        }}
                        className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        options={Array.from({ length: 60 }, (_, i) => ({
                          label: i.toString().padStart(2, "0"),
                          value: i,
                        }))}
                      />
            
                        </div>
                      </Form.Item>

            <Form.Item
              name="duration"
              label="Thời lượng"
              initialValue={60}
              rules={[{ required: true, message: "Chọn thời lượng" }]}
            >
              <Select className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                <Option value={15}>15 phút</Option>
                <Option value={30}>30 phút</Option>
                <Option value={45}>45 phút</Option>
                <Option value={60}>1 giờ</Option>
                <Option value={90}>1 giờ 30 phút</Option>
                <Option value={120}>2 giờ</Option>
              </Select>
            </Form.Item>
          </div>

          {/* ROOM SELECT */}
          <Form.Item
            name="roomId"
            label="Phòng họp"
            rules={[{ required: true, message: "Chọn phòng họp" }]}
          >
            <Select
              placeholder="-- Chọn phòng họp --"
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
            <Select
              mode="multiple"
              placeholder={
                !watchedDate || !watchedTime
                  ? "Vui lòng chọn thời gian trước"
                  : "Chọn thiết bị khả dụng"
              }
              loading={devicesLoading}
              disabled={!watchedDate || !watchedTime || devicesLoading}
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
                    <Tag color={d.status === "AVAILABLE" ? "green" : "red"}>
                      {d.status === "AVAILABLE" ? "Có sẵn" : "Bảo trì"}
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
              placeholder="-- Gõ tên hoặc email để tìm --"
              notFoundContent={isSearching ? <Spin size="small" /> : "Không tìm thấy"}
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
            rules={[
              {
                validator: (_, list) => {
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
              Lặp lại cuộc họp
            </Checkbox>
          </Form.Item>

          {/* Recurring UI */}
          {isRecurring && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="frequency"
                label="Tần suất"
                rules={[{ required: true, message: "Chọn tần suất" }]}
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
              label="Chọn các thứ trong tuần"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || value.length === 0) {
                      return Promise.reject("Vui lòng chọn ít nhất 1 thứ");
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
          <Form.Item name="description" label="Ghi chú">
            <TextArea
              rows={3}
              placeholder="Ghi chú thêm cho cuộc họp..."
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </Form.Item>

          {/* SUBMIT BUTTONS */}
          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={handleCancel} disabled={loading}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Tạo cuộc họp
            </Button>
          </div>
        </Form>
      </Card>
    </Modal>
  );
};

export default QuickBookingModal;