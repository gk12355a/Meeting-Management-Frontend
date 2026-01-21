import api from '../utils/api';

/**
 * Lấy Token Stream SDK từ Backend
 * Endpoint: GET /api/v1/video-call/token
 */
export const getVideoToken = async (meetingId) => {
  // [SECURE UPDATE] Gửi meetingId để Backend check quyền
  const response = await api.get('/video-call/token', {
    params: { meetingId } 
  });
  return response.data;
};