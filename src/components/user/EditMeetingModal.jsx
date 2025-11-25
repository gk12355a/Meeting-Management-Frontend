// src/components/user/EditMeetingModal.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Card,
  Divider,
  Checkbox,
  Spin,
  Tag,
  Alert,
} from "antd";
import { FiEdit, FiUsers, FiInfo, FiMail, FiCalendar } from "react-icons/fi";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import utc from "dayjs/plugin/utc";
import { toast } from "react-toastify";

import {
  getRooms,
  updateMeeting,
  updateRecurringSeries,
} from "../../services/meetingService";
import { searchUsers } from "../../services/userService";
import { getAvailableDevices } from "../../services/deviceService";
import { useAuth } from "../../context/AuthContext";

// MUI STATIC TIME PICKER
import { LocalizationProvider } from "@mui/x-date-pickers";
import { StaticTimePicker } from "@mui/x-date-pickers/StaticTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

dayjs.locale("vi");
dayjs.extend(utc);

const { TextArea } = Input;
const { Option } = Select;

// ENUM cho các ngày trong tuần
const DAYS_OF_WEEK_OPTIONS = [
  { label: "T2", value: "MONDAY" },
  { label: "T3", value: "TUESDAY" },
  { label: "T4", value: "WEDNESDAY" },
  { label: "T5", value: "THURSDAY" },
  { label: "T6", value: "FRIDAY" },
  { label: "T7", value: "SATURDAY" },
  { label: "CN", value: "SUNDAY" },
];

const EditMeetingModal = ({ open, onCancel, meetingDetail, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);

  const [availableDevices, setAvailableDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // State để biết cuộc họp này có phải là định kỳ không
  const [isRecurringSeries, setIsRecurringSeries] = useState(false);

  // State cho Modal Xác nhận (Chọn sửa 1 hay sửa chuỗi)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);

  const [selectedRoom, setSelectedRoom] = useState(null);

  // TIME PICKER STATE
  const [clockOpen, setClockOpen] = useState(false);
  const [clockValue, setClockValue] = useState(dayjs());

  const debounceTimer = useRef(null);
  const { user } = useAuth();

  // Watch form values
  const watchedDate = Form.useWatch("date", form);
  const watchedTime = Form.useWatch("time", form);
  const watchedDuration = Form.useWatch("duration", form);
  const watchedRoomId = Form.useWatch("roomId", form);
  const watchedFrequency = Form.useWatch("frequency", form); // Theo dõi tần suất

  /* ===================================================
                    LOAD ROOMS
  ==================================================== */
  useEffect(() => {
    if (!open || !meetingDetail) return;
    const fetchData = async () => {
      try {
        const res = await getRooms();
        setRooms(res.data || []);
      } catch (e) {
        toast.error("Không thể tải danh sách phòng họp!");
      }
    };
    fetchData();
  }, [open, meetingDetail]);

  /* ===================================================
            THEO DÕI PHÒNG VIP
  ==================================================== */
  useEffect(() => {
    const currentRoomId = watchedRoomId || meetingDetail?.room?.id;
    if (currentRoomId && rooms.length > 0) {
      const room = rooms.find((r) => r.id === currentRoomId);
      setSelectedRoom(room || null);
    } else {
      setSelectedRoom(null);
    }
  }, [watchedRoomId, rooms, meetingDetail]);

  /* ===================================================
          POPULATE FORM
  ==================================================== */
  useEffect(() => {
    if (!meetingDetail || !open) return;

    const startTime = dayjs(meetingDetail.startTime);
    const endTime = dayjs(meetingDetail.endTime);
    const duration = endTime.diff(startTime, "minute");

    // Kiểm tra xem có phải cuộc họp định kỳ không (dựa vào seriesId)
    const isSeries = !!meetingDetail.seriesId;
    setIsRecurringSeries(isSeries);
    setClockValue(startTime);

    form.setFieldsValue({
      title: meetingDetail.title,
      date: startTime,
      time: startTime,
      duration: duration,
      roomId: meetingDetail.room?.id,
      deviceIds: meetingDetail.devices?.map((d) => d.id) || [],
      participantIds:
        meetingDetail.participants
          ?.map((p) => p.id)
          .filter((id) => id !== user?.id) || [],
      guestEmails: meetingDetail.guestEmails || [],
      description: meetingDetail.description || "",

      // Recurrence fields (Luôn load để sẵn sàng nếu user chọn sửa chuỗi)
      frequency: meetingDetail.recurrenceRule?.frequency || "DAILY",
      repeatUntil: meetingDetail.recurrenceRule?.repeatUntil
        ? dayjs(meetingDetail.recurrenceRule.repeatUntil)
        : undefined,
      // [NEW] Populate daysOfWeek
      daysOfWeek: meetingDetail.recurrenceRule?.daysOfWeek || [],
    });

    if (meetingDetail.participants) {
      setSearchResults(
        meetingDetail.participants.filter((p) => p.id !== user?.id)
      );
    }

    if (startTime && duration) {
      loadDevicesForTime(startTime, duration);
    }
  }, [meetingDetail, open, form, user]);

  /* ===================================================
          LOAD DEVICES
  ==================================================== */
  const loadDevicesForTime = async (date, time, duration) => {
    if (!date || !time || !duration) {
      setAvailableDevices([]);
      return;
    }
    setDevicesLoading(true);
    try {
      const startTimeUTC = dayjs
        .utc()
        .year(date.year())
        .month(date.month())
        .date(date.date())
        .hour(time.hour())
        .minute(time.minute());

      const startTime = startTimeUTC.toISOString();
      const endTime = startTimeUTC.add(duration, "minute").toISOString();

      const res = await getAvailableDevices(startTime, endTime);
      const availableList = res.data || [];

      // Merge devices hiện tại để không bị ẩn khi đang edit
      const currentDevices = meetingDetail?.devices || [];
      const merged = [...availableList];
      currentDevices.forEach((cd) => {
        if (!merged.find((d) => d.id === cd.id)) {
          merged.push(cd);
        }
      });
      setAvailableDevices(merged);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải thiết bị khả dụng!");
    } finally {
      setDevicesLoading(false);
    }
  };

  useEffect(() => {
    if (!watchedDate || !watchedTime || !watchedDuration) return;
    const t = setTimeout(() => {
      loadDevicesForTime(watchedDate, watchedTime, watchedDuration);
    }, 500);
    return () => clearTimeout(t);
  }, [watchedDate, watchedTime, watchedDuration]);

  /* ===================================================
              SEARCH USERS & VALIDATION
  ==================================================== */
  const handleSearchUsers = (query) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!query?.trim()) {
      setSearchResults(
        meetingDetail?.participants?.filter((p) => p.id !== user?.id) || []
      );
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

  const validateBusinessTime = (value) => {
    if (!value) return false;
    const totalMin = value.hour() * 60 + value.minute();
    return totalMin >= 480 && totalMin <= 1080;
  };

  /* ===================================================
              HANDLE FORM SUBMIT
  ==================================================== */
  const handleSubmit = async (values) => {
    // 1. Validate cơ bản
    const date = values.date;
    const time = dayjs(values.time);
    if (!validateBusinessTime(time)) {
      toast.error("Chỉ được đặt lịch từ 08:00 đến 18:00!");
      return;
    }

    // 2. Nếu là cuộc họp định kỳ -> Hiện Modal hỏi
    if (isRecurringSeries) {
      setPendingValues(values);
      setConfirmModalOpen(true);
    } else {
      // 3. Nếu là cuộc họp thường -> Cập nhật luôn (Single)
      await executeUpdate(values, "SINGLE");
    }
  };

  /* ===================================================
            EXECUTE UPDATE (SINGLE OR SERIES)
  ==================================================== */
  const executeUpdate = async (values, mode) => {
    setLoading(true);
    if (mode === "SERIES") setConfirmModalOpen(false);

    try {
      const date = values.date;
      const time = dayjs(values.time);

      const startUTC = dayjs
        .utc()
        .year(date.year())
        .month(date.month())
        .date(date.date())
        .hour(time.hour())
        .minute(time.minute());

      const participantIds = Array.from(
        new Set([user.id, ...(values.participantIds || [])])
      );
      const startTime = startUTC.toISOString();
      const endTime = startUTC.add(values.duration, "minute").toISOString();

      const payload = {
        title: values.title.trim(),
        description: values.description || "",
        startTime,
        endTime,
        roomId: values.roomId,
        participantIds,
        deviceIds: values.deviceIds || [],
        guestEmails: values.guestEmails || [],
      };

      let res;

      // --- TRƯỜNG HỢP 1: CHỈ SỬA CUỘC HỌP NÀY ---
      if (mode === "SINGLE") {
        res = await updateMeeting(meetingDetail.id, payload);
      }
      // --- TRƯỜNG HỢP 2: SỬA TOÀN BỘ CHUỖI ---
      else if (mode === "SERIES") {
        // Validate ngày kết thúc cho chuỗi
        if (
          !values.repeatUntil ||
          dayjs(values.repeatUntil).isBefore(dayjs(), "day")
        ) {
          toast.error("Ngày kết thúc lặp lại không hợp lệ (phải ở tương lai)!");
          setLoading(false);
          return;
        }

        // Thêm thông tin Recurrence Rule vào payload
        payload.recurrenceRule = {
          frequency: values.frequency || "DAILY",
          interval: 1,
          repeatUntil: dayjs(values.repeatUntil).format("YYYY-MM-DD"),
          daysOfWeek: values.frequency === "WEEKLY" ? values.daysOfWeek : null,
        };

        // Gọi API seriesId
        res = await updateRecurringSeries(meetingDetail.seriesId, payload);
      }

      // Xử lý phản hồi
      if (res.data?.status === "PENDING_APPROVAL") {
        toast.info(
          "📝 Yêu cầu chỉnh sửa đã được gửi và đang chờ Admin phê duyệt.",
          { autoClose: 5000 }
        );
      } else {
        toast.success(
          mode === "SERIES"
            ? "Cập nhật chuỗi cuộc họp thành công!"
            : "Cập nhật cuộc họp thành công!"
        );
      }

      onSuccess?.();
      onCancel();
    } catch (err) {
      console.error("Lỗi update:", err);
      const msg =
        err?.response?.data?.message || "Không thể cập nhật cuộc họp!";
      if (err.response?.status === 409) {
        toast.error(`Xung đột lịch: ${msg}`);
      } else if (msg.toLowerCase().includes("bảo trì")) {
        toast.error("Phòng hoặc thiết bị đang bảo trì!");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* MODAL CHÍNH: FORM CHỈNH SỬA */}
      <Modal
        open={open}
        onCancel={onCancel}
        footer={null}
        width={650}
        closable={!loading}
        maskClosable={!loading}
        title={
          <span className="flex items-center gap-2 dark:text-white text-lg font-semibold">
            <FiEdit /> Chỉnh sửa cuộc họp
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
            onFinish={handleSubmit}
          >
            {/* TITLE */}
            <Form.Item
              name="title"
              label="Tên cuộc họp"
              rules={[{ required: true }, { min: 3 }]}
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
                rules={[{ required: true }]}
              >
                <DatePicker
                  className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  format="DD/MM/YYYY"
                  disabledDate={(d) =>
                    d &&
                    (d < dayjs().startOf("day") ||
                      d.day() === 0 ||
                      d.day() === 6)
                  }
                />
              </Form.Item>

              <Form.Item
                name="time"
                label="Giờ bắt đầu"
                rules={[{ required: true }]}
              >
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={clockValue.format("HH:mm")}
                    onClick={() => setClockOpen(true)}
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600 cursor-pointer"
                  />
                  <Button onClick={() => setClockOpen(true)}>Chọn giờ</Button>
                </div>

                <Modal
                  title="Chọn giờ họp (08:00 - 18:00)"
                  open={clockOpen}
                  onCancel={() => setClockOpen(false)}
                  onOk={() => {
                    if (!validateBusinessTime(clockValue)) {
                      toast.error("Chỉ được đặt 08:00 - 18:00!");
                      return;
                    }
                    form.setFieldsValue({ time: clockValue });
                    setClockOpen(false);
                  }}
                  width={350}
                  centered
                >
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <StaticTimePicker
                      orientation="portrait"
                      ampm={false}
                      value={clockValue}
                      onChange={(v) => setClockValue(v)}
                      slotProps={{ actionBar: { actions: [] } }}
                    />
                  </LocalizationProvider>
                </Modal>
              </Form.Item>

              <Form.Item
                name="duration"
                label="Thời lượng"
                rules={[{ required: true }]}
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
              rules={[{ required: true }]}
            >
              <Select
                placeholder="-- Chọn phòng họp --"
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
                        {r.requiresApproval && (
                          <Tag color="gold" className="ml-2 text-[10px]">
                            VIP
                          </Tag>
                        )}
                      </span>
                      <Tag color={r.status === "AVAILABLE" ? "green" : "red"}>
                        {r.status === "AVAILABLE" ? "Có sẵn" : "Bảo trì"}
                      </Tag>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* VIP ALERT */}
            {selectedRoom?.requiresApproval && (
              <Alert
                message="Phòng họp VIP - Yêu cầu phê duyệt"
                description="Nếu bạn đổi sang phòng này, cuộc họp sẽ chuyển sang trạng thái 'Chờ duyệt' (cả chuỗi nếu chọn sửa chuỗi)."
                type="warning"
                showIcon
                icon={<FiInfo />}
                className="mb-4"
              />
            )}

            {/* DEVICES */}
            <Form.Item name="deviceIds" label="Thiết bị sử dụng">
              <Select
                mode="multiple"
                placeholder={
                  !watchedDate || !watchedTime
                    ? "Vui lòng chọn thời gian trước"
                    : "Chọn thiết bị khả dụng (hiện tại được giữ lại)"
                }
                loading={devicesLoading}
                disabled={devicesLoading}
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
                        {d.status === "AVAILABLE" ? "Có sẵn" : "Bảo trì"}
                      </Tag>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Divider className="dark:border-gray-700" />

            {/* PARTICIPANTS */}
            <Form.Item label="Người tham gia (Nội bộ)" name="participantIds">
              <Select
                mode="multiple"
                showSearch
                placeholder="Tìm kiếm người dùng..."
                filterOption={false}
                onSearch={handleSearchUsers}
                loading={isSearching}
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
              label={
                <span>
                  <FiMail className="inline mr-2" />
                  Email khách mời
                </span>
              }
              rules={[
                {
                  validator: (_, v) => {
                    if (!v || !v.length) return Promise.resolve();
                    const invalid = v.filter(
                      (e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
                    );
                    return invalid.length
                      ? Promise.reject(`Email sai: ${invalid.join(", ")}`)
                      : Promise.resolve();
                  },
                },
              ]}
            >
              <Select
                mode="tags"
                tokenSeparators={[",", ";", " "]}
                placeholder="Nhập email..."
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                classNames={{ popup: "dark:bg-gray-700 dark:text-gray-100" }}
              />
            </Form.Item>

            {/* RECURRING OPTIONS (HIỂN THỊ NẾU LÀ CUỘC HỌP ĐỊNH KỲ) */}
            {isRecurringSeries && (
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg mb-4 border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <FiCalendar /> Thiết lập lặp lại (Chỉ áp dụng nếu chọn 'Sửa
                  toàn bộ chuỗi')
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <Form.Item name="frequency" label="Tần suất">
                    <Select className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                      <Option value="DAILY">Hằng ngày</Option>
                      <Option value="WEEKLY">Hằng tuần</Option>
                      <Option value="MONTHLY">Hằng tháng</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="repeatUntil"
                    label="Đến ngày"
                    rules={[{ required: isRecurring }]}
                  >
                    <DatePicker
                      format="DD/MM/YYYY"
                      className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      disabledDate={(c) =>
                        c &&
                        (c <= dayjs().startOf("day") ||
                          c.day() === 0 ||
                          c.day() === 6)
                      }
                    />
                  </Form.Item>
                </div>
                {/* [NEW] CHỌN THỨ (NẾU LÀ WEEKLY) */}
                <Form.Item
                  shouldUpdate={(prev, curr) =>
                    prev.frequency !== curr.frequency
                  }
                >
                  {({ getFieldValue }) =>
                    getFieldValue("frequency") === "WEEKLY" ? (
                      <Form.Item
                        name="daysOfWeek"
                        label="Lặp lại vào các thứ"
                        rules={[
                          { required: true, message: "Chọn ít nhất một ngày" },
                        ]}
                      >
                        <Checkbox.Group
                          options={DAYS_OF_WEEK_OPTIONS}
                          className="dark:text-gray-200"
                        />
                      </Form.Item>
                    ) : null
                  }
                </Form.Item>
              </div>
            )}

            <Form.Item name="description" label="Ghi chú">
              <TextArea
                rows={3}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </Form.Item>

            <div className="flex justify-end gap-3 mt-6">
              <Button onClick={onCancel} disabled={loading}>
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {selectedRoom?.requiresApproval
                  ? "Gửi yêu cầu duyệt"
                  : "Cập nhật"}
              </Button>
            </div>
          </Form>
        </Card>
      </Modal>

      {/* MODAL XÁC NHẬN: SỬA 1 HAY SỬA CHUỖI */}
      <Modal
        title={
          <span className="flex items-center gap-2">
            <FiCalendar /> Cập nhật cuộc họp định kỳ
          </span>
        }
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        footer={null}
        className="dark:[&_.ant-modal-content]:bg-gray-800 dark:[&_.ant-modal-content]:text-gray-100 
                   dark:[&_.ant-modal-header]:bg-gray-800 dark:[&_.ant-modal-header]:border-b-gray-700"
        styles={{ body: { paddingTop: 20 } }}
      >
        <div className="p-2">
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Bạn đang thay đổi một cuộc họp trong chuỗi định kỳ. Bạn muốn áp dụng
            thay đổi này cho:
          </p>
          <div className="flex flex-col gap-3">
            <Button
              block
              size="large"
              onClick={() => executeUpdate(pendingValues, "SINGLE")}
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600 h-12 font-medium"
            >
              Chỉ cuộc họp này
            </Button>
            <Button
              block
              size="large"
              type="primary"
              onClick={() => executeUpdate(pendingValues, "SERIES")}
              className="bg-blue-600 h-12 font-medium"
            >
              Toàn bộ chuỗi (Các cuộc họp tương lai)
            </Button>
          </div>
          <div className="mt-4 text-right">
            <Button type="text" onClick={() => setConfirmModalOpen(false)}>
              Hủy bỏ
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EditMeetingModal;
