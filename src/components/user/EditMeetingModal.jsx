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
  Tag,
} from "antd";
import { FiEdit, FiMail, FiCalendar } from "react-icons/fi";
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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation(['userEdit', 'common']);

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);

  const [availableDevices, setAvailableDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // STATE: isRecurring
  const [isRecurring, setIsRecurring] = useState(false); 
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);

  // State cho Modal Xác nhận (Chọn sửa 1 hay sửa chuỗi)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);

  // TIME PICKER STATE
  const [clockOpen, setClockOpen] = useState(false);
  const [clockValue, setClockValue] = useState(dayjs());

  const debounceTimer = useRef(null);
  const { user } = useAuth();

  // Watch form values
  const watchedDate = Form.useWatch("date", form);
  const watchedTime = Form.useWatch("time", form);
  const watchedDuration = Form.useWatch("duration", form);
  
  /* LOAD ROOMS */
  useEffect(() => {
    if (!open || !meetingDetail) return;

    const fetchData = async () => {
      try {
        const res = await getRooms();
        setRooms(res.data || []);
      } catch (e) {
        toast.error(t('userEdit:edit.messages.loadRoomsError')); // ({/* "Không thể tải danh sách phòng họp!" */})
      }
    };
    fetchData();
  }, [open, meetingDetail]); 

  /* POPULATE FORM */
  useEffect(() => {
    if (!meetingDetail || !open) return;

    const startTime = dayjs(meetingDetail.startTime);
    const endTime = dayjs(meetingDetail.endTime);
    const duration = endTime.diff(startTime, "minute");

    // Kiểm tra xem có phải cuộc họp định kỳ không
    const isSeries = !!meetingDetail.seriesId;
    setIsRecurring(isSeries); // Cập nhật state

    // Mặc định ẩn tùy chọn lặp lại cho gọn, user check vào mới hiện
    setShowRecurringOptions(false);

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

      // Recurrence fields
      isRecurring: isSeries, // Set giá trị cho checkbox
      frequencies: meetingDetail.recurrenceRule?.frequencies || "DAILY",
      repeatUntil: meetingDetail.recurrenceRule?.repeatUntil
        ? dayjs(meetingDetail.recurrenceRule.repeatUntil)
        : undefined,
      daysOfWeek: meetingDetail.recurrenceRule?.daysOfWeek || []
    });

    // Nếu là chuỗi thì hiện options luôn
    if (isSeries) {
       setShowRecurringOptions(true);
    }

    if (meetingDetail.participants) {
      setSearchResults(meetingDetail.participants.filter((p) => p.id !== user?.id));
    }

    if (startTime && duration) {
      loadDevicesForTime(startTime , duration);
    }
  }, [meetingDetail, open, form, user]);

  /* LOAD DEVICES */
  const loadDevicesForTime = async (date, time, duration) => {
    if (!date || !time || !duration) {
      setAvailableDevices([]);
      return;
    }
    setDevicesLoading(true);
    try {
      const startTimeUTC = dayjs.utc()
        .year(date.year()).month(date.month()).date(date.date())
        .hour(time.hour()).minute(time.minute());

      const startTime = startTimeUTC.toISOString();
      const endTime = startTimeUTC.add(duration, "minute").toISOString();

      const res = await getAvailableDevices(startTime, endTime);
      const availableList = res.data || [];

      // Merge devices hiện tại để không bị ẩn
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
      toast.error(t('userEdit:edit.messages.loadDevicesError')); // ({/* "Không thể tải thiết bị khả dụng!" */})
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

  /* SEARCH USERS */
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
        toast.error(t('userEdit:edit.messages.searchUserError')); // ({/* "Không thể tìm kiếm người dùng." */})
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

  /* HANDLE FORM SUBMIT */
  const handleSubmit = async (values) => {
    // 1. Validate cơ bản
    const date = values.date;
    const time = dayjs(values.time);
    if (!validateBusinessTime(time)) {
      toast.error(t('userEdit:edit.messages.businessHoursOnly')); // ({/* "Chỉ được đặt lịch từ 08:00 đến 18:00!" */})
      return;
    }

    // 2. Nếu là cuộc họp định kỳ (dựa vào seriesId của meeting gốc) -> Hiện Modal hỏi
    if (meetingDetail?.seriesId) {
      setPendingValues(values);
      setConfirmModalOpen(true);
    } else {
      // 3. Nếu là cuộc họp thường -> Cập nhật luôn (Single)
      await executeUpdate(values, 'SINGLE');
    }
  };

  /* EXECUTE UPDATE (SINGLE OR SERIES) */
  const executeUpdate = async (values, mode) => {
    setLoading(true);
    setConfirmModalOpen(false);

    try {
      const date = values.date;
      const time = dayjs(values.time);

      const startUTC = dayjs.utc()
        .year(date.year()).month(date.month()).date(date.date())
        .hour(time.hour()).minute(time.minute());

      const participantIds = Array.from(new Set([user.id, ...(values.participantIds || [])]));
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

      // TRƯỜNG HỢP 1: CHỈ SỬA CUỘC HỌP NÀY 
      if (mode === 'SINGLE') {
        res = await updateMeeting(meetingDetail.id, payload);
      } 
      // TRƯỜNG HỢP 2: SỬA TOÀN BỘ CHUỖI 
      else if (mode === 'SERIES') {
        // Validate ngày kết thúc cho chuỗi
        if (!values.repeatUntil || dayjs(values.repeatUntil).isBefore(dayjs(), 'day')) {
            toast.error(t('userEdit:edit.messages.invalidRepeatUntil')); // ({/* "Ngày kết thúc lặp lại không hợp lệ (phải ở tương lai)!" */})
            setLoading(false);
            return;
        }

        // Thêm thông tin Recurrence Rule vào payload
        payload.recurrenceRule = {
          frequencies: values.frequencies || "DAILY",
          interval: 1,
          repeatUntil: dayjs(values.repeatUntil).format("YYYY-MM-DD"),
          daysOfWeek: values.frequencies === 'WEEKLY' ? values.daysOfWeek : null
        };

        // Gọi API seriesId
        res = await updateRecurringSeries(meetingDetail.seriesId, payload);
      }

      // Xử lý phản hồi
      if (res.data?.status === "PENDING_APPROVAL") {
        toast.info(t('userEdit:edit.messages.pendingApproval'), { autoClose: 5000 }); // ({/* "📝 Yêu cầu chỉnh sửa..." */})
      } else {
        toast.success(mode === 'SERIES'
          ? t('userEdit:edit.messages.updateSeriesSuccess') // ({/* "Cập nhật chuỗi cuộc họp thành công!" */})
          : t('userEdit:edit.messages.updateSuccess') // ({/* "Cập nhật cuộc họp thành công!" */})
        );
      }

      onSuccess?.();
      onCancel();
    } catch (err) {
      console.error("Lỗi update:", err);
      const msg = err?.response?.data?.message || t('userEdit:edit.messages.updateError'); // ({/* "Không thể cập nhật cuộc họp!" */})
      if (err.response?.status === 409) {
        toast.error(t('userEdit:edit.messages.conflict', { msg })); // ({/* Xung đột lịch: ${msg} */})
      } else if ((msg || "").toLowerCase().includes("bảo trì")) {
        toast.error(t('userEdit:edit.messages.maintenanceError')); // ({/* "Phòng hoặc thiết bị đang bảo trì!" */})
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* MODAL FORM CHỈNH SỬA */}
      <Modal
        open={open}
        onCancel={onCancel}
        footer={null}
        width={650}
        closable={!loading}
        maskClosable={!loading}
        title={
          // ({/* <span>Chỉnh sửa cuộc họp</span> */}
          <span className="flex items-center gap-2 dark:text-white text-lg font-semibold">
            <FiEdit /> {t('userEdit:edit.title')}
          </span>
          // )
        }
        className="dark:[&_.ant-modal-content]:bg-gray-800 dark:[&_.ant-modal-content]:text-gray-100 
                  dark:[&_.ant-modal-header]:bg-gray-800 dark:[&_.ant-modal-header]:border-b-gray-700"
        styles={{ body: { paddingTop: 18, paddingBottom: 10 } }}
      >
        <Card className="shadow-none bg-white dark:bg-[#1e293b] border-none dark:text-gray-100" styles={{ body: { padding: 0 } }}>
          <Form
            layout="vertical"
            form={form}
            disabled={loading}
            onFinish={handleSubmit}
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
              // ({/* label="Tên cuộc họp" */}
              label={t('userEdit:edit.fields.meetingName')}
              // )
              rules={[{ required: true }, { min: 3 }]}
            >
              {/* <Input placeholder="Nhập tên cuộc họp..." ... */}
              <Input placeholder={t('userEdit:edit.placeholders.meetingName')} className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
              {/* ) */}
            </Form.Item>

            {/* DATE - TIME - DURATION */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Form.Item
                name="date"
                // ({/* label="Ngày họp" */}
                label={t('userEdit:edit.fields.date')}
                // )
                rules={[{ required: true }]}
              >
                <DatePicker
                  className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  format="DD/MM/YYYY"
                  disabledDate={(d) =>
                    d && d < dayjs().startOf("day")
                  }
                />
              </Form.Item>

              <Form.Item
                name="time"
                // ({/* label="Giờ bắt đầu" */}
                label={t('userEdit:edit.fields.startTime')}
                // )
                rules={[{ required: true }]}
              >
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={clockValue.format("HH:mm")}
                    onClick={() => setClockOpen(true)}
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600 cursor-pointer"
                  />

                  {/* <Button onClick={() => setClockOpen(true)}>Chọn giờ</Button> */}
                  <Button onClick={() => setClockOpen(true)}>{t('userEdit:edit.buttons.selectTime')}</Button>
                  {/* ) */}
                </div>
                <Modal
                  // ({/* title="Chọn giờ họp (08:00 - 18:00)" */}
                  title={t('userEdit:edit.placeholders.selectTimeModal')}
                  // )
                  open={clockOpen}
                  onCancel={() => setClockOpen(false)}
                  onOk={() => {
                    if (!validateBusinessTime(clockValue)) {
                      toast.error(t('userEdit:edit.messages.businessHoursOnly')); // ({/* "Chỉ được đặt 08:00 - 18:00!" */})
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
                // ({/* label="Thời lượng" */}
                label={t('userEdit:edit.fields.duration')}
                // )
                rules={[{ required: true }]}
              >
                <Select className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  {/* 
                  <Option value={15}>15 phút</Option>
                  <Option value={30}>30 phút</Option>
                  <Option value={45}>45 phút</Option>
                  <Option value={60}>1 giờ</Option>
                  <Option value={90}>1 giờ 30 phút</Option>
                  <Option value={120}>2 giờ</Option>
                  */}
                  <Option value={15}>{t('userEdit:edit.durations.15min')}</Option>
                  <Option value={30}>{t('userEdit:edit.durations.30min')}</Option>
                  <Option value={45}>{t('userEdit:edit.durations.45min')}</Option>
                  <Option value={60}>{t('userEdit:edit.durations.1hour')}</Option>
                  <Option value={90}>{t('userEdit:edit.durations.1hour30')}</Option>
                  <Option value={120}>{t('userEdit:edit.durations.2hours')}</Option>
                </Select>
              </Form.Item>
            </div>

            {/* ROOM SELECT */}
            <Form.Item 
              name="roomId" 
              // ({/* label="Phòng họp" */}
              label={t('userEdit:edit.fields.room')}
              // )
              rules={[{ required: true }]}
            >
              <Select
                // ({/* placeholder="-- Chọn phòng họp --" */})
                placeholder={t('userEdit:edit.placeholders.selectRoom')}
                // )
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
                        {r.name} ({r.capacity} {/* chỗ giữ nguyên */})
                      </span>
                      <Tag color={r.status === "AVAILABLE" ? "green" : "red"}>
                        {/* {r.status === "AVAILABLE" ? "Có sẵn" : "Bảo trì"} */}
                        {r.status === "AVAILABLE"
                          ? t('userEdit:edit.status.available')
                          : t('userEdit:edit.status.maintenance')}
                        {/* ) */}
                      </Tag>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* DEVICES */}
            <Form.Item 
              name="deviceIds" 
              // ({/* label="Thiết bị sử dụng" */}
              label={t('userEdit:edit.fields.devices')}
              // )
            >
              <Select
                mode="multiple"
                placeholder={
                  !watchedDate || !watchedTime
                    ? t('userEdit:edit.placeholders.selectDatetimeFirst')
                    : t('userEdit:edit.placeholders.selectDevices')
                }
                loading={devicesLoading}
                disabled={devicesLoading}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                classNames={{ popup: "dark:bg-gray-700 dark:text-gray-100" }}
              >
                {availableDevices.map((d) => (
                  <Option key={d.id} value={d.id} disabled={d.status !== "AVAILABLE"}>
                    <div className="flex justify-between items-center">
                      <span>{d.name}</span>
                      <Tag color={d.status === "AVAILABLE" ? "green" : "red"}>
                        {/* {d.status === "AVAILABLE" ? "Có sẵn" : "Bảo trì"} */}
                        {d.status === "AVAILABLE"
                          ? t('userEdit:edit.status.available')
                          : t('userEdit:edit.status.maintenance')}
                        {/* ) */}
                      </Tag>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Divider className="dark:border-gray-700" />

            {/* PARTICIPANTS */}
            <Form.Item 
              // ({/* label="Người tham gia (Nội bộ)" */}
              label={t('userEdit:edit.fields.participants')}
              // ) 
              name="participantIds">
              <Select
                mode="multiple"
                showSearch
                placeholder={t('userEdit:edit.placeholders.searchUsers')}
                filterOption={false}
                onSearch={handleSearchUsers}
                loading={isSearching}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                classNames={{ popup: "dark:bg-gray-700 dark:text-gray-100" }}
              >
                {searchResults.map((u) => (
                  <Option key={u.id} value={u.id}>{u.fullName} ({u.username})</Option>
                ))}
              </Select>
            </Form.Item>

            {/* GUEST EMAILS */}
            <Form.Item 
              name="guestEmails" 
              // ({/* label={<span><FiMail className="inline mr-2" />Email khách mời</span>} */}
              label={
                <span>
                  <FiMail className="inline mr-2" />
                  {t('userEdit:edit.fields.guestEmails')}
                </span>
              }
              // )
              rules={[{
                validator: (_, v) => {
                  if (!v || !v.length) return Promise.resolve();
                  const invalid = v.filter(e => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
                  return invalid.length ? Promise.reject(`${t('userEdit:edit.messages.invalidEmail')}: ${invalid.join(', ')}`) : Promise.resolve();
                }
              }]}
            >
              <Select 
                mode="tags" 
                tokenSeparators={[',', ';', ' ']} 
                placeholder={t('userEdit:edit.placeholders.enterEmails')}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                classNames={{ popup: "dark:bg-gray-700 dark:text-gray-100" }}
              />
            </Form.Item>

            {/* RECURRING OPTIONS */}
            {/* Chỉ hiển thị checkbox nếu bản thân cuộc họp đã là series */}
            {meetingDetail?.seriesId && (
              <>
                <Form.Item name="isRecurring" valuePropName="checked" className="mb-1">
                  {/* ({/* "Cập nhật lặp lại (Áp dụng cho toàn bộ chuỗi)" */}
                  <Checkbox className="dark:text-gray-200">
                    {t('userEdit:edit.fields.recurring')}
                  </Checkbox>
                  {/* ) */}
                </Form.Item>

                {showRecurringOptions && (
                  <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg mb-4 border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <Form.Item 
                        name="frequencies" 
                        // ({/* label="Tần suất" */}
                        label={t('userEdit:edit.fields.frequency')}
                        // )
                      >
                        <Select className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                          <Option value="DAILY">{t('userEdit:edit.frequencies.daily')}</Option>
                          <Option value="WEEKLY">{t('userEdit:edit.frequencies.weekly')}</Option>
                          <Option value="MONTHLY">{t('userEdit:edit.frequencies.monthly')}</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item 
                        name="repeatUntil" 
                        // ({/* label="Đến ngày" */}
                        label={t('userEdit:edit.fields.repeatUntil')}
                        // )
                        rules={[{ required: isRecurring }]}
                      >
                        <DatePicker
                          format="DD/MM/YYYY"
                          className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
                          disabledDate={(c) => c && c <= dayjs().startOf("day")}
                        />
                      </Form.Item>
                    </div>
                    {/* CHỌN THỨ (NẾU LÀ WEEKLY) */}
                    <Form.Item 
                      shouldUpdate={(prev, curr) => prev.frequencies !== curr.frequencies}
                    >
                      {({ getFieldValue }) => 
                        getFieldValue('frequencies') === 'WEEKLY' ? (
                          <Form.Item 
                            name="daysOfWeek" 
                            // ({/* label="Lặp lại vào các thứ" */}
                            label={t('userEdit:edit.fields.daysOfWeek')}
                            // )
                            rules={[{ required: true, message: t('userEdit:edit.messages.selectDayOfWeek') }]}
                          >
                            <Checkbox.Group options={DAYS_OF_WEEK_OPTIONS} className="dark:text-gray-200" />
                          </Form.Item>
                        ) : null
                      }
                    </Form.Item>
                  </div>
                )}
              </>
            )}

            <Form.Item 
              name="description" 
              // ({/* label="Ghi chú" */}
              label={t('userEdit:edit.fields.notes')}
              // )
            >
              <TextArea rows={3} className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
            </Form.Item>

            <div className="flex justify-end gap-3 mt-6">
              <Button onClick={onCancel} disabled={loading}>
                {/* ({/* "Hủy" */}
                <span>{t('common:buttons.cancel')}</span>
                {/* ) */}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {/* ({/* "Cập nhật" */}
                <span>{t('userEdit:edit.buttons.update')}</span>
                {/* ) */}
              </Button>
            </div>
          </Form>
        </Card>
      </Modal>

      {/* MODAL XÁC NHẬN SỬA 1 HAY SỬA CHUỖI */}
      <Modal
        // ({/* title={<span className="flex items-center gap-2"><FiCalendar /> Cập nhật cuộc họp định kỳ</span>} */}
        title={
          <span className="flex items-center gap-2">
            <FiCalendar /> {t('userEdit:edit.confirmModal.title')}
          </span>
        }
        // )
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        footer={null}
        className="dark:[&_.ant-modal-content]:bg-gray-800 dark:[&_.ant-modal-content]:text-gray-100 
                   dark:[&_.ant-modal-header]:bg-gray-800 dark:[&_.ant-modal-header]:border-b-gray-700"
        styles={{ body: { paddingTop: 20 } }}
      >
        <div className="p-2">
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            {/* ({/* "Bạn đang thay đổi một cuộc họp trong chuỗi định kỳ. Bạn muốn áp dụng thay đổi này cho:" */}
            {t('userEdit:edit.confirmModal.desc')}
            {/* ) */}
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              block 
              size="large" 
              onClick={() => executeUpdate(pendingValues, 'SINGLE')}
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600 h-12 font-medium"
            >
              {/* ({/* "Chỉ cuộc họp này" */}
              <span>{t('userEdit:edit.confirmModal.single')}</span>
              {/* ) */}
            </Button>
            <Button 
              block 
              size="large" 
              type="primary" 
              onClick={() => executeUpdate(pendingValues, 'SERIES')}
              className="bg-blue-600 h-12 font-medium"
            >
              {/* ({/* "Toàn bộ chuỗi (Các cuộc họp tương lai)" */}
              <span>{t('userEdit:edit.confirmModal.series')}</span>
              {/* ) */}
            </Button>
          </div>
          <div className="mt-4 text-right">
             <Button type="text" onClick={() => setConfirmModalOpen(false)}>
                {/* ({/* "Hủy bỏ" */}
                <span>{t('common:buttons.cancel')}</span>
                {/* ) */}
             </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EditMeetingModal;