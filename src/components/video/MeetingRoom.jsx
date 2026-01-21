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
        <div className="flex flex-col h-full bg-[#19232d] text-white">
            <div className="flex items-center justify-between p-4 border-b border-[#2e3740]">
                <h3 className="font-semibold text-lg">Người tham gia ({participants.length})</h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-[#2e3740] text-gray-400 hover:text-white transition">
                    <FiX size={20} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {participants.map((participant) => {
                    const hasAudio = participant.publishedTracks.includes('audio');
                    const hasVideo = participant.publishedTracks.includes('video');
                    return (
                        <div key={participant.sessionId} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#2e3740] transition mb-1 group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Avatar src={participant.image} size={40} className="bg-blue-600 shrink-0 border border-gray-600">
                                    {participant.name?.charAt(0)?.toUpperCase() || "U"}
                                </Avatar>
                                <div className="flex flex-col truncate">
                                    <span className="font-medium truncate text-sm">
                                        {participant.name || participant.userId}
                                        {participant.isLocal && <span className="text-gray-400 text-xs ml-1">(Bạn)</span>}
                                    </span>
                                    {participant.isSpeaking && <span className="text-green-400 text-xs font-medium">Đang nói...</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-full ${hasAudio ? 'bg-[#3c4043]' : 'bg-[#ea4335]'}`}>
                                    {hasAudio ? <FiMic size={14} /> : <FiMicOff size={14} />}
                                </div>
                                <div className={`p-1.5 rounded-full ${hasVideo ? 'bg-[#3c4043]' : 'bg-[#ea4335]'}`}>
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

// === COMPONENT CHÍNH ===
const MeetingRoom = ({ chatChannel }) => {
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
          await call.stopRecording().catch(() => {});
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
  const capabilities = useOwnCapabilities();
  const callingState = useCallCallingState();

  const isOrganizer = capabilities.includes('end-call') || 
      (String(call?.state?.createdBy?.id) === String(client?.userID));

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

  const ControlButton = ({ onClick, isActive, onIcon: OnIcon, offIcon: OffIcon, title, isDanger, isActiveColor = false }) => {
      const Icon = isActive ? (OffIcon || OnIcon) : OnIcon;
      return (
        <Tooltip title={title}>
            <button 
                onClick={onClick}
                className={`
                    flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 shadow-lg
                    ${isDanger 
                        ? 'bg-[#ea4335] hover:bg-[#d93025] text-white'
                        : isActiveColor
                            ? 'bg-[#3b82f6] text-white hover:bg-[#2563eb]'
                            : isActive 
                                ? 'bg-[#2e3740] text-white hover:bg-[#4c535b]'
                                : 'bg-[#2e3740] text-white hover:bg-[#4c535b]'
                    }
                    ${isDanger && isActive ? 'bg-[#ea4335]' : ''}
                    ${!isDanger && !isActiveColor && isActive ? 'bg-[#ea4335]' : ''} 
                `}
                style={
                    (title.includes("Mic") || title.includes("Camera")) 
                    ? { backgroundColor: isActive ? '#ea4335' : '#2e3740' } 
                    : {}
                }
            >
                <Icon size={20} />
            </button>
        </Tooltip>
      );
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#19232d] text-white font-sans">
      
      {/* HEADER */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-4 bg-[#19232d]/50 backdrop-blur-sm px-4 py-2 rounded-full border border-[#ffffff10]">
          <span className="font-medium text-gray-200">{currentTime}</span>
          <div className="w-[1px] h-4 bg-gray-500"></div>
          <span className="font-bold text-white tracking-wide">{meetingId}</span>
          <Tooltip title="Sao chép mã">
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); message.success("Đã sao chép link"); }} className="text-gray-400 hover:text-white transition"><FiCopy /></button>
          </Tooltip>
      </div>

      {/* [FIXED] CHỈ HIỂN THỊ KHI ĐANG SHARE THẬT SỰ */}
      {isScreenSharing && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 bg-[#3b82f6] text-white px-6 py-3 rounded-full shadow-2xl border border-blue-400/30 animate-slide-down">
            <div className="flex items-center gap-3">
                <FiMonitor className="animate-pulse" size={24} />
                <span className="font-semibold text-lg">Bạn đang trình bày màn hình</span>
            </div>
            <button
                onClick={() => screenShare.toggle()}
                className="flex items-center gap-2 bg-white text-[#3b82f6] hover:bg-blue-50 px-4 py-2 rounded-full font-bold text-sm transition-colors shadow-sm"
            >
                <FiStopCircle size={18} />
                Dừng chia sẻ
            </button>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="relative flex size-full items-center justify-center">
        <div className="flex size-full max-w-[1400px] items-center px-2 pb-24 pt-14">
           <CallLayout />
        </div>

        {/* SIDEBAR */}
        {activeSidebar && (
             <div className="absolute right-4 top-4 bottom-24 w-80 md:w-96 bg-[#19232d] border border-[#2e3740] rounded-2xl flex flex-col shadow-2xl z-20 animate-slide-left overflow-hidden">
                 {activeSidebar === 'participants' ? (
                     <CustomParticipantsList onClose={() => setActiveSidebar(null)} />
                 ) : (
                     <div className="flex flex-col h-full">
                         <div className="flex justify-between items-center p-4 border-b border-[#2e3740] bg-[#19232d]">
                             <h3 className="font-semibold text-lg text-white">Tin nhắn trò chuyện</h3>
                             <button onClick={() => setActiveSidebar(null)} className="p-2 rounded-full hover:bg-[#2e3740] text-gray-400 hover:text-white transition"><FiX size={20}/></button>
                         </div>
                         <div className="flex-1 overflow-hidden custom-chat-dark bg-[#131a22]">
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

      {/* FLOATING BAR */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 p-3 bg-[#19232d]/90 backdrop-blur-md rounded-2xl border border-[#2e3740] shadow-2xl z-50">
            <ControlButton onClick={() => microphone.toggle()} isActive={isMicMuted} onIcon={FiMic} offIcon={FiMicOff} title={isMicMuted ? "Bật Mic" : "Tắt Mic"} />
            <ControlButton onClick={() => camera.toggle()} isActive={isCamMuted} onIcon={FiVideo} offIcon={FiVideoOff} title={isCamMuted ? "Bật Camera" : "Tắt Camera"} />
            <div className="w-[1px] h-8 bg-gray-600/50 mx-1"></div>
            
            {/* [FIXED] Nút Share Screen dùng biến isScreenSharing đã đảo ngược */}
            <ControlButton 
                onClick={() => screenShare.toggle()} 
                isActive={isScreenSharing} 
                isActiveColor={true} 
                onIcon={FiMonitor} 
                offIcon={FiStopCircle} 
                title={isScreenSharing ? "Dừng chia sẻ" : "Chia sẻ màn hình"} 
            />
            
            <Tooltip title={isRecording ? "Dừng ghi" : "Ghi cuộc họp"}>
                <button onClick={toggleRecord} className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 shadow-lg ${isRecording ? 'bg-[#ea4335] animate-pulse text-white' : 'bg-[#2e3740] text-white hover:bg-[#4c535b]'}`}><FiDisc size={20} /></button>
            </Tooltip>
            <Tooltip title="Đổi bố cục">
                <button onClick={() => setLayout(prev => prev === 'grid' ? 'speaker-left' : 'grid')} className="flex items-center justify-center w-12 h-12 rounded-full bg-[#2e3740] text-white hover:bg-[#4c535b] transition-all shadow-lg">{layout === 'grid' ? <FiLayout size={20}/> : <FiGrid size={20}/>}</button>
            </Tooltip>
            <div className="w-[1px] h-8 bg-gray-600/50 mx-1"></div>
            <ControlButton onClick={() => toggleSidebar('participants')} isActive={activeSidebar === 'participants'} isActiveColor={true} onIcon={FiUsers} title="Mọi người" />
            <ControlButton onClick={() => toggleSidebar('chat')} isActive={activeSidebar === 'chat'} isActiveColor={true} onIcon={FiMessageSquare} title="Chat" />
            <div className="w-[1px] h-8 bg-gray-600/50 mx-1"></div>
            <Tooltip title={isOrganizer ? "Kết thúc / Rời đi" : "Rời cuộc họp"}>
                <button onClick={onLeaveButtonClick} className="flex items-center justify-center w-14 h-12 rounded-2xl bg-[#ea4335] hover:bg-[#d93025] text-white transition-all shadow-lg ml-1"><FiPhoneOff size={24} /></button>
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