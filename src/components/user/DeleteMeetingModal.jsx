// src/components/user/DeleteMeetingModal.jsx
import React, { useState } from "react";
import { Modal, Form, Input, Button, Alert, Radio } from "antd";
import { FiAlertTriangle } from "react-icons/fi";
import { deleteMeeting, deleteRecurringSeries } from "../../services/meetingService";
import { toast } from "react-toastify";

const { TextArea } = Input;

const DeleteMeetingModal = ({ open, onCancel, meetingDetail, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [deleteType, setDeleteType] = useState("single");
  const [reasonType, setReasonType] = useState("schedule");
  
  const isRecurring = !!meetingDetail?.recurrenceSeriesId;

  const REASON_OPTIONS = [
    { value: "schedule", label: "Thay đổi lịch trình" },
    { value: "missing", label: "Không đủ người tham gia" },
    { value: "device", label: "Lỗi thiết bị / phòng họp" },
    { value: "not_needed", label: "Cuộc họp không còn cần thiết" },
    { value: "custom", label: "Khác (Nhập lý do)" },
  ];

  const handleDelete = async (values) => {
    try {
      setLoading(true);

      let reasonText = "";
      if (reasonType === "custom") {
        reasonText = values.reason;
      } else {
        reasonText = REASON_OPTIONS.find((r) => r.value === reasonType)?.label || "Không có lý do";
      }

      const payload = { reason: reasonText };

      if (isRecurring && deleteType === "series") {
        await deleteRecurringSeries(meetingDetail.recurrenceSeriesId, payload);
        toast.success("Đã hủy toàn bộ chuỗi cuộc họp định kỳ!");
      } else {
        await deleteMeeting(meetingDetail.id, payload);
        toast.success("Đã hủy cuộc họp thành công!");
      }

      form.resetFields();
      setReasonType("schedule");
      setDeleteType("single");
      onSuccess();
      onCancel();

    } catch (err) {
      console.error("Lỗi khi hủy:", err);
      toast.error(err?.response?.data?.message || "Không thể hủy cuộc họp!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setReasonType("schedule");
    setDeleteType("single");
    onCancel();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={520}
      closable={!loading}
      maskClosable={!loading}
      title={
        <span className="flex items-center gap-2 text-red-600 dark:text-red-400 text-lg font-semibold">
          <FiAlertTriangle /> Xác nhận hủy cuộc họp
        </span>
      }
      className="dark:[&_.ant-modal-content]:bg-gray-800 dark:[&_.ant-modal-content]:text-gray-100 
                 dark:[&_.ant-modal-header]:bg-gray-800 dark:[&_.ant-modal-header]:border-b-gray-700"
    >
      <div className="py-2">

        <Alert
          message="Cảnh báo"
          description={
            <div className="dark:text-gray-200">
              <p className="mb-2">Bạn có chắc chắn muốn hủy cuộc họp:</p>
              <p className="font-semibold text-blue-600 dark:text-blue-400">
                "{meetingDetail?.title}"
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Tất cả người tham gia sẽ nhận được thông báo về việc hủy.
              </p>
            </div>
          }
          type="warning"
          showIcon
          className="mb-4 dark:bg-yellow-900/20 dark:border-yellow-700"
        />

        {isRecurring && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-3">
              Đây là cuộc họp định kỳ. Bạn muốn hủy:
            </p>

            <Radio.Group
              value={deleteType}
              onChange={(e) => setDeleteType(e.target.value)}
              disabled={loading}
              className="flex flex-col gap-2"
            >
              <Radio value="single">Chỉ cuộc họp này</Radio>
              <Radio value="series">Toàn bộ chuỗi cuộc họp</Radio>
            </Radio.Group>
          </div>
        )}

        {/* FORM */}
        <Form form={form} layout="vertical" onFinish={handleDelete} disabled={loading}>

          {/* Reason selector */}
          <Form.Item label="Lý do hủy cuộc họp" required>
            <Radio.Group
              value={reasonType}
              onChange={(e) => setReasonType(e.target.value)}
              className="flex flex-col gap-2"
            >
              {REASON_OPTIONS.map((item) => (
                <Radio key={item.value} value={item.value}>
                  {item.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>

          {/* Custom reason input */}
          {reasonType === "custom" && (
            <Form.Item
              name="reason"
              rules={[
                { required: true, message: "Vui lòng nhập lý do!" },
                { min: 10, message: "Lý do phải ít nhất 10 ký tự!" },
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Nhập lý do hủy cuộc họp..."
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                maxLength={500}
                showCount
              />
            </Form.Item>
          )}

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <Button onClick={handleCancel} disabled={loading}>
              Không, giữ lại
            </Button>
            <Button
              danger
              type="primary"
              htmlType="submit"
              loading={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              Xác nhận hủy
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default DeleteMeetingModal;
