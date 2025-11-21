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
import { FiEdit, FiUsers, FiInfo } from "react-icons/fi";
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

  // Theo dõi phòng đang chọn để hiển thị cảnh báo VIP
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
  const watchedRoomId = Form.useWatch("roomId", form); // Theo dõi phòng đã chọn

  /* ====== LOAD ROOMS ====== */
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

  /* ===== THEO DÕI PHÒNG ĐÃ CHỌN (VIP) ====== */
  useEffect(() => {
    // Ưu tiên lấy từ form (khi user đổi phòng), nếu không thì lấy từ meetingDetail
    const currentRoomId = watchedRoomId || meetingDetail?.room?.id;
    
    if (currentRoomId && rooms.length > 0) {
      const room = rooms.find((r) => r.id === currentRoomId);
      setSelectedRoom(room || null);
    } else {
      setSelectedRoom(null);
    }
  }, [watchedRoomId, rooms, meetingDetail]);

  /* ====== POPULATE FORM WITH MEETING DETAILS ====== */
  useEffect(() => {
    if (!meetingDetail || !open) return;

    const startTime = dayjs(meetingDetail.startTime);
    const endTime = dayjs(meetingDetail.endTime);
    const duration = endTime.diff(startTime, "minute");

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
      deviceIds: meetingDetail.devices?.map((d) => d.id) || [],
      participantIds: meetingDetail.participants
        ?.map((p) => p.id)
        .filter((id) => id !== user?.id) || [],
      guestEmails: meetingDetail.guestEmails || [],
      description: meetingDetail.description || "",
      isRecurring: hasRecurrence,
      frequency: meetingDetail.recurrenceRule?.frequency || "DAILY",
      repeatUntil: meetingDetail.recurrenceRule?.repeatUntil
        ? dayjs(meetingDetail.recurrenceRule.repeatUntil)
        : undefined,
    });

    // Giữ participants hiện tại trong search results
    if (meetingDetail.participants) {
      setSearchResults(meetingDetail.participants.filter((p) => p.id !== user?.id));
    }

    // Load devices cho thời gian hiện tại
    if (startTime && duration) {
      loadDevicesForTime(startTime, duration);
    }
  }, [meetingDetail, open, form, user]);

  /* ===== LOAD DEVICES (giữ nguyên + merge current devices) ====== */
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

      // Merge với devices hiện tại của meeting (để không bị mất khi đang dùng)
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

  /* ===== SEARCH USERS ====== */
  const handleSearchUsers = (query) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!query?.trim()) {
      setSearchResults(meetingDetail?.participants?.filter((p) => p.id !== user?.id) || []);
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

  /* ===== UPDATE MEETING ======= */
  const handleUpdate = async (values) => {
    try {
      setLoading(true);

      const date = values.date;
      const time = dayjs(values.time);

      if (!validateBusinessTime(time)) {
        toast.error("Chỉ được đặt lịch từ 08:00 đến 18:00!");
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

      const startTime = startUTC.toISOString();
      const endTime = startUTC.add(values.duration, "minute").toISOString();

      const hasChanges =
        values.title !== meetingDetail.title ||
        (values.description || "") !== (meetingDetail.description || "") ||
        dayjs(startTime).format() !== dayjs(meetingDetail.startTime).format() ||
        dayjs(endTime).format() !== dayjs(meetingDetail.endTime).format() ||
        values.roomId !== meetingDetail.room?.id ||
        JSON.stringify((values.deviceIds || []).sort()) !==
          JSON.stringify((meetingDetail.devices || []).map((d) => d.id).sort()) ||
        JSON.stringify(participantIds.sort()) !==
          JSON.stringify((meetingDetail.participants || []).map((p) => p.id).sort()) ||
        JSON.stringify((values.guestEmails || []).sort()) !==
          JSON.stringify((meetingDetail.guestEmails || []).sort());

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

      // Xử lý Lặp lại (Recurring)
      if (values.isRecurring && meetingDetail.recurrenceSeriesId) {
        payload.recurrenceRule = {
          frequency: values.frequency || "DAILY",
          interval: 1,
          repeatUntil: dayjs(values.repeatUntil).format("YYYY-MM-DD"),
        };
        await updateRecurringSeries(meetingDetail.recurrenceSeriesId, payload);
        toast.success("Cập nhật toàn bộ chuỗi cuộc họp định kỳ thành công!");
      } else {
        // Xử lý Họp đơn lẻ
        const res = await updateMeeting(meetingDetail.id, payload);

        // LOGIC PHẢN HỒI
        if (res.data?.status === "PENDING_APPROVAL") {
          toast.info("Đã cập nhật cuộc họp. Do thay đổi phòng/giờ sang khu vực cần duyệt, yêu cầu của bạn đang chờ Admin phê duyệt lại.", { autoClose: 5000 });
        } else {
          toast.success("Cập nhật cuộc họp thành công!");
        }
      }

      onSuccess?.(); // Quan trọng: Gọi hàm này để MyMeetingsPage tải lại dữ liệu mới
      onCancel();
    } catch (err) {
      console.error("Lỗi update:", err);
      const msg = err?.response?.data?.message || "Không thể cập nhật cuộc họp!";
      if (msg.toLowerCase().includes("bảo trì")) {
         toast.error("Phòng hoặc thiết bị đang bảo trì!");
      } else if (err.response?.status === 409) {
         toast.error(`Xung đột: ${msg}`);
      } else {
         toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

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
      <Card className="shadow-none bg-white dark:bg-[#1e293b] border-none dark:text-gray-100" bodyStyle={{ padding: 0 }}>
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
            rules={[{ required: true }, { min: 3 }]}
          >
            <Input placeholder="Nhập tên cuộc họp..." className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
          </Form.Item>

          {/* DATE - TIME - DURATION */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Form.Item name="date" label="Ngày họp" rules={[{ required: true }]}>
              <DatePicker
                className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                format="DD/MM/YYYY"
                disabledDate={(d) => d && (d < dayjs().startOf("day") || d.day() === 0 || d.day() === 6)}
              />
            </Form.Item>

            <Form.Item name="time" label="Giờ bắt đầu" rules={[{ required: true }]}>
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

            <Form.Item name="duration" label="Thời lượng" rules={[{ required: true }]}>
              <Select className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                <Option value={15}>15 phút</Option><Option value={30}>30 phút</Option><Option value={45}>45 phút</Option><Option value={60}>1 giờ</Option><Option value={90}>1 giờ 30 phút</Option><Option value={120}>2 giờ</Option>
              </Select>
            </Form.Item>
          </div>

          {/* ROOM SELECT - CÓ VIP TAG */}
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
                      {r.requiresApproval && (
                        <Tag color="gold" className="ml-2 text-[10px]">VIP</Tag>
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

          {/* CẢNH BÁO NẾU CHỌN PHÒNG VIP */}
          {selectedRoom?.requiresApproval && (
            <Alert
              message="Phòng họp VIP - Yêu cầu phê duyệt"
              description="Việc thay đổi sang phòng này sẽ gửi yêu cầu đến Admin để phê duyệt. Cuộc họp sẽ chuyển sang trạng thái 'Chờ duyệt'."
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
              popupClassName="dark:bg-gray-700 dark:text-gray-100"
            >
              {availableDevices.map((d) => (
                <Option key={d.id} value={d.id} disabled={d.status !== "AVAILABLE"}>
                  <div className="flex justify-between items-center">
                    <span>{d.name}</span>
                    <Tag color={d.status === "AVAILABLE" ? "green" : "red"}>{d.status === "AVAILABLE" ? "Có sẵn" : "Bảo trì"}</Tag>
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
             label="Email khách mời (Bên ngoài)"
             rules={[{
                validator: (_, v) => {
                   if (!v || !v.length) return Promise.resolve();
                   const invalid = v.filter(e => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
                   return invalid.length ? Promise.reject(`Email sai: ${invalid.join(', ')}`) : Promise.resolve();
                }
             }]}
          >
             <Select 
                mode="tags" 
                tokenSeparators={[',', ';', ' ']} 
                placeholder="Nhập email..." 
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                popupClassName="dark:bg-gray-700 dark:text-gray-100"
             />
          </Form.Item>

          {/* RECURRING OPTIONS */}
          {meetingDetail?.recurrenceSeriesId && (
            <>
              <Form.Item name="isRecurring" valuePropName="checked" className="mb-1">
                <Checkbox className="dark:text-gray-200">
                  Cập nhật lặp lại cho toàn bộ chuỗi
                </Checkbox>
              </Form.Item>

              {showRecurringOptions && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <Form.Item name="frequency" label="Tần suất">
                    <Select className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                      <Option value="DAILY">Hằng ngày</Option>
                      <Option value="WEEKLY">Hằng tuần</Option>
                      <Option value="MONTHLY">Hằng tháng</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="repeatUntil" label="Đến ngày" rules={[{ required: isRecurring }]}>
                    <DatePicker
                      format="DD/MM/YYYY"
                      className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      disabledDate={(c) => c && (c <= dayjs().startOf("day") || c.day() === 0 || c.day() === 6)}
                    />
                  </Form.Item>
                </div>
              )}
            </>
          )}

          {/* DESCRIPTION */}
          <Form.Item name="description" label="Ghi chú">
            <TextArea rows={3} className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
          </Form.Item>

          {/* BUTTONS */}
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
              {selectedRoom?.requiresApproval ? "Gửi yêu cầu duyệt" : "Cập nhật"}
            </Button>
          </div>
        </Form>
      </Card>
    </Modal>
  );
};

export default EditMeetingModal;