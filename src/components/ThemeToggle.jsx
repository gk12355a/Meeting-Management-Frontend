// src/components/ThemeToggle.jsx
import { useEffect, useState, forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { FiSun, FiMoon } from "react-icons/fi";

const ThemeToggle = forwardRef((props, ref) => {
  const [darkMode, setDarkMode] = useState(
    typeof window !== "undefined" && localStorage.getItem("theme") === "dark"
  );
  const { t } = useTranslation('themeToggle');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <button
      ref={ref}
      onClick={() => setDarkMode(!darkMode)}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
    >
      {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
      {/* <span>{darkMode ? "Chế độ tối" : "Chế độ sáng"}</span> */}
      <span>{darkMode ? t('darkMode') : t('lightMode')}</span>
    </button>
  );
});

export default ThemeToggle;