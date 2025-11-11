import { useEffect, useState } from "react";
import {
  getVisitorReport,
  getRoomUsageReport,
  getCancelStats,
} from "../../services/reportService";

export default function ReportsPage() {
  const [visitors, setVisitors] = useState([]);
  const [usage, setUsage] = useState([]);
  const [cancel, setCancel] = useState([]);

  useEffect(() => {
    Promise.all([
      getVisitorReport(),
      getRoomUsageReport(),
      getCancelStats(),
    ]).then(([v, u, c]) => {
      setVisitors(v.data);
      setUsage(u.data);
      setCancel(c.data);
    });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">📈 Báo cáo & Thống kê</h1>

      <section className="mb-6">
        <h2 className="font-semibold">📅 Danh sách khách mời</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm">
          {JSON.stringify(visitors, null, 2)}
        </pre>
      </section>

      <section className="mb-6">
        <h2 className="font-semibold">🏢 Tần suất sử dụng phòng họp</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm">
          {JSON.stringify(usage, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="font-semibold">Thống kê hủy họp</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm">
          {JSON.stringify(cancel, null, 2)}
        </pre>
      </section>
    </div>
  );
}
