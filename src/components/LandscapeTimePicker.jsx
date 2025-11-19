// src/components/LandscapeTimePicker.jsx
import React from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticTimePicker } from "@mui/x-date-pickers/StaticTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

export default function LandscapeTimePicker({ value, onChange }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <StaticTimePicker
        value={value}
        onChange={onChange}
        displayStaticWrapperAs="mobile"
        orientation="landscape"
        ampm={false}
        minutesStep={5}
        sx={{
          "& .MuiPickersLayout-root": {
            backgroundColor: "#0f172a", // dark bg
            color: "white",
            borderRadius: "12px",
          },
          "& .MuiClockNumber-root": {
            color: "white",
          },
          "& .MuiClockPointer-root": {
            backgroundColor: "#4f46e5",
          },
          "& .MuiClockPointer-thumb": {
            backgroundColor: "#4f46e5",
          },
          "& .MuiButtonBase-root": {
            color: "#60a5fa",
          },
        }}
        // Chỉ cho phép chọn từ 08:00 đến 18:00
        shouldDisableTime={(timeValue, type) => {
          if (type === "hours") {
            return timeValue < 8 || timeValue > 18;
          }
          return false;
        }}
      />
    </LocalizationProvider>
  );
}
