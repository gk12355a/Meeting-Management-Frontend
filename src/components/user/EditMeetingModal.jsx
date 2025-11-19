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
} from "antd";
import { FiEdit, FiUsers } from "react-icons/fi";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import utc from "dayjs/plugin/utc";
import { toast } from "react-toastify";

import { getRooms, updateMeeting, updateRecurringSeries } from "../../services/meetingService";
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

const EditMeetingModal = ({ open, onCancel, meetingDetail, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  
  const [availableDevices, setAvailableDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);

  // TIME PICKER STATE
  const [clockOpen, setClockOpen] = useState(false);
  const [clockValue, setClockValue] = useState(dayjs());

  const debounceTimer = useRef(null);
  const { user } = useAuth();

  // Watch form values để tải devices tự động
  const watchedDate = Form.useWatch("date", form);
  const watchedTime = Form.useWatch("time", form);
  const watchedDuration = Form.useWatch("duration", form);

  /* ===================================================
                LOAD ROOMS & DEVICES
  ==================================================== */
  useEffect(() => {
    if (!open || !meetingDetail) return;

    const fetchData = async () => {
      try {
        const res = await getRooms();
        setRooms(res.data || []);
      } catch (e) {
        toast.error("Không thể tải phòng họp!");
      }
    };
    fetchData();
  }, [open, meetingDetail]);

  /* ===================================================
          POPULATE FORM WITH MEETING DETAILS
  ==================================================== */
  useEffect(() => {
    if (!meetingDetail || !open) return;

    const startTime = dayjs(meetingDetail.startTime);
    const endTime = dayjs(meetingDetail.endTime);
    const duration = endTime.diff(startTime, "minute");

    // Kiểm tra xem có phải cuộc họp định kỳ không
    const hasRecurrence = !!meetingDetail.recurrenceRule;
    setIsRecurring(hasRecurrence);
    setShowRecurringOptions(hasRecurrence);
    setClockValue(startTime);

    form.setFieldsValue({
      title: meetingDetail.title,
      date: startTime,
      time: startTime,
      duration: duration,
      roomId: meetingDetail.room?.id,
      deviceIds: meetingDetail.devices?.map(d => d.id) || [],
      participantIds: meetingDetail.participants?.map(p => p.id).filter(id => id !== user?.id) || [],
      guestEmails: meetingDetail.guestEmails || [],
      description: meetingDetail.description || "",
      isRecurring: hasRecurrence,
      frequency: meetingDetail.recurrenceRule?.frequency || "DAILY",
      repeatUntil: meetingDetail.recurrenceRule?.repeatUntil ? dayjs(meetingDetail.recurrenceRule.repeatUntil) : undefined,
    });

    // Thêm participants hiện tại vào searchResults để hiển thị
    if (meetingDetail.participants) {
      setSearchResults(meetingDetail.participants.filter(p => p.id !== user?.id));
    }

    // Load available devices cho thời gian hiện tại
    if (startTime && duration) {
      loadDevicesForTime(startTime, duration);
    }
  }, [meetingDetail, open, form, user]);

  /* ===================================================
          LOAD DEVICES WHEN TIME CHANGES
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
      
      // Thêm các devices hiện tại của meeting vào danh sách available
      // để tránh bị mất khi chúng đang được sử dụng
      const currentDeviceIds = meetingDetail?.devices?.map(d => d.id) || [];
      const availableList = res.data || [];
      
      // Merge current devices với available devices
      const currentDevices = meetingDetail?.devices || [];
      const mergedDevices = [...availableList];
      
      currentDevices.forEach(cd => {
        if (!mergedDevices.find(d => d.id === cd.id)) {
          mergedDevices.push(cd);
        }
      });
      
      setAvailableDevices(mergedDevices);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải thiết bị khả dụng!");
    } finally {
      setDevicesLoading(false);
    }
  };

  useEffect(() => {
    if (!watchedDate || !watchedTime || !watchedDuration) {
      return;
    }

    const t = setTimeout(() => {
      loadDevicesForTime(watchedDate, watchedTime, watchedDuration);
    }, 500);
    
    return () => clearTimeout(t);
  }, [watchedDate, watchedTime, watchedDuration]);

  /* ===================================================
              SEARCH INTERNAL USERS
  ==================================================== */
  const handleSearchUsers = (query) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!query || !query.trim()) {
      // Giữ lại participants hiện tại khi clear search
      if (meetingDetail?.participants) {
        setSearchResults(meetingDetail.participants.filter(p => p.id !== user?.id));
      }
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

  /* ===================================================
              VALIDATE BUSINESS TIME
  ==================================================== */
  const validateBusinessTime = (value) => {
    if (!value) return false;
    const totalMin = value.hour() * 60 + value.minute();
    return totalMin >= 480 && totalMin <= 1080; // 08:00 - 18:00
  };

  /* ===================================================
                  UPDATE MEETING
  ==================================================== */
  const handleUpdate = async (values) => {
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

      const participantIds = Array.from(
        new Set([user.id, ...(values.participantIds || [])])
      );

      // Kiểm tra xem có thay đổi gì không
      const startTime = startUTC.toISOString();
      const endTime = startUTC.add(values.duration, "minute").toISOString();
      
      const hasChanges = 
        values.title !== meetingDetail.title ||
        (values.description || "") !== (meetingDetail.description || "") ||
        dayjs(startTime).format() !== dayjs(meetingDetail.startTime).format() ||
        dayjs(endTime).format() !== dayjs(meetingDetail.endTime).format() ||
        values.roomId !== meetingDetail.room?.id ||
        JSON.stringify((values.deviceIds || []).sort()) !== JSON.stringify((meetingDetail.devices || []).map(d => d.id).sort()) ||
        JSON.stringify(participantIds.sort()) !== JSON.stringify((meetingDetail.participants || []).map(p => p.id).sort()) ||
        JSON.stringify((values.guestEmails || []).sort()) !== JSON.stringify((meetingDetail.guestEmails || []).sort());

      if (!hasChanges && !values.isRecurring) {
        toast.info("Không có thay đổi nào để cập nhật!");
        return;
      }

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

      // Nếu là cuộc họp định kỳ và chọn cập nhật toàn bộ chuỗi
      if (values.isRecurring && meetingDetail.recurrenceSeriesId) {
        payload.recurrenceRule = {
          frequency: values.frequency || "DAILY",
          interval: 1,
          repeatUntil: dayjs(values.repeatUntil).format("YYYY-MM-DD"),
        };
        payload.onBehalfOfUserId = null;
        
        await updateRecurringSeries(meetingDetail.recurrenceSeriesId, payload);
        toast.success("🎉 Cập nhật toàn bộ chuỗi cuộc họp định kỳ thành công!");
      } else {
        // Cuộc họp đơn lẻ
        await updateMeeting(meetingDetail.id, payload);
        toast.success("🎉 Cập nhật cuộc họp thành công!");
      }
      
      onSuccess();
      onCancel();
    } catch (err) {
      console.error("Lỗi cập nhật cuộc họp:", err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Không thể cập nhật cuộc họp!";
      
      // Xử lý trường hợp backend trả về object lỗi validation
      if (err?.response?.data && typeof err.response.data === 'object' && !err.response.data.error && !err.response.data.message) {
        const errors = Object.entries(err.response.data).map(([field, msg]) => `${field}: ${msg}`).join(', ');
        toast.error(`Lỗi validation: ${errors}`);
        return;
      }
      
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ===================================================
                        UI
  ==================================================== */
  return (
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
          onFinish={handleUpdate}
          onValuesChange={(vals) => {
            if (vals.isRecurring !== undefined) {
              setIsRecurring(vals.isRecurring);
              setShowRecurringOptions(vals.isRecurring);
            }
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

          {/* TIME */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* DATE */}
            <Form.Item
              name="date"
              label="Ngày họp"
              rules={[{ required: true, message: "Chọn ngày họp" }]}
            >
              <DatePicker
                className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                format="DD/MM/YYYY"
                disabledDate={(d) => d && (d < dayjs().startOf("day") || d.day() === 0 || d.day() === 6)}
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
              label="Thời lượng"
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

          {/* ROOM */}
          <Form.Item
            name="roomId"
            label="Phòng họp"
            rules={[{ required: true, message: "Chọn phòng họp" }]}
          >
            <Select 
              placeholder="-- Chọn phòng họp --"
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              popupClassName="dark:bg-gray-700 dark:text-gray-100"
            >
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
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
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
                      {d.status === "AVAILABLE" ? "Có sẵn" : "Bảo trì"}
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
                Người tham gia (Nội bộ)
              </span>
            }
          >
            <Select
              mode="multiple"
              showSearch
              loading={isSearching}
              filterOption={false}
              onSearch={handleSearchUsers}
              placeholder="-- Gõ tên hoặc email để tìm người tham gia --"
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              popupClassName="dark:bg-gray-700 dark:text-gray-100"
              notFoundContent={isSearching ? <Spin size="small" /> : "Không tìm thấy người dùng"}
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
            label="Email khách mời (bên ngoài)"
            tooltip="Nhập email, nhấn Enter hoặc dấu phẩy để thêm."
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
            <Select 
              mode="tags" 
              tokenSeparators={[",", ";", " "]}
              placeholder="Ví dụ: guest@email.com"
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              popupClassName="dark:bg-gray-700 dark:text-gray-100"
            />
          </Form.Item>

          {/* DESCRIPTION */}
          <Form.Item name="description" label="Ghi chú">
            <TextArea 
              rows={3} 
              placeholder="Ghi chú thêm cho cuộc họp..."
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </Form.Item>

          <Divider className="dark:border-gray-700" />

          {/* RECURRING OPTIONS */}
          {meetingDetail?.recurrenceSeriesId && (
            <>
              <Form.Item name="isRecurring" valuePropName="checked" className="mb-1">
                <Checkbox className="dark:text-gray-200">
                  Cập nhật lặp lại cuộc họp (toàn bộ chuỗi)
                </Checkbox>
              </Form.Item>

              {showRecurringOptions && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Form.Item 
                    name="frequency" 
                    label="Tần suất lặp"
                    rules={[{ required: isRecurring, message: "Chọn tần suất" }]}
                  >
                    <Select
                      className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      popupClassName="dark:bg-gray-700 dark:text-gray-100"
                    >
                      <Option value="DAILY">Hằng ngày</Option>
                      <Option value="WEEKLY">Hằng tuần</Option>
                      <Option value="MONTHLY">Hằng tháng</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item 
                    name="repeatUntil" 
                    label="Lặp đến ngày"
                    rules={[{ required: isRecurring, message: "Chọn ngày kết thúc" }]}
                  >
                    <DatePicker
                      className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      format="DD/MM/YYYY"
                      disabledDate={(current) => current && (current < dayjs().startOf("day") || current.day() === 0 || current.day() === 6)}
                    />
                  </Form.Item>
                </div>
              )}
            </>
          )}

          {/* SUBMIT */}
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
              Cập nhật
            </Button>
          </div>
        </Form>
      </Card>
    </Modal>
  );
};

export default EditMeetingModal;