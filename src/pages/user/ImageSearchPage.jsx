import React, { useState, useEffect } from "react";
import { Upload, Image as ImageIcon, Search, LayoutGrid, List } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getAllRooms } from "../../services/roomService";
import { getDevices } from "../../services/deviceService";

export default function ImageSearchPage() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  const [roomsDict, setRoomsDict] = useState({});
  const [devicesDict, setDevicesDict] = useState({});

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [roomsRes, devicesRes] = await Promise.all([
          getAllRooms(),
          getDevices()
        ]);

        const rDict = {};
        if (roomsRes.data) {
          roomsRes.data.forEach(r => rDict[r.id] = r.name);
        }
        setRoomsDict(rDict);

        const dDict = {};
        if (devicesRes.data) {
          devicesRes.data.forEach(d => dDict[d.id] = d.name);
        }
        setDevicesDict(dDict);

      } catch (error) {
        console.error("Error fetching metadata for search:", error);
      }
    };
    fetchMetadata();
  }, []);

  // Handle Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file) => {
    setSelectedFile(file);
    setSelectedImage(URL.createObjectURL(file));
    setResults([]); // Clear previous results
  };

  const handleSearch = async () => {
    if (!selectedFile) {
      toast.error("Vui lòng chọn hoặc kéo thả một ảnh.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("top_k", 6);

    try {
      // Gọi tới Python Microservice API
      const response = await axios.post("http://localhost:8005/api/search-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
        setResults(response.data.results);
      } else {
        toast.error("Không tìm thấy kết quả.");
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 500) {
        toast.error("Yêu cầu bị từ chối: Tệp tin bị hỏng cấu trúc hoặc không phải thiết kế hình ảnh chuẩn! Hệ thống AI đã ngăn chặn rủi ro.");
      } else {
        toast.error("Lỗi khi kết nối đến AI Backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 border-l-4 border-blue-600 pl-3">
          Tìm kiếm bằng Hình ảnh (Hình dáng Phòng họp / Thiết bị)
        </h1>
        <p className="text-gray-500">
          Hệ thống CBIR (Content-Based Image Retrieval). Tải lên hình ảnh một phòng họp hoặc máy chiếu để tìm các mẫu tương tự AI đề xuất.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Upload Section */}
        <div className="lg:col-span-1 space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
            onClick={() => document.getElementById("file-upload").click()}
          >
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {selectedImage ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-sm">
                <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-medium flex items-center gap-2">
                    <Upload className="w-5 h-5" /> Thay đổi ảnh
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500 space-y-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-700">Kéo thả ảnh vào đây</p>
                  <p className="text-sm">hoặc click để chọn tệp</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSearch}
            disabled={!selectedImage || loading}
            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${!selectedImage || loading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
              }`}
          >
            {loading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white rounded-full border-t-transparent" />
                Đang phân tích AI...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" /> Bắt đầu tìm kiếm
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              Kết quả AI gợi ý
              {results.length > 0 && (
                <span className="bg-blue-100 text-blue-700 py-0.5 px-2.5 rounded-full text-xs">
                  {results.length}
                </span>
              )}
            </h2>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md ${viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!loading && results.length === 0 && !selectedImage && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <ImageIcon className="w-16 h-16 opacity-30 mb-4" />
              <p>Tải ảnh lên để xem kết quả tương tự</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 gap-4" : "space-y-4"}>
              {results.map((result, idx) => {
                // Formatting metadata for display
                const similarity = Math.max(0, (1 - result.distance) * 100).toFixed(1);
                const metadata = result.metadata || {};
                const typeName = metadata.type === 'room' ? 'Phòng họp' : 'Thiết bị';

                const realName = metadata.type === 'room'
                  ? (roomsDict[metadata.db_id] || `(ID: ${metadata.db_id})`)
                  : (devicesDict[metadata.db_id] || `(ID: ${metadata.db_id})`);

                const nameInfo = `${typeName}: ${realName}`;
                const imageUrl = metadata.url;

                return (
                  <div
                    key={idx}
                    className={`bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer ${viewMode === "list" ? "flex flex-row items-center gap-4 p-3" : "flex flex-col"}`}
                    onClick={() => {
                      if (metadata.type === 'room') {
                        navigate("/user/rooms", { state: { openRoomId: metadata.db_id } });
                      } else {
                        navigate("/user/devices", { state: { openDeviceId: metadata.db_id } });
                      }
                    }}
                  >

                    <div className={`bg-gray-100 flex items-center justify-center overflow-hidden relative ${viewMode === "list" ? "w-32 h-24 rounded-lg flex-shrink-0" : "w-full aspect-video"}`}>
                      <img
                        src={imageUrl}
                        alt={nameInfo}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      {/* Fallback if image fails to load */}
                      <div className="hidden flex-col items-center justify-center text-gray-400 p-4 w-full h-full absolute inset-0 bg-gray-100">
                        <ImageIcon className="w-8 h-8 opacity-50 mb-2" />
                        <span className="text-xs text-center truncate w-full px-2" title={nameInfo}>
                          {nameInfo}
                        </span>
                      </div>

                      {/* Similarity Score Overlay */}
                      <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
                        {similarity}%
                      </div>
                    </div>

                    <div className={`p-4 flex flex-col justify-center ${viewMode === "list" ? "w-full" : ""}`}>
                      <h3 className="font-medium text-gray-900 truncate" title={nameInfo}>
                        {nameInfo}
                      </h3>
                      <p
                        className="text-sm text-blue-500 mt-1 cursor-pointer hover:underline"
                        title="Xem chi tiết trên hệ thống"
                        onClick={() => {
                          if (metadata.type === 'room') {
                            navigate("/user/rooms", { state: { openRoomId: metadata.db_id } });
                          } else {
                            navigate("/user/devices", { state: { openDeviceId: metadata.db_id } });
                          }
                        }}
                      >
                        Xem chi tiết hệ thống
                      </p>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
