/**
 * Xuất dữ liệu ra file CSV (Excel mở được)
 * @param {Array<string>} headers - Mảng tiêu đề cột ["ID", "Tên", "Tuổi"]
 * @param {Array<Array<string>>} rows - Mảng dữ liệu tương ứng
 * @param {string} fileName - Tên file (không cần .csv)
 */
export const exportToCSV = (headers, rows, fileName) => {
    // 1. Gộp headers và rows
    const allData = [headers, ...rows];

    // 2. Chuyển đổi mảng thành chuỗi CSV chuẩn
    const csvContent = allData.map(row => {
        return row.map(cell => {
            // Escape double quotes by doubling them
            let str = String(cell || '').replace(/"/g, '""');
            // Wrap in quotes if contains comma, newline or quote
            if (str.search(/("|,|\n)/g) >= 0) {
                str = `"${str}"`;
            }
            return str;
        }).join(",");
    }).join("\n");

    // 3. Tạo Blob với BOM (\uFEFF) để Excel nhận diện UTF-8 (Tiếng Việt)
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });

    // 4. Tạo link tải xuống
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
