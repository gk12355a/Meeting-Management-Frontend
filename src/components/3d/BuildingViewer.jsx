
// src/components/3d/BuildingViewer.jsx
import React, { useState, useMemo, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
    OrbitControls,
    Html,
    ContactShadows
} from "@react-three/drei";
import { parseRoomsToBuildings } from "../../utils/buildingParser";
import { Modal, Button, Empty, Tag } from "antd";
import { FiBox, FiCheckCircle, FiXCircle, FiUsers, FiLayers } from "react-icons/fi";
import * as THREE from "three";

// --- KHỐI ĐẠI DIỆN 1 TẦNG ---
const FloorBlock = ({ position, floorNumber, rooms, isHovered, isSelected, onSelect, onHover }) => {
    const hasAvailable = rooms.some((r) => r.status === "AVAILABLE");

    // Màu sắc logic
    let baseColor = "#94a3b8"; // Mặc định xám (Slate-400)
    if (hasAvailable) baseColor = "#10b981"; // Emerald-500
    if (isSelected) baseColor = "#3b82f6"; // Blue-500
    if (isHovered && !isSelected) baseColor = "#6ee7b7"; // Emerald-300

    return (
        <group position={position}>
            <mesh
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    onHover(true);
                    document.body.style.cursor = "pointer";
                }}
                onPointerOut={(e) => {
                    onHover(false);
                    document.body.style.cursor = "auto";
                }}
            >
                <boxGeometry args={[3, 0.6, 3]} />
                <meshStandardMaterial
                    color={baseColor}
                    transparent
                    opacity={0.95}
                    roughness={0.3}
                />
            </mesh>
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(3, 0.6, 3)]} />
                <lineBasicMaterial color="#ffffff" linewidth={1} transparent opacity={0.3} />
            </lineSegments>

            {/* Label số tầng (Dùng HTML thay vì 3D Text để tránh lỗi font) */}
            <Html position={[0, 0, 1.6]} transform occlude center distanceFactor={8} style={{ pointerEvents: 'none' }}>
                <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-white shadow-sm whitespace-nowrap select-none
                    ${hasAvailable ? 'bg-emerald-600' : 'bg-slate-600'}
                `}>
                    Tầng {floorNumber}
                </div>
            </Html>
        </group>
    );
};

// --- CẢ TÒA NHÀ ---
const Building = ({ data, position, onFloorSelect, selectedFloorKey }) => {
    const [hoveredFloor, setHoveredFloor] = useState(null);

    const floors = useMemo(() => {
        const f = [];
        for (let i = 1; i <= data.maxFloor; i++) {
            f.push({ floorNumber: i, rooms: data.floors[i] || [] });
        }
        return f;
    }, [data]);

    return (
        <group position={position}>
            {/* Tên Tòa Nhà */}
            <Html position={[0, data.maxFloor * 0.8 + 1, 0]} center distanceFactor={12}>
                <div className="bg-white/90 dark:bg-slate-800/90 dark:text-white px-3 py-1 rounded-full text-xs font-bold shadow-md border border-slate-200 dark:border-slate-700 whitespace-nowrap backdrop-blur-sm">
                    {data.name}
                </div>
            </Html>

            {/* Render từng tầng */}
            {floors.map((floor, index) => {
                const uniqueKey = `${data.name}-${floor.floorNumber}`;
                return (
                    <FloorBlock
                        key={uniqueKey}
                        position={[0, index * 0.8, 0]}
                        floorNumber={floor.floorNumber}
                        rooms={floor.rooms}
                        isHovered={hoveredFloor === uniqueKey}
                        isSelected={selectedFloorKey === uniqueKey}
                        onHover={(state) => setHoveredFloor(state ? uniqueKey : null)}
                        onSelect={() => onFloorSelect(data.name, floor.floorNumber, floor.rooms)}
                    />
                );
            })}

            {/* Đế tòa nhà */}
            <mesh position={[0, -0.5, 0]} receiveShadow>
                <boxGeometry args={[3.4, 0.2, 3.4]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
        </group>
    );
};

// --- COMPONENT CHÍNH ---
const BuildingViewer = ({ open, onClose, rooms, onRoomClick }) => {
    const buildingsData = useMemo(() => {
        try {
            return parseRoomsToBuildings(rooms || []);
        } catch (error) {
            console.error("Error parsing rooms:", error);
            return [];
        }
    }, [rooms]);

    const [selectedFloorInfo, setSelectedFloorInfo] = useState(null);
    const [isCanvasReady, setIsCanvasReady] = useState(false);

    useEffect(() => {
        if (!open) {
            setSelectedFloorInfo(null);
            setIsCanvasReady(false);
        } else {
            // Delay rendering Canvas to ensure Modal animation is done and dimensions are stable
            // This fixes the "shrinking" bug
            const timer = setTimeout(() => setIsCanvasReady(true), 300);
            return () => clearTimeout(timer);
        }
    }, [open]);

    const handleFloorSelect = (buildingName, floorNumber, rooms) => {
        setSelectedFloorInfo({ buildingName, floorNumber, rooms });
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={1000}
            centered
            destroyOnClose={true}
            zIndex={2000}
            className="building-3d-modal transition-all"
            styles={{ body: { padding: 0, height: "70vh", overflow: "hidden" } }}
            title={<span className="flex items-center gap-2"><FiBox /> Bản đồ 3D</span>}
        >
            <div className="flex h-full flex-col md:flex-row bg-slate-100 dark:bg-slate-950">
                {/* --- KHUNG NHÌN 3D --- */}
                <div className="flex-1 w-full relative h-[50vh] md:h-full overflow-hidden">
                    {/* Only render Canvas when "Ready" to avoid 0x0 size initialization during modal animation */}
                    {isCanvasReady ? (
                        <div className="absolute inset-0 w-full h-full animate-fade-in">
                            <Canvas
                                className="w-full h-full block"
                                frameloop="always"
                                camera={{ position: [15, 15, 15], fov: 45 }}
                                dpr={[1, 2]}
                                onCreated={({ gl }) => {
                                    gl.setPixelRatio(window.devicePixelRatio);
                                }}
                            >
                                <color attach="background" args={['#1e293b']} />

                                <ambientLight intensity={0.8} />
                                <directionalLight position={[10, 20, 10]} intensity={1.2} />
                                <directionalLight position={[-10, 5, -10]} intensity={0.5} />

                                <gridHelper args={[60, 60, 0x475569, 0x334155]} position={[0, -2.6, 0]} />

                                {/* Controls: Cho phép Xoay, Zoom, và Di chuyển (Pan) */}
                                <OrbitControls
                                    makeDefault
                                    minPolarAngle={0}
                                    maxPolarAngle={Math.PI / 2.1}
                                    enablePan={true}
                                    panSpeed={1}
                                    screenSpacePanning={true} // Di chuyển song song với mặt đất
                                    mouseButtons={{
                                        LEFT: THREE.MOUSE.ROTATE,
                                        MIDDLE: THREE.MOUSE.DOLLY,
                                        RIGHT: THREE.MOUSE.PAN
                                    }}
                                />

                                <Suspense fallback={null}>
                                    <group position={[0, -2, 0]}>
                                        {buildingsData.length === 0 && (
                                            <group>
                                                <mesh position={[0, 2, 0]}>
                                                    <boxGeometry args={[2, 2, 2]} />
                                                    <meshStandardMaterial color="#f472b6" wireframe />
                                                </mesh>
                                                <Html center>
                                                    <div className="bg-slate-800 text-white p-3 rounded shadow text-center">
                                                        <p className="font-bold text-red-400">Không có dữ liệu tòa nhà</p>
                                                        <p className="text-xs text-slate-400 mt-1">Vui lòng cập nhật "Tòa nhà" & "Tầng" cho phòng họp</p>
                                                    </div>
                                                </Html>
                                            </group>
                                        )}

                                        <group position={[-(buildingsData.length - 1) * 3, 0, 0]}>
                                            {buildingsData.map((building, idx) => (
                                                <Building
                                                    key={building.name}
                                                    data={building}
                                                    position={[idx * 6, 0, 0]}
                                                    onFloorSelect={handleFloorSelect}
                                                    selectedFloorKey={selectedFloorInfo ? `${selectedFloorInfo.buildingName}-${selectedFloorInfo.floorNumber}` : null}
                                                />
                                            ))}
                                        </group>
                                    </group>
                                </Suspense>
                            </Canvas>
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                            <span className="text-slate-400 text-sm animate-pulse">Đang tải mô hình...</span>
                        </div>
                    )}

                    {/* Overlay Info */}
                    <div className="absolute top-4 left-4 pointer-events-none space-y-2 z-10 w-fit">
                        <div className="bg-slate-900/80 backdrop-blur text-white p-3 rounded-lg shadow-lg text-xs border border-slate-700">
                            <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Phòng trống</div>
                            <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 bg-slate-400 rounded-sm"></span> Đã kín / Bảo trì</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Đang chọn</div>
                        </div>
                        {buildingsData.length > 0 && (
                            <div className="bg-slate-900/50 backdrop-blur text-slate-300 px-2 py-1 rounded text-[10px] inline-block border border-slate-800">
                                {buildingsData.length} Tòa nhà • {rooms?.length || 0} Phòng
                            </div>
                        )}
                        <div className="mt-2 text-slate-300 bg-black/60 p-2 rounded text-[11px] border border-slate-600 backdrop-blur-sm">
                            <div className="flex items-center gap-1">🖱️ <b>Chuột Trái:</b> Xoay </div>
                            <div className="flex items-center gap-1">🖱️ <b>Chuột Phải:</b> Di chuyển (Pan)</div>
                            <div className="flex items-center gap-1">🖱️ <b>Con lăn:</b> Zoom</div>
                        </div>
                    </div>
                </div>

                {/* --- SIDEBAR CHI TIẾT --- */}
                <div className={`w-full md:w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-[40vh] md:h-full transition-all duration-300 ${!selectedFloorInfo ? 'hidden md:flex' : ''}`}>
                    {!selectedFloorInfo ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                            <FiBox size={40} className="mb-3 opacity-20" />
                            <p className="text-sm">Chọn một tầng trên mô hình để xem chi tiết</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{selectedFloorInfo.buildingName}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Tag color="cyan">Tầng {selectedFloorInfo.floorNumber}</Tag>
                                        <span className="text-xs text-slate-500">{selectedFloorInfo.rooms.length} phòng</span>
                                    </div>
                                </div>
                                <Button type="text" size="small" onClick={() => setSelectedFloorInfo(null)} className="md:hidden">Đóng</Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {selectedFloorInfo.rooms.length === 0 ? (
                                    <Empty description={<span className="text-slate-500">Tầng này trống</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                ) : (
                                    selectedFloorInfo.rooms.map(room => (
                                        <div
                                            key={room.id}
                                            className={`border rounded-xl p-3 transition-all ${room.status === 'AVAILABLE'
                                                ? 'hover:shadow-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 group'
                                                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-60 cursor-not-allowed'
                                                }`}
                                            onClick={() => {
                                                if (room.status === 'AVAILABLE') {
                                                    onRoomClick && onRoomClick(room);
                                                    onClose();
                                                }
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-slate-800 dark:text-slate-200">{room.name}</h4>
                                                {room.status === 'AVAILABLE'
                                                    ? <FiCheckCircle className="text-emerald-500" />
                                                    : <FiXCircle className="text-slate-400" />
                                                }
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1.5"><FiUsers size={12} /> {room.capacity} chỗ</span>
                                                <span className={room.status === 'AVAILABLE' ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                                                    {room.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Không khả dụng'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default BuildingViewer;
