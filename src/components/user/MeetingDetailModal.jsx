// src/components/user/MeetingDetailModal.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "antd";
import {
  FiX,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiCpu,
  FiUsers,
  FiInfo,
  FiVideo,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiFilm,
  FiPlay
} from "react-icons/fi";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";
import "dayjs/locale/vi";
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { getVideoToken } from '../../services/videoService';

dayjs.locale("vi");

const MeetingDetailModal = ({ open, onClose, meeting, children }) => {
  const { t } = useTranslation("meetingDetail");
  const navigate = useNavigate();

  // Close when pressing Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  // Helper function for participant status
  const getStatus = (status) => {
    const statusMap = {
      PENDING: {
        color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800",
        label: t("participantPending") || "Chờ xác nhận",
        icon: <FiAlertCircle size={14} />
      },
      ACCEPTED: {
        color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800",
        label: t("participantAccepted") || "Đã tham gia",
        icon: <FiCheckCircle size={14} />
      },
      DECLINED: {
        color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800",
        label: t("participantDeclined") || "Từ chối",
        icon: <FiX size={14} />
      }
    };

    return statusMap[status] || {
      color: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
      label: status || "Không rõ",
      icon: <FiUsers size={14} />
    };
  };

  // Helper function for meeting status
  const getMeetingStatus = (status) => {
    const statusMap = {
      CONFIRMED: {
        color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800",
        label: t("meetingConfirmed") || "Đã xác nhận"
      },
      APPROVED: {
        color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800",
        label: t("meetingApproved") || "Đã duyệt"
      },
      CANCELLED: {
        color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800",
        label: t("meetingCancelled") || "Đã hủy"
      },
      PENDING_APPROVAL: {
        color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800",
        label: t("meetingPending") || "Chờ duyệt"
      }
    };

    return statusMap[status] || {
      color: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600",
      label: status || "Không rõ"
    };
  };

  // Render participants list
  const renderParticipants = () => {
    if (!meeting) return null;
    let organizer = meeting.organizer;
    let participants = Array.isArray(meeting.participants)
      ? [...meeting.participants]
      : [];

    if (!organizer) {
      organizer = participants.find(
        (p) => p.role === "ORGANIZER" || p.isOrganizer === true
      );
      if (organizer) {
        participants = participants.filter((p) => p !== organizer);
      }
    } else {
      participants = participants.filter((p) => p.id !== organizer.id);
    }

    return (
      <>
        {organizer && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                {organizer.fullName ? organizer.fullName.charAt(0).toUpperCase() : <FiUser />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {organizer.fullName || "Không rõ"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                    {t("organizer") || "BTC"}
                  </span>
                  {organizer.status && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${getStatus(organizer.status).color}`}>
                      {getStatus(organizer.status).label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {participants.length > 0 ? (
          <div className="space-y-2 mt-3">
            {participants.map((p) => {
              const status = getStatus(p.status);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs">
                      {p.fullName ? p.fullName.charAt(0).toUpperCase() : <FiUser />}
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {p.fullName || t("unknown")}
                    </span>
                  </div>
                  <span className={`block w-2.5 h-2.5 rounded-full ${status.color.split(' ')[1] || 'bg-slate-400'}`} title={status.label}></span>
                </div>
              );
            })}
          </div>
        ) : !organizer ? (
          <p className="text-sm text-center text-slate-400 py-4 italic">
            {t("noParticipants") || "Không có người tham gia"}
          </p>
        ) : null}
      </>
    );
  };

  const meetingStatus = meeting ? getMeetingStatus(meeting.status) : {};

  // Recordings Logic
  const [recordings, setRecordings] = useState([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);

  useEffect(() => {
    let client;
    const fetchRecordings = async () => {
      if (!open || !meeting || !meeting.id) return;

      setLoadingRecordings(true);
      try {
        const { token, apiKey, user } = await getVideoToken(meeting.id);
        if (!token || !apiKey || !user) return;

        const streamUser = {
          id: String(user.id),
          name: user.name || user.fullName || "User",
          image: user.image,
        };

        client = new StreamVideoClient({ apiKey, user: streamUser, token });
        const call = client.call('default', meeting.id.toString());
        const { recordings: recs } = await call.queryRecordings();
        setRecordings(recs);
      } catch (error) {
        console.error("Failed to load recordings", error);
      } finally {
        setLoadingRecordings(false);
      }
    };

    if (open) {
      fetchRecordings();
    }

    return () => {
      if (client) client.disconnectUser();
    };
  }, [open, meeting]);

  // Hàm xử lý khi bấm vào họp
  const handleJoinMeeting = () => {
    onClose();
    navigate(`/meeting/${meeting.id}`);
  };

  return (
    <AnimatePresence>
      {open && meeting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300, duration: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 dark:border-slate-700"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white leading-tight mb-2">
                  {meeting.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-md border font-medium flex items-center gap-1.5 ${meetingStatus.color}`}>
                    <FiInfo size={12} />
                    {meetingStatus.label}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                    <FiClock size={12} />
                    {dayjs(meeting.endTime).diff(dayjs(meeting.startTime), 'minute')} phút
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Meeting Info */}
                <div className="md:col-span-2 space-y-6">
                  {/* Time & Place Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <FiCalendar /> {t("date") || "Ngày"}
                      </p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {dayjs(meeting.startTime).format("dddd, DD/MM/YYYY")}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <FiClock /> {t("time") || "Thời gian"}
                      </p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {dayjs(meeting.startTime).format("HH:mm")} - {dayjs(meeting.endTime).format("HH:mm")}
                      </p>
                    </div>
                    <div className="col-span-1 sm:col-span-2 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                      <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <FiMapPin /> {t("room") || "Phòng họp"}
                      </p>
                      <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                        {meeting.room?.name || "Chưa xác định"}
                      </p>
                    </div>
                  </div>

                  {/* Devices */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <FiCpu className="text-emerald-500" />
                      {t("devicesUsed") || "Thiết bị sử dụng"}
                    </h3>
                    {meeting.devices && meeting.devices.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {meeting.devices.map((device, idx) => (
                          <span
                            key={device.id || idx}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 text-xs font-medium"
                          >
                            {device.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-sm text-slate-400 italic text-center border border-slate-100 dark:border-slate-700">
                        {t("noDevices") || "Không có thiết bị"}
                      </div>
                    )}
                  </div>

                  {/* Recordings Section */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <FiFilm className="text-red-500" />
                      {t("recordings") || "Bản ghi cuộc họp"}
                    </h3>
                    {loadingRecordings ? (
                      <div className="text-sm text-slate-400 italic">Đang tải bản ghi...</div>
                    ) : recordings.length > 0 ? (
                      <div className="space-y-2">
                        {recordings.map((rec) => (
                          <div key={rec.filename} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900/50 transition-colors group">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {dayjs(rec.start_time).format("HH:mm DD/MM/YYYY")}
                              </span>
                              <span className="text-xs text-slate-500">
                                {dayjs(rec.end_time).diff(dayjs(rec.start_time), 'minute')} phút
                              </span>
                            </div>
                            <a
                              href={rec.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 text-xs font-bold transition-all"
                            >
                              <FiPlay size={12} /> Xem
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-sm text-slate-400 italic text-center border border-slate-100 dark:border-slate-700">
                        {t("noRecordings") || "Không có bản ghi nào"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Participants */}
                <div className="md:col-span-1">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 h-full">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FiUsers className="text-blue-500" />
                        {t("participants") || "Thành viên"}
                      </span>
                      <span className="text-xs bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full shadow-sm text-slate-500">
                        {meeting.participants?.length || 0}
                      </span>
                    </h3>
                    <div className="space-y-1">
                      {renderParticipants()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            {(children || meeting.status === "APPROVED" || meeting.status === "CONFIRMED") && (
              <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                {(meeting.status === "APPROVED" || meeting.status === "CONFIRMED") && (
                  <Button
                    type="primary"
                    className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 border-transparent shadow-lg shadow-emerald-500/20 font-semibold flex items-center gap-2"
                    onClick={handleJoinMeeting}
                    icon={<FiVideo size={18} />}
                  >
                    {t("joinOnline") || "Vào họp Online"}
                  </Button>
                )}
                {children}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MeetingDetailModal;