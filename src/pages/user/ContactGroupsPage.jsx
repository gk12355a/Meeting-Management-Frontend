import React, { useEffect, useState, useRef } from "react";
import {
    Table, Button, Modal, Form, Input, Select, Popconfirm, message, Card, Typography, Space, Tooltip, Avatar, Tag, Spin, Radio
} from "antd";
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiUserPlus, FiSearch, FiDownload } from "react-icons/fi";
import { getMyContactGroups, createContactGroup, updateContactGroup, deleteContactGroup } from "../../services/contactGroupService";
import { searchUsers } from "../../services/userService";
import { useTranslation } from "react-i18next";
import { exportToCSV } from "../../utils/exportHelper";

const { Title, Text } = Typography;

const ContactGroupsPage = () => {
    const { t } = useTranslation("common"); // Or create a new namespace
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [form] = Form.useForm();

    // Export State
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportOption, setExportOption] = useState('all'); // 'all' | 'selected'


    // User Search State
    const [userOptions, setUserOptions] = useState([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await getMyContactGroups();
            setGroups(res.data);
        } catch (error) {
            console.error(error);
            message.error("Không thể tải danh sách nhóm liên hệ");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        setIsExportModalOpen(true);
    };

    const executeExport = () => {
        let dataToExport = [];
        if (exportOption === 'all') {
            dataToExport = groups;
        } else {
            if (selectedRowKeys.length === 0) {
                return; // Prevent export if check disabled
            }
            dataToExport = groups.filter(g => selectedRowKeys.includes(g.id));
        }

        const headers = ["ID", "Tên nhóm", "Số lượng thành viên", "Thành viên"];
        const rows = dataToExport.map(g => [
            g.id,
            g.name,
            g.members ? g.members.length : 0,
            g.members ? g.members.map(m => `${m.fullName} (${m.username})`).join("; ") : ""
        ]);
        exportToCSV(headers, rows, "Danh_sach_nhom_lien_he");
        setIsExportModalOpen(false);
        setSelectedRowKeys([]); // Clear selection after export
    };

    // Row selection config
    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys) => {
            setSelectedRowKeys(newSelectedRowKeys);
        }
    };

    const handleSearchUsers = (value) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!value) {
            setUserOptions([]);
            return;
        }

        setSearchingUsers(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const res = await searchUsers(value);
                setUserOptions(res.data.map(u => ({
                    label: `${u.fullName} (${u.username})`, // Show fullname and username
                    value: u.id,
                    user: u
                })));
            } catch (error) {
                console.error(error);
            } finally {
                setSearchingUsers(false);
            }
        }, 500);
    };

    const handleAdd = () => {
        setEditingGroup(null);
        form.resetFields();
        setUserOptions([]);
        setIsModalOpen(true);
    };

    const handleEdit = (group) => {
        setEditingGroup(group);
        // Pre-populate user options from existing members so they show up correctly
        const members = group.members.map(m => ({
            label: `${m.fullName} (${m.username})`,
            value: m.id,
            user: m
        }));
        setUserOptions(members);

        form.setFieldsValue({
            name: group.name,
            memberIds: group.members.map(m => m.id)
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await deleteContactGroup(id);
            message.success("Đã xóa nhóm liên hệ");
            fetchGroups();
        } catch (error) {
            console.error(error);
            message.error("Xóa thất bại");
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setModalLoading(true);

            const payload = {
                name: values.name,
                memberIds: values.memberIds
            };

            if (editingGroup) {
                await updateContactGroup(editingGroup.id, payload);
                message.success("Cập nhật nhóm thành công");
            } else {
                await createContactGroup(payload);
                message.success("Tạo nhóm thành công");
            }

            setIsModalOpen(false);
            fetchGroups();
        } catch (error) {
            console.error(error);
            // message.error("Có lỗi xảy ra"); // Duplicate toast usually handled by interceptors if any, but safe here
        } finally {
            setModalLoading(false);
        }
    };

    const columns = [
        {
            title: "Tên nhóm",
            dataIndex: "name",
            key: "name",
            render: (text) => <span className="font-semibold text-emerald-700">{text}</span>
        },
        {
            title: "Thành viên",
            dataIndex: "members",
            key: "members",
            render: (members) => (
                <Avatar.Group maxCount={5} maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf' }}>
                    {members.map(m => (
                        <Tooltip title={m.fullName || m.username} key={m.id}>
                            <Avatar src={m.avatarUrl}>{m.fullName?.[0] || m.username?.[0]}</Avatar>
                        </Tooltip>
                    ))}
                </Avatar.Group>
            )
        },
        {
            title: "Số lượng",
            key: "count",
            render: (_, record) => (
                <Tag color="blue">{record.members?.length || 0} thành viên</Tag>
            )
        },
        {
            title: "Hành động",
            key: "action",
            align: "right",
            render: (_, record) => (
                <div className="flex justify-end gap-2">
                    <Button
                        icon={<FiEdit2 />}
                        onClick={() => handleEdit(record)}
                        size="small"
                        className="text-blue-600 border-blue-200 hover:border-blue-500 hover:text-blue-700"
                    />
                    <Popconfirm
                        title="Xóa nhóm này?"
                        description="Hành động này không thể hoàn tác"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            icon={<FiTrash2 />}
                            size="small"
                            danger
                            className="border-red-200 hover:border-red-500 hover:background-red-50"
                        />
                    </Popconfirm>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Title level={3} className="!mb-1 dark:!text-white">Nhóm liên hệ</Title>
                    <Text className="text-gray-500 dark:text-gray-400">Quản lý các nhóm người dùng cá nhân của bạn để mời nhanh vào cuộc họp</Text>
                </div>
                <div className="flex gap-2">
                    <Button
                        icon={<FiDownload />}
                        onClick={handleExport}
                        className="flex items-center gap-2"
                    >
                        Xuất báo cáo
                    </Button>
                    <Button
                        type="primary"
                        icon={<FiPlus />}
                        onClick={handleAdd}
                        className="bg-emerald-600 hover:bg-emerald-500 border-none shadow-md"
                        size="large"
                    >
                        Tạo nhóm mới
                    </Button>
                </div>

            </div>

            <Card className="shadow-sm rounded-xl border-none dark:bg-slate-800">
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={groups}
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    rowSelection={rowSelection}
                />
            </Card>

            {/* Modal Xuất Báo Cáo */}
            <Modal
                title="Xuất báo cáo nhóm liên hệ"
                open={isExportModalOpen}
                onOk={executeExport}
                onCancel={() => setIsExportModalOpen(false)}
                okText="Xuất file"
                cancelText="Hủy"
            >
                <div className="space-y-4">
                    <Radio.Group onChange={(e) => setExportOption(e.target.value)} value={exportOption} className="flex flex-col gap-2">
                        <Radio value="all">Tất cả các nhóm ({groups.length})</Radio>
                        <Radio value="selected" disabled={selectedRowKeys.length === 0}>
                            Các nhóm đã chọn ({selectedRowKeys.length})
                        </Radio>
                    </Radio.Group>

                    {exportOption === 'selected' && selectedRowKeys.length === 0 && (
                        <div className="text-red-500 text-sm">Vui lòng chọn ít nhất một nhóm trong danh sách.</div>
                    )}
                </div>
            </Modal>

            <Modal
                title={
                    <div className="flex items-center gap-2 text-lg">
                        {editingGroup ? <FiEdit2 className="text-blue-500" /> : <FiUserPlus className="text-emerald-500" />}
                        <span>{editingGroup ? "Chỉnh sửa nhóm" : "Tạo nhóm mới"}</span>
                    </div>
                }
                open={isModalOpen}
                onOk={handleOk}
                onCancel={() => setIsModalOpen(false)}
                confirmLoading={modalLoading}
                okText={editingGroup ? "Cập nhật" : "Tạo mới"}
                cancelText="Hủy"
                centered
                width={600}
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item
                        name="name"
                        label="Tên nhóm"
                        rules={[{ required: true, message: "Vui lòng nhập tên nhóm" }]}
                    >
                        <Input placeholder="Ví dụ: Team Tech, Team Marketing..." prefix={<FiUsers className="text-gray-400" />} />
                    </Form.Item>

                    <Form.Item
                        name="memberIds"
                        label="Thành viên"
                        rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 thành viên" }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Tìm kiếm đồng nghiệp..."
                            filterOption={false}
                            onSearch={handleSearchUsers}
                            notFoundContent={searchingUsers ? <Spin size="small" /> : null}
                            options={userOptions}
                            style={{ width: '100%' }}
                            listHeight={200}
                            suffixIcon={<FiSearch />}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div >
    );
};

export default ContactGroupsPage;
