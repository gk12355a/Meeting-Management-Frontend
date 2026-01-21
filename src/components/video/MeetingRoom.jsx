import React, { useState, useEffect } from 'react';
import {
    PaginatedGridLayout,
    SpeakerLayout,
    useCallStateHooks,
    useCall,
    useStreamVideoClient
} from '@stream-io/video-react-sdk';
import {
    Channel,
    MessageList,
    MessageInput,
    Window
} from 'stream-chat-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tooltip, message, Modal, Button, Avatar } from 'antd';
import {
    FiGrid,
    FiLayout,
    FiUsers,
    FiMessageSquare,
    FiX,
    FiCopy,
    FiMic,
    FiMicOff,
    FiVideo,
    FiVideoOff,
    FiMonitor,
    FiPhoneOff,
    FiDisc,
    FiLogOut,
    FiSlash,
    FiStopCircle
} from 'react-icons/fi';

// === COMPONENT CON: DANH SÁCH NGƯỜI THAM GIA TỰ CUSTOM ===
const CustomParticipantsList = ({ onClose }) => {
    const { useParticipants } = useCallStateHooks();
    const participants = useParticipants();

    return (
        <div className="flex flex-col h-full bg-transparent text-white">
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <FiUsers className="text-emerald-500" />
                    Người tham gia <span className="text-sm bg-white/10 px-2 py-0.5 rounded-full text-gray-300">{participants.length}</span>
                </h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition">
                    <FiX size={20} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                {participants.map((participant) => {
                    const hasAudio = participant.publishedTracks.includes('audio');
                    const hasVideo = participant.publishedTracks.includes('video');
                    return (
                        <div key={participant.sessionId} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition group border border-transparent hover:border-white/5">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Avatar src={participant.image} size={40} className="bg-emerald-600 shrink-0 border border-white/10 font-bold">
                                    {participant.name?.charAt(0)?.toUpperCase() || "U"}
                                </Avatar>
                                <div className="flex flex-col truncate">
                                    <span className="font-semibold truncate text-sm text-gray-100">
                                        {participant.name || participant.userId}
                                        {participant.isLocal && <span className="text-emerald-400 text-xs ml-1">(Bạn)</span>}
                                    </span>
                                    {participant.isSpeaking && <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                        Đang nói...
                                    </span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-full ${hasAudio ? 'bg-white/10 text-gray-300' : 'bg-red-500/10 text-red-500'}`}>
                                    {hasAudio ? <FiMic size={14} /> : <FiMicOff size={14} />}
                                </div>
                                <div className={`p-1.5 rounded-full ${hasVideo ? 'bg-white/10 text-gray-300' : 'bg-red-500/10 text-red-500'}`}>
                                    {hasVideo ? <FiVideo size={14} /> : <FiVideoOff size={14} />}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// === COMPONENT NÚT ĐIỀU KHIỂN ===
const ControlButton = ({ onClick, isActive, onIcon: OnIcon, offIcon: OffIcon, title, customActiveColor, isActiveColor = false }) => {
    const Icon = isActive ? (OffIcon || OnIcon) : OnIcon;
    return (
        <Tooltip title={title}>
            <button
                onClick={onClick}
                className={`
                flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 shadow-md transform hover:-translate-y-1
                ${isActive
                        ? (customActiveColor || (isActiveColor ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' : 'bg-slate-800 text-white'))
                        : 'bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white'
                    }
                ${!isActive && (title.includes("Mic") || title.includes("Camera")) ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : ''}
            `}
            >
                <Icon size={20} />
            </button>
        </Tooltip>
    );
};

// === COMPONENT CHÍNH ===
const MeetingRoom = ({ chatChannel, isOrganizer }) => {
    const { meetingId } = useParams();

    const [layout, setLayout] = useState('speaker-left');
    const [activeSidebar, setActiveSidebar] = useState(null);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState('');

    const client = useStreamVideoClient();
    const call = useCall();

    // === LOGIC DỌN DẸP ===
    const cleanupMedia = async () => {
        if (!call) return;
        try {
            const localParticipant = call.state.localParticipant$.value;
            if (localParticipant) {
                if (localParticipant.videoStream) localParticipant.videoStream.getTracks().forEach(track => track.stop());
                if (localParticipant.audioStream) localParticipant.audioStream.getTracks().forEach(track => track.stop());
            }
            await call.camera.disable();
            await call.microphone.disable();
            await call.stopRecording().catch(() => { });
            await call.leave();
        } catch (error) {
            console.error("Lỗi dọn dẹp:", error);
        }
    };

    // === HOOKS STATE ===
    const {
        useMicrophoneState,
        useCameraState,
        useScreenShareState,
        useCallCallingState,
        useIsCallRecordingInProgress,
        useOwnCapabilities
    } = useCallStateHooks();

    const { isMute: isMicMuted, microphone } = useMicrophoneState();
    const { isMute: isCamMuted, camera } = useCameraState();

    // [FIX LOGIC NGƯỢC Ở ĐÂY]
    // isMute = true nghĩa là TẮT share. isMute = false nghĩa là ĐANG share.
    const { isMute: isScreenSharePaused, screenShare } = useScreenShareState();
    const isScreenSharing = !isScreenSharePaused; // Đảo ngược lại để dùng cho đúng logic

    const isRecording = useIsCallRecordingInProgress();
    // const capabilities = useOwnCapabilities();
    const callingState = useCallCallingState();

    // const isOrganizer = capabilities.includes('end-call') ||
    //     (String(call?.state?.createdBy?.id) === String(client?.userID));

    // === CÁC HÀM XỬ LÝ ===
    const handleLeave = async () => {
        await cleanupMedia();
        window.location.href = '/user/my-meetings';
    };

    const handleEndCall = async () => {
        try {
            await cleanupMedia();
            await call.endCall();
            message.success("Cuộc họp đã kết thúc");
        } catch (error) {
            console.error(error);
        }
        window.location.href = '/user/my-meetings';
    };

    const onLeaveButtonClick = () => {
        if (isOrganizer) setIsLeaveModalOpen(true);
        else handleLeave();
    };

    const toggleRecord = async () => {
        try {
            if (isRecording) {
                await call?.stopRecording();
                message.success("Đã dừng ghi âm");
            } else {
                await call?.startRecording();
                message.success("Đang ghi âm...");
            }
        } catch (error) {
            message.error("Lỗi thao tác ghi âm");
        }
    };

    const toggleSidebar = (type) => {
        setActiveSidebar(activeSidebar === type ? null : type);
    };

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    if (callingState !== 'joined') return null;

    const CallLayout = () => {
        switch (layout) {
            case 'grid': return <PaginatedGridLayout />;
            case 'speaker-right': return <SpeakerLayout participantsBarPosition="left" />;
            default: return <SpeakerLayout participantsBarPosition="right" />;
        }
    };



    return (
        <section className="relative h-screen w-full overflow-hidden bg-slate-950 text-white font-sans selection:bg-emerald-500/30">

            {/* HEADER - Updated to Floating Glass */}
            <div className="absolute top-6 left-6 z-20 flex items-center gap-4 bg-slate-900/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/5 shadow-xl transition-all hover:bg-slate-900/80">
                <span className="font-semibold text-gray-200 tracking-wide">{currentTime}</span>
                <div className="w-[1px] h-4 bg-gray-600"></div>
                <span className="font-bold text-white tracking-wider font-mono">{meetingId}</span>
                <Tooltip title="Sao chép mã phòng">
                    <button
                        onClick={() => { navigator.clipboard.writeText(window.location.href); message.success("Đã sao chép link phòng họp"); }}
                        className="text-gray-400 hover:text-emerald-400 transition-colors p-1 rounded-md hover:bg-white/5"
                    >
                        <FiCopy size={16} />
                    </button>
                </Tooltip>
            </div>

            {/* [FIXED] CHỈ HIỂN THỊ KHI ĐANG SHARE THẬT SỰ */}
            {isScreenSharing && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-2xl border border-blue-400/30 animate-slide-down">
                    <div className="flex items-center gap-3">
                        <FiMonitor className="animate-pulse" size={24} />
                        <span className="font-semibold text-lg">Bạn đang trình bày màn hình</span>
                    </div>
                    <button
                        onClick={() => screenShare.toggle()}
                        className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-5 py-2 rounded-xl font-bold text-sm transition-colors shadow-sm"
                    >
                        <FiStopCircle size={18} />
                        Dừng chia sẻ
                    </button>
                </div>
            )}

            {/* MAIN CONTENT */}
            <div className="relative flex size-full items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
                <div className="flex size-full max-w-[1600px] items-center px-4 pb-28 pt-20">
                    <CallLayout />
                </div>

                {/* SIDEBAR - Updated Glassmorphism */}
                {activeSidebar && (
                    <div className="absolute right-6 top-6 bottom-28 w-80 md:w-96 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl flex flex-col shadow-2xl z-20 animate-slide-left overflow-hidden">
                        {activeSidebar === 'participants' ? (
                            <CustomParticipantsList onClose={() => setActiveSidebar(null)} />
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-center p-5 border-b border-white/10 bg-white/5">
                                    <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                        <FiMessageSquare className="text-emerald-500" /> Tin nhắn
                                    </h3>
                                    <button onClick={() => setActiveSidebar(null)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition"><FiX size={20} /></button>
                                </div>
                                <div className="flex-1 overflow-hidden custom-chat-dark bg-transparent">
                                    <Channel channel={chatChannel}>
                                        <Window>
                                            <MessageList hideDeletedMessages />
                                            <MessageInput placeholder="Nhập tin nhắn..." focus />
                                        </Window>
                                    </Channel>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* FLOATING BAR - Updated Capsule Design */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 p-4 bg-slate-900/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl z-50 transition-all hover:bg-slate-900/90">
                <ControlButton
                    onClick={() => microphone.toggle()}
                    isActive={!isMicMuted}
                    onIcon={FiMicOff}
                    offIcon={FiMic}
                    title={isMicMuted ? "Bật Mic" : "Tắt Mic"}
                    isActiveColor
                />
                <ControlButton
                    onClick={() => camera.toggle()}
                    isActive={!isCamMuted}
                    onIcon={FiVideoOff}
                    offIcon={FiVideo}
                    title={isCamMuted ? "Bật Camera" : "Tắt Camera"}
                    isActiveColor
                />
                <div className="w-[1px] h-8 bg-white/10 mx-1"></div>

                {/* [FIXED] Nút Share Screen dùng biến isScreenSharing đã đảo ngược */}
                <ControlButton
                    onClick={() => screenShare.toggle()}
                    isActive={isScreenSharing}
                    isActiveColor={true}
                    customActiveColor="bg-blue-600 hover:bg-blue-700"
                    onIcon={FiMonitor}
                    offIcon={FiStopCircle}
                    title={isScreenSharing ? "Dừng chia sẻ" : "Chia sẻ màn hình"}
                />

                <Tooltip title={isRecording ? "Dừng ghi" : "Ghi cuộc họp"}>
                    <button onClick={toggleRecord} className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 shadow-md transform hover:-translate-y-1 ${isRecording ? 'bg-red-500 animate-pulse text-white shadow-red-500/50' : 'bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white'}`}><FiDisc size={20} /></button>
                </Tooltip>
                <Tooltip title="Đổi bố cục">
                    <button onClick={() => setLayout(prev => prev === 'grid' ? 'speaker-left' : 'grid')} className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white transition-all shadow-md transform hover:-translate-y-1">{layout === 'grid' ? <FiLayout size={20} /> : <FiGrid size={20} />}</button>
                </Tooltip>
                <div className="w-[1px] h-8 bg-white/10 mx-1"></div>

                <ControlButton onClick={() => toggleSidebar('participants')} isActive={activeSidebar === 'participants'} isActiveColor={true} onIcon={FiUsers} title="Mọi người" />
                <ControlButton onClick={() => toggleSidebar('chat')} isActive={activeSidebar === 'chat'} isActiveColor={true} onIcon={FiMessageSquare} title="Chat" />

                <div className="w-[1px] h-8 bg-white/10 mx-1"></div>

                <Tooltip title={isOrganizer ? "Kết thúc / Rời đi" : "Rời cuộc họp"}>
                    <button onClick={onLeaveButtonClick} className="flex items-center justify-center w-16 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg shadow-red-600/20 transform hover:-translate-y-1 ml-2"><FiPhoneOff size={24} /></button>
                </Tooltip>
            </div>

            <Modal
                title={<span className="text-lg font-bold">Bạn muốn rời cuộc họp?</span>}
                open={isLeaveModalOpen}
                onCancel={() => setIsLeaveModalOpen(false)}
                footer={null}
                centered
                width={400}
            >
                <div className="flex flex-col gap-3 mt-4">
                    <p className="text-gray-600 mb-2">Bạn là chủ phòng. Tùy chọn kết thúc:</p>
                    <Button danger type="primary" size="large" icon={<FiSlash />} onClick={handleEndCall} className="w-full h-10 flex items-center justify-center gap-2">Kết thúc tất cả</Button>
                    <Button size="large" icon={<FiLogOut />} onClick={handleLeave} className="w-full h-10 flex items-center justify-center gap-2">Chỉ mình tôi rời đi</Button>
                    <Button type="text" onClick={() => setIsLeaveModalOpen(false)}>Hủy</Button>
                </div>
            </Modal>

        </section>
    );
};

export default MeetingRoom;