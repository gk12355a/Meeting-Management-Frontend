// src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import viCommon from './locales/vi/common.json';
import viAdmin from './locales/vi/admin.json';
import viDashboard from './locales/vi/dashboard.json';
import viUsers from './locales/vi/users.json';
import viRooms from './locales/vi/rooms.json';
import viDevices from './locales/vi/devices.json';
import viReports from './locales/vi/reports.json';
import viAuth from './locales/vi/auth.json';      
import viMeeting from './locales/vi/meeting.json';
import viUserDashboard from './locales/vi/userDashboard.json';
import userSidebar_vi from "./locales/vi/userSidebar.json";
import meetingDetail_vi from "./locales/vi/meetingDetail.json";
import userRooms_vi from "./locales/vi/userRooms.json";
import userDevices_vi from "./locales/vi/userDevices.json";
import userHistory_vi from "./locales/vi/userHistory.json";
import quickBook_vi from "./locales/vi/quickBook.json";

import enCommon from './locales/en/common.json';
import enAdmin from './locales/en/admin.json';
import enDashboard from './locales/en/dashboard.json';
import enUsers from './locales/en/users.json';
import enRooms from './locales/en/rooms.json';
import enDevices from './locales/en/devices.json';
import enReports from './locales/en/reports.json';
import enAuth from './locales/en/auth.json';         
import enMeeting from './locales/en/meeting.json';
import enUserDashboard from './locales/en/userDashboard.json';
import userSidebar_en from "./locales/en/userSidebar.json";
import meetingDetail_en from "./locales/en/meetingDetail.json";
import userRooms_en from "./locales/en/userRooms.json";
import userDevices_en from "./locales/en/userDevices.json";
import userHistory_en from "./locales/en/userHistory.json";
import quickBook_en from "./locales/en/quickBook.json";

// Lấy ngôn ngữ đã lưu hoặc mặc định là 'vi' (tiếng việt)
const savedLanguage = localStorage.getItem('language') || 'vi';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: {
        common: viCommon,
        admin: viAdmin,
        dashboard: viDashboard,
        users: viUsers,
        rooms: viRooms,
        devices: viDevices,
        reports: viReports,
        auth: viAuth,            
        meeting: viMeeting,   
        userDashboard: viUserDashboard,
        userSidebar: userSidebar_vi,
        meetingDetail: meetingDetail_vi,
        userRooms: userRooms_vi,
        userDevices: userDevices_vi,
        userHistory: userHistory_vi,
        quickBook: quickBook_vi
      },
      en: {
        common: enCommon,
        admin: enAdmin,
        dashboard: enDashboard,
        users: enUsers,
        rooms: enRooms,
        devices: enDevices,
        reports: enReports,
        auth: enAuth,           
        meeting: enMeeting,
        userDashboard: enUserDashboard,
        userSidebar: userSidebar_en,
        meetingDetail: meetingDetail_en,
        userRooms: userRooms_en,
        userDevices: userDevices_en,
        userHistory: userHistory_en,
        quickBook: quickBook_en
      },
    },
    lng: savedLanguage,
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false,
    },
    // Tách namespace
    ns: [
      'common',
      'admin',
      'dashboard',
      'users',
      'rooms',
      'devices',
      'reports',
      'auth',     
      'meeting' ,
      'userDashboard',
      'userSidebar',
      'meetingDetail',
      'userRooms',
      'userDevices',
      'userHistory',
      'quickBook'
    ],
    defaultNS: 'common',
  });

export default i18n;