// src/components/user/DeleteMeetingModal.jsx
import React, { useState } from "react";
import { Modal, Form, Input, Button, Alert } from "antd";
import { FiAlertTriangle } from "react-icons/fi";
import { deleteMeeting, deleteRecurringSeries } from "../../services/meetingService";
import { toast } from "react-toastify";

const { TextArea } = Input;

const DeleteMeetingModal = ({ open, onCancel, meetingDetail, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [deleteType, setDeleteType] = useState("single"); // "single" hoặc "series"

  const isRecurring = !!meetingDetail?.recurrenceSeriesId;

  const handleDelete = async (values) => {
    try {
      setLoading(true);
      
      const payload = {
        reason: values.reason || "Không có lý do"
      };

      // Nếu là cuộc họp định kỳ và chọn xóa toàn bộ chuỗi
      if (isRecurring && deleteType === "series") {
        await deleteRecurringSeries(meetingDetail.recurrenceSeriesId, payload);
        toast.success("Đã hủy toàn bộ chuỗi cuộc họp định kỳ thành công!");
      } else {
        // Xóa cuộc họp đơn lẻ hoặc chỉ 1 cuộc trong chuỗi
        await deleteMeeting(meetingDetail.id, payload);
        toast.success(isRecurring ? "Đã hủy cuộc họp này thành công!" : "Đã hủy cuộc họp thành công!");
      }
      
      form.resetFields();
      setDeleteType("single");
      onSuccess();
      onCancel();
    } catch (err) {
      console.error("Lỗi khi hủy cuộc họp:", err);
      const msg = err?.response?.data?.message || "Không thể hủy cuộc họp!";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setDeleteType("single");
    onCancel();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={500}
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
                Tất cả người tham gia sẽ nhận được thông báo về việc hủy cuộc họp này.
              </p>
            </div>
          }
          type="warning"
          showIcon
          className="mb-4 dark:bg-yellow-900/20 dark:border-yellow-700"
        />

        {/* Hiển thị tùy chọn nếu là cuộc họp định kỳ */}
        {isRecurring && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-3">
              Đây là cuộc họp định kỳ. Bạn muốn hủy:
            </p>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="deleteType"
                  value="single"
                  checked={deleteType === "single"}
                  onChange={(e) => setDeleteType(e.target.value)}
                  className="mr-2"
                  disabled={loading}
                />
                <span className="text-sm dark:text-gray-200">
                  Chỉ cuộc họp này
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="deleteType"
                  value="series"
                  checked={deleteType === "series"}
                  onChange={(e) => setDeleteType(e.target.value)}
                  className="mr-2"
                  disabled={loading}
                />
                <span className="text-sm dark:text-gray-200">
                  Toàn bộ chuỗi cuộc họp định kỳ
                </span>
              </label>
            </div>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleDelete}
          disabled={loading}
        >
          <Form.Item
            label="Lý do hủy cuộc họp"
            name="reason"
            rules={[
              { required: true, message: "Vui lòng nhập lý do hủy cuộc họp!" },
              { min: 10, message: "Lý do phải có ít nhất 10 ký tự!" }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập lý do hủy cuộc họp (tối thiểu 10 ký tự)..."
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              maxLength={500}
              showCount
            />
          </Form.Item>

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