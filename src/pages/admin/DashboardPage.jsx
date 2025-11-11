import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function DashboardPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theo dõi dark mode khi toggle theme
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const meetingsPerDay = [
    { name: "T2", count: 4 },
    { name: "T3", count: 2 },
    { name: "T4", count: 6 },
    { name: "T5", count: 3 },
    { name: "T6", count: 4 },
    { name: "T7", count: 3 },
    { name: "CN", count: 2 },
  ];

  const weeklyMeetings = [
    { week: "1", count: 5 },
    { week: "2", count: 10 },
    { week: "3", count: 7 },
    { week: "4", count: 9 },
    { week: "5", count: 6 },
  ];

  const participantsDistribution = [
    { name: "Phòng A", value: 35 },
    { name: "Phòng B", value: 25 },
    { name: "Phòng C", value: 20 },
    { name: "Phòng D", value: 20 },
  ];

  const COLORS = ["#60A5FA", "#A78BFA", "#F472B6", "#34D399"];

  const upcomingMeetings = [
    {
      id: 1,
      title: "Họp kế hoạch thán",
      time: "14:00 - 15:30",
      room: "Phòng họp 1",
      organizer: "Phuong Anh",
    },
    {
      id: 2,
      title: "Review Sprint 2",
      time: "16:00 - 17:00",
      room: "Phòng họp 3",
      organizer: "Duong",
    },
  ];

  const topEmployees = [
    { name: "Phuong Anh", count: 8 },
    { name: "Chu", count: 6 },
    { name: "Duong", count: 5 },
  ];

  return (
    <div className="p-6 space-y-6 transition-colors duration-300">
      {/* Header Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Hôm nay", value: "4 cuộc họp" },
          { label: "Tuần này", value: "12 cuộc họp" },
          { label: "Người tham gia", value: "18 người" },
          { label: "Thời gian họp", value: "18h trong ngày" },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 
                       rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
            <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mt-1">
              {card.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            📊 Cuộc họp theo ngày
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={meetingsPerDay}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDarkMode ? "#334155" : "#e5e7eb"}
              />
              <XAxis
                dataKey="name"
                stroke={isDarkMode ? "#cbd5e1" : "#475569"}
              />
              <YAxis stroke={isDarkMode ? "#cbd5e1" : "#475569"} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                  color: isDarkMode ? "#f8fafc" : "#1e293b",
                  borderRadius: "8px",
                  border: "none",
                }}
              />
              <Bar
                dataKey="count"
                fill={isDarkMode ? "#818cf8" : "#60A5FA"}
                radius={[8, 8, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            🎯 Phân bố người tham gia
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={participantsDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                dataKey="value"
              >
                {participantsDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                  color: isDarkMode ? "#f8fafc" : "#1e293b",
                  border: "none",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Meetings */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
          📈 Số cuộc họp theo tuần
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyMeetings}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={isDarkMode ? "#334155" : "#e5e7eb"}
            />
            <XAxis dataKey="week" stroke={isDarkMode ? "#cbd5e1" : "#475569"} />
            <YAxis stroke={isDarkMode ? "#cbd5e1" : "#475569"} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                color: isDarkMode ? "#f8fafc" : "#1e293b",
                border: "none",
                borderRadius: "8px",
              }}
            />
            <Bar
              dataKey="count"
              fill={isDarkMode ? "#f472b6" : "#F9A8D4"}
              radius={[6, 6, 0, 0]}
              barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Upcoming + Top Employees */}
      <div className="grid grid-cols-2 gap-6">
        {/* Upcoming Meetings */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            📅 Cuộc họp sắp diễn ra
          </h3>
          <ul className="space-y-3">
            {upcomingMeetings.map((m) => (
              <li
                key={m.id}
                className="border border-gray-100 dark:border-slate-700 rounded-xl p-3 
                           hover:bg-gray-50 dark:hover:bg-slate-700 transition flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">
                    {m.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {m.time} • {m.room}
                  </p>
                </div>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                  {m.organizer}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Employees */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            🏆 Nhân viên họp nhiều nhất
          </h3>
          <ul className="space-y-3">
            {topEmployees.map((u, index) => (
              <li
                key={index}
                className="flex justify-between items-center border border-gray-100 dark:border-slate-700 
                           rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 w-6 h-6 bg-blue-50 dark:bg-slate-700 flex items-center justify-center rounded-full">
                    {index + 1}
                  </span>
                  <p className="font-medium text-gray-800 dark:text-gray-100">
                    {u.name}
                  </p>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {u.count} cuộc họp
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
