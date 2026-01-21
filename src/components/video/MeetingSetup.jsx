import React, { useEffect } from 'react';
import { 
  DeviceSettings, 
  VideoPreview, 
  useCall,
  useCallStateHooks
} from '@stream-io/video-react-sdk';
import { Button, Card, Tooltip } from 'antd';
import { 
  FiVideo, 
  FiVideoOff, 
  FiMic, 
  FiMicOff,
  FiCheckCircle 
} from 'react-icons/fi';

const MeetingSetup = ({ setIsSetupComplete }) => {
  const call = useCall();
  
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { isMute: isCamMuted, camera } = useCameraState();
  const { isMute: isMicMuted, microphone } = useMicrophoneState();

  useEffect(() => {
    if (call) {
        call.camera.enable().catch(err => console.error(err));
        call.microphone.enable().catch(err => console.error(err));
    }
  }, [call]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-white text-gray-900 gap-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 text-blue-600">Kiểm tra thiết bị</h1>
        <p className="text-gray-600">Đảm bảo Camera và Micro hoạt động tốt trước khi vào họp</p>
      </div>

      <Card 
        className="w-full max-w-[600px] border-gray-300 bg-white shadow-xl relative"
        bordered={true}
        bodyStyle={{ padding: 0 }}
      >
         <div className="h-[350px] w-full rounded-lg overflow-hidden relative bg-gray-100 flex items-center justify-center">
            {isCamMuted ? (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                    <FiVideoOff size={48} />
                    <span className="font-medium">Camera đang tắt</span>
                </div>
            ) : (
                <VideoPreview />
            )}
            
            <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-sm flex items-center gap-2 backdrop-blur-sm shadow-sm transition-all duration-200 ${
                isMicMuted ? "bg-red-500 text-white" : "bg-black/50 text-white"
            }`}>
                {isMicMuted ? <FiMicOff /> : <FiMic className="text-green-400" />}
                <span>{isMicMuted ? "Mic Tắt" : "Mic Bật"}</span>
            </div>
         </div>
      </Card>

      <div className="flex flex-col md:flex-row gap-6 items-center mt-2">
        <div className="flex gap-3 items-center">
            <Tooltip title={isMicMuted ? "Bật Micro" : "Tắt Micro"}>
                <Button 
                    shape="circle" 
                    size="large"
                    danger={isMicMuted}
                    type={isMicMuted ? "primary" : "default"}
                    icon={isMicMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
                    onClick={() => microphone.toggle()}
                    className="flex items-center justify-center w-12 h-12"
                />
            </Tooltip>
            
            <Tooltip title={isCamMuted ? "Bật Camera" : "Tắt Camera"}>
                <Button 
                    shape="circle" 
                    size="large"
                    danger={isCamMuted}
                    type={isCamMuted ? "primary" : "default"}
                    icon={isCamMuted ? <FiVideoOff size={20} /> : <FiVideo size={20} />}
                    onClick={() => camera.toggle()}
                    className="flex items-center justify-center w-12 h-12"
                />
            </Tooltip>

            <div className="h-12 flex items-center">
                 <DeviceSettings />
            </div>
        </div>

        <Button 
            type="primary" 
            size="large"
            icon={<FiCheckCircle />}
            className="bg-green-600 hover:bg-green-700 border-none h-12 px-8 text-lg font-semibold shadow-lg shadow-green-900/20"
            onClick={() => { 
                call.join(); 
                setIsSetupComplete(true); 
            }}
        >
            Vào phòng họp
        </Button>
      </div>
    </div>
  );
};

export default MeetingSetup;