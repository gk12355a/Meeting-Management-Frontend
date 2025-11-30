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

import enCommon from './locales/en/common.json';
import enAdmin from './locales/en/admin.json';
import enDashboard from './locales/en/dashboard.json';
import enUsers from './locales/en/users.json';
import enRooms from './locales/en/rooms.json';
import enDevices from './locales/en/devices.json';
import enReports from './locales/en/reports.json';

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
      },
      en: {
        common: enCommon,
        admin: enAdmin,
        dashboard: enDashboard,
        users: enUsers,
        rooms: enRooms,
        devices: enDevices,
        reports: enReports,
      },
    },
    lng: savedLanguage,
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false,
    },
    // Tách namespace
    ns: ['common', 'admin', 'dashboard', 'users', 'rooms', 'devices', 'reports'],
    defaultNS: 'common',
  });

export default i18n;