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
            message.error(t("contactGroups.loadError"));
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
            message.success(t("contactGroups.deleteSuccess"));
            fetchGroups();
        } catch (error) {
            console.error(error);
            message.error(t("messages.deleteError"));
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
                message.success(t("contactGroups.updateSuccess"));
            } else {
                await createContactGroup(payload);
                message.success(t("contactGroups.createSuccess"));
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
            title: t("contactGroups.groupName"),
            dataIndex: "name",
            key: "name",
            render: (text) => <span className="font-semibold text-emerald-700">{text}</span>
        },
        {
            title: t("contactGroups.members"),
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
            title: t("contactGroups.membersCount"),
            key: "count",
            render: (_, record) => (
                <Tag color="blue">{t("contactGroups.membersCountLabel", { count: record.members?.length || 0 })}</Tag>
            )
        },
        {
            title: t("common.actions"),
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
                        title={t("contactGroups.deleteGroupConfirm")}
                        description={t("contactGroups.deleteGroupDesc")}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t("buttons.delete")}
                        cancelText={t("buttons.cancel")}
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
                    <Title level={3} className="!mb-1 dark:!text-white">{t("contactGroups.title")}</Title>
                    <Text className="text-gray-500 dark:text-gray-400">{t("contactGroups.subTitle")}</Text>
                </div>
                <div className="flex gap-2">
                    <Button
                        icon={<FiDownload />}
                        onClick={handleExport}
                        className="flex items-center gap-2"
                    >
                        {t("contactGroups.exportReport")}
                    </Button>
                    <Button
                        type="primary"
                        icon={<FiPlus />}
                        onClick={handleAdd}
                        className="bg-emerald-600 hover:bg-emerald-500 border-none shadow-md"
                        size="large"
                    >
                        {t("contactGroups.createGroup")}
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
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {/* Modal Xuất Báo Cáo */}
            <Modal
                title={t("contactGroups.exportModalTitle")}
                open={isExportModalOpen}
                onOk={executeExport}
                onCancel={() => setIsExportModalOpen(false)}
                okText={t("contactGroups.exportFile")}
                cancelText={t("buttons.cancel")}
            >
                <div className="space-y-4">
                    <Radio.Group onChange={(e) => setExportOption(e.target.value)} value={exportOption} className="flex flex-col gap-2">
                        <Radio value="all">{t("contactGroups.exportAll")} ({groups.length})</Radio>
                        <Radio value="selected" disabled={selectedRowKeys.length === 0}>
                            {t("contactGroups.exportSelected")} ({selectedRowKeys.length})
                        </Radio>
                    </Radio.Group>

                    {exportOption === 'selected' && selectedRowKeys.length === 0 && (
                        <div className="text-red-500 text-sm">{t("contactGroups.selectGroupError")}</div>
                    )}
                </div>
            </Modal>

            <Modal
                title={
                    <div className="flex items-center gap-2 text-lg">
                        {editingGroup ? <FiEdit2 className="text-blue-500" /> : <FiUserPlus className="text-emerald-500" />}
                        <span>{editingGroup ? t("contactGroups.editGroup") : t("contactGroups.createGroup")}</span>
                    </div>
                }
                open={isModalOpen}
                onOk={handleOk}
                onCancel={() => setIsModalOpen(false)}
                confirmLoading={modalLoading}
                okText={editingGroup ? t("buttons.update") : t("buttons.create")}
                cancelText={t("buttons.cancel")}
                centered
                width={600}
            >
                <Form form={form} layout="vertical" className="mt-4">
                    <Form.Item
                        name="name"
                        label={t("contactGroups.groupName")}
                        rules={[{ required: true, message: t("contactGroups.enterGroupNameError") }]}
                    >
                        <Input placeholder={t("contactGroups.groupNamePlaceholder")} prefix={<FiUsers className="text-gray-400" />} />
                    </Form.Item>

                    <Form.Item
                        name="memberIds"
                        label={t("contactGroups.members")}
                        rules={[{ required: true, message: t("contactGroups.selectMemberError") }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder={t("contactGroups.membersPlaceholder")}
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
