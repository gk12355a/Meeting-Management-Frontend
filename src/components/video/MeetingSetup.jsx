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
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 p-6 transition-colors duration-300">
      <div className="text-center mb-8 animate-fade-in-up">
        {/* <h1 className="text-3xl font-bold mb-2 text-blue-600">Kiểm tra thiết bị</h1> */}
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
          Kiểm tra thiết bị
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Đảm bảo Camera và Micro hoạt động tốt trước khi vào họp</p>
      </div>

      <Card
        className="w-full max-w-[700px] border-none shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-emerald-900/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl overflow-hidden"
        bordered={false}
        bodyStyle={{ padding: 0 }}
      >
        <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center overflow-hidden group">
          {isCamMuted ? (
            <div className="flex flex-col items-center gap-4 text-slate-500 animate-pulse">
              <div className="p-4 rounded-full bg-slate-800">
                <FiVideoOff size={40} />
              </div>
              <span className="font-medium text-lg">Camera đang tắt</span>
            </div>
          ) : (
            <VideoPreview className="w-full h-full object-cover" />
          )}

          {/* Status Indicators overlay */}
          <div className="absolute bottom-6 left-6 flex gap-3">
            <div className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 backdrop-blur-md shadow-lg transition-all duration-300 ${isMicMuted
                ? "bg-red-500/90 text-white border border-red-400/50"
                : "bg-emerald-500/90 text-white border border-emerald-400/50"
              }`}>
              {isMicMuted ? <FiMicOff size={14} /> : <FiMic size={14} />}
              <span>{isMicMuted ? "Mic Tắt" : "Mic Bật"}</span>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 dark:bg-slate-900">

          <div className="flex items-center gap-4">
            <Tooltip title={isMicMuted ? "Bật Micro" : "Tắt Micro"}>
              <Button
                shape="circle"
                size="large"
                danger={isMicMuted}
                // type={isMicMuted ? "primary" : "default"}
                className={`flex items-center justify-center w-14 h-14 border-0 shadow-lg transition-all transform hover:scale-105 ${isMicMuted
                    ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300"
                  }`}
                icon={isMicMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
                onClick={() => microphone.toggle()}
              />
            </Tooltip>

            <Tooltip title={isCamMuted ? "Bật Camera" : "Tắt Camera"}>
              <Button
                shape="circle"
                size="large"
                danger={isCamMuted}
                className={`flex items-center justify-center w-14 h-14 border-0 shadow-lg transition-all transform hover:scale-105 ${isCamMuted
                    ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300"
                  }`}
                icon={isCamMuted ? <FiVideoOff size={24} /> : <FiVideo size={24} />}
                onClick={() => camera.toggle()}
              />
            </Tooltip>

            <div className="h-10 w-[1px] bg-gray-200 dark:bg-slate-700 mx-2"></div>

            <div className="device-settings-wrapper">
              <DeviceSettings />
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<FiCheckCircle size={20} />}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-none h-14 px-8 text-lg font-bold rounded-2xl shadow-lg shadow-emerald-500/30 w-full md:w-auto transform hover:-translate-y-0.5 transition-all duration-300"
            onClick={() => {
              call.join();
              setIsSetupComplete(true);
            }}
          >
            Vào phòng họp
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MeetingSetup;