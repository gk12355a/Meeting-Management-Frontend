import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StreamVideo, StreamVideoClient, StreamCall } from '@stream-io/video-react-sdk';
import { StreamChat } from 'stream-chat'; 
import { Chat } from 'stream-chat-react'; 
import { getVideoToken } from '../../services/videoService';
import MeetingSetup from '../../components/video/MeetingSetup';
import MeetingRoom from '../../components/video/MeetingRoom';
import { Spin, message } from 'antd';

// Import CSS
import '@stream-io/video-react-sdk/dist/css/styles.css';
// QUAN TRỌNG: Dùng phiên bản v2 để tránh lỗi import
import 'stream-chat-react/dist/css/v2/index.css'; 

const VideoPage = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  
  const [videoClient, setVideoClient] = useState(null);
  const [call, setCall] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [chatChannel, setChatChannel] = useState(null);
  
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!meetingId) return;

    const initClients = async () => {
      try {
        setLoading(true);
        // 1. Lấy Token (Gửi meetingId để check quyền)
        const { token, apiKey, user } = await getVideoToken(meetingId);

        if (!token || !apiKey || !user) {
             throw new Error("Không lấy được token.");
        }

        const streamUser = {
            id: String(user.id),
            name: user.name || user.fullName || "User",
            image: user.image,
        };

        // --- A. VIDEO CLIENT ---
        const vClient = new StreamVideoClient({ apiKey, user: streamUser, token });
        const callInstance = vClient.call('default', meetingId);
        await callInstance.getOrCreate();

        // --- B. CHAT CLIENT ---
        const cClient = StreamChat.getInstance(apiKey);
        await cClient.connectUser(streamUser, token);
        
        const channel = cClient.channel('messaging', meetingId, {
            name: `Phòng họp ${meetingId}`,
            members: [streamUser.id], 
        });
        await channel.watch();

        setVideoClient(vClient);
        setCall(callInstance);
        setChatClient(cClient);
        setChatChannel(channel);

      } catch (error) {
        console.error("Lỗi:", error);
        if (error.response && error.response.status === 403) {
             message.error("⛔ Bạn không có quyền tham gia!");
        } else {
             message.error("Lỗi kết nối.");
        }
        navigate('/user/my-meetings');
      } finally {
        setLoading(false);
      }
    };

    initClients();

    return () => {
        if (videoClient) videoClient.disconnectUser();
        if (chatClient) chatClient.disconnectUser();
    };
  }, [meetingId, navigate]);

  if (loading || !videoClient || !chatClient) {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-gray-900">
            <Spin size="large" tip="Đang kết nối..." />
        </div>
    );
  }

  return (
    <StreamVideo client={videoClient}>
      <StreamCall call={call}>
        {!isSetupComplete ? (
            <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
        ) : (
            <Chat client={chatClient} theme="str-chat__theme-dark">
                <MeetingRoom chatChannel={chatChannel} />
            </Chat> 
        )}
      </StreamCall>
    </StreamVideo>
  );
};

export default VideoPage;