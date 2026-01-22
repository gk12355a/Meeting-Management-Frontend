/**
 * Hàm này chuyển đổi danh sách phòng phẳng (Flat List) thành cấu trúc cây theo Tòa nhà -> Tầng
 * Nó hỗ trợ cả 2 trường hợp:
 * 1. Backend đã tách cột (buildingName, floor)
 * 2. Backend chưa tách (Parse từ chuỗi location)
 */
export const parseRoomsToBuildings = (rooms) => {
    const buildings = {};
  
    rooms.forEach((room) => {
      let bName = "Tòa nhà Chính";
      let fNum = 1;
  
      // --- LOGIC PHÂN TÍCH ---
      
      // Ưu tiên 1: Lấy từ cột dữ liệu chuẩn (nếu Backend đã sửa)
      if (room.buildingName && room.floor) {
        bName = room.buildingName;
        fNum = room.floor;
      } 
      // Ưu tiên 2: Parse từ chuỗi location cũ (Fallback)
      else if (room.location) {
        const loc = room.location;
        
        // Regex tìm tên tòa (VD: "Tòa A", "Block B")
        const buildMatch = loc.match(/(?:Tòa|Block|Building)\s*(?:nhà)?\s*([A-Z0-9]+)/i);
        if (buildMatch) bName = `Tòa ${buildMatch[1].toUpperCase()}`;
  
        // Regex tìm số tầng (VD: "Tầng 5", "Lầu 3")
        const floorMatch = loc.match(/(?:Tầng|Lầu|Floor)\s*(\d+)/i);
        if (floorMatch) fNum = parseInt(floorMatch[1], 10);
      }
  
      // --- GOM NHÓM DỮ LIỆU ---
      if (!buildings[bName]) {
        buildings[bName] = {
          name: bName,
          floors: {},
          maxFloor: 0,
          roomCount: 0
        };
      }
  
      if (!buildings[bName].floors[fNum]) {
        buildings[bName].floors[fNum] = [];
      }
  
      buildings[bName].floors[fNum].push(room);
      buildings[bName].roomCount++;
  
      if (fNum > buildings[bName].maxFloor) {
        buildings[bName].maxFloor = fNum;
      }
    });
  
    // Chuyển object thành array và sắp xếp tên tòa nhà
    return Object.values(buildings).sort((a, b) => a.name.localeCompare(b.name));
  };
