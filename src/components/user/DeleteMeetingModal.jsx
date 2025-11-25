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

  // Lý do hủy (preset)
  const [reasonType, setReasonType] = useState("nocancel");

  const presetReasons = [
    { value: "no_need", label: "Không còn nhu cầu" },
    { value: "wrong_schedule", label: "Nhầm phòng / nhầm lịch" },
    { value: "time_change", label: "Thay đổi thời gian họp" },
    { value: "lack_members", label: "Thiếu người tham gia" },
    { value: "other", label: "Khác (nhập lý do)" },
  ];

  const seriesId = meetingDetail?.seriesId || meetingDetail?.recurrenceSeriesId;
  const isRecurring = !!seriesId;

  const handleDelete = async (values) => {
    try {
      setLoading(true);

      let finalReason = "";

      // Nếu chọn preset thì lấy label
      const selectedPreset = presetReasons.find((r) => r.value === reasonType);

      if (reasonType !== "other") {
        finalReason = selectedPreset?.label || "Không xác định";
      } else {
        finalReason = values?.reason?.trim();
      }

      const payload = { reason: finalReason };

      if (isRecurring && deleteType === "series") {
        await deleteRecurringSeries(seriesId, payload);
        toast.success("Đã hủy toàn bộ chuỗi cuộc họp định kỳ!");
      } else {
        await deleteMeeting(meetingDetail.id, payload);
        toast.success("Đã hủy cuộc họp thành công!");
      }

      handleCancel();
      onSuccess?.();

    } catch (err) {
      console.error("Error:", err);
      toast.error(err?.response?.data?.message || "Không thể hủy cuộc họp!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setDeleteType("single");
    setReasonType("no_need");
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
              <p className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
                "{meetingDetail?.title}"
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hành động này sẽ gửi thông báo hủy đến tất cả người tham gia.
              </p>
            </div>
          }
          type="warning"
          showIcon
          className="mb-4 dark:bg-yellow-900/20 dark:border-yellow-700"
        />

        {/* Chọn loại hủy nếu cuộc họp định kỳ */}
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
              <Radio value="single" className="dark:text-gray-200">Chỉ cuộc họp này</Radio>
              <Radio value="series" className="dark:text-gray-200">Toàn bộ chuỗi cuộc họp (Các buổi tương lai)</Radio>
            </Radio.Group>
          </div>
        )}

        <Form form={form} layout="vertical" onFinish={handleDelete} disabled={loading}>
          
          {/* Lý do preset */}
          <Form.Item label="Chọn lý do hủy" required>
            <Radio.Group
              value={reasonType}
              onChange={(e) => setReasonType(e.target.value)}
              className="flex flex-col gap-2"
            >
              {presetReasons.map((r) => (
                <Radio key={r.value} value={r.value} className="dark:text-gray-200">
                  {r.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>

          {/* Nếu chọn OTHER thì bắt nhập */}
          {reasonType === "other" && (
            <Form.Item
              label="Nhập lý do khác"
              name="reason"
              rules={[
                { required: true, message: "Vui lòng nhập lý do hủy!" },
                { min: 5, message: "Lý do phải có ít nhất 5 ký tự!" },
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Nhập lý do hủy..."
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                maxLength={500}
                showCount
              />
            </Form.Item>
          )}

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
