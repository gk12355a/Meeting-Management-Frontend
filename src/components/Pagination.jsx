import React from "react";

export default function Pagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  maxPagesToShow = 7, // số trang hiển thị tối đa
}) {
  if (!totalItems || pageSize <= 0) return null;

  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages === 1) return null; // chỉ 1 trang thì không hiển thị

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const left = Math.max(currentPage - 2, 1);
      const right = Math.min(currentPage + 2, totalPages);

      if (left > 2) pages.push(1, "...");
      else pages.push(1);

      for (let i = left; i <= right; i++) {
        if (i !== 1 && i !== totalPages) pages.push(i);
      }

      if (right < totalPages - 1) pages.push("...");
      if (right !== totalPages) pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      {/* nút trước */}
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 disabled:opacity-50"
      >
        {"<"}
      </button>

      {/* số trang */}
      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={idx} className="px-3 py-1 text-gray-500 dark:text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={idx}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1 rounded-md ${
              p === currentPage
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            {p}
          </button>
        )
      )}

      {/* nút sau */}
      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 disabled:opacity-50"
      >
        {">"}
      </button>
    </div>
  );
}
