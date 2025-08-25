"use client";

import { useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CalendarProps {
  initialFocus?: boolean;
  mode?: "range" | "single";
  defaultMonth?: Date;
  selected?: { from: Date | undefined; to?: Date | undefined };
  onSelect?: (newDate: { from: Date | undefined; to?: Date | undefined }) => void;
  numberOfMonths?: number;
}

const CalendarCustom: React.FC<CalendarProps> = ({
  initialFocus = false,
  mode = "range",
  defaultMonth = new Date(),
  selected,
  onSelect,
  numberOfMonths = 2,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(defaultMonth);
  const [selectedRange, setSelectedRange] = useState<{ from: Date | undefined; to?: Date | undefined }>(
    selected || { from: undefined, to: undefined }
  );

  const handleDateClick = (day: Date) => {
    if (mode === "range") {
      if (!selectedRange.from || (selectedRange.from && selectedRange.to)) {
        // Start a new selection
        const newRange = { from: day, to: undefined };
        setSelectedRange(newRange);
        onSelect?.(newRange);
      } else if (selectedRange.from && !selectedRange.to) {
        if (day < selectedRange.from) {
          // Swap if the selected end date is earlier than the start date
          const newRange = { from: day, to: selectedRange.from };
          setSelectedRange(newRange);
          onSelect?.(newRange);
        } else {
          // Normal case
          const newRange = { from: selectedRange.from, to: day };
          setSelectedRange(newRange);
          onSelect?.(newRange);
        }
      }
    } else {
      const newRange = { from: day, to: undefined };
      setSelectedRange(newRange);
      onSelect?.(newRange);
    }
  };

  const renderMonth = (date: Date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="w-full p-4 border rounded-lg shadow-sm">
        {/* Month Header */}
        <h2 className="text-lg font-semibold text-center mb-2">{format(date, "MMMM yyyy")}</h2>

        {/* Days of the Week */}
        <div className="grid grid-cols-7 text-center font-medium text-gray-600">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Days of the Month */}
        <div className="grid grid-cols-7 gap-1 mt-2">
          {days.map((day) => {
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedRange.from && isSameDay(day, selectedRange.from);
            const isRangeEnd = selectedRange.to && isSameDay(day, selectedRange.to);
            const isInRange =
              selectedRange.from && selectedRange.to && isWithinInterval(day, { start: selectedRange.from, end: selectedRange.to });

            return (
              <button
                key={day.toString()}
                onClick={() => handleDateClick(day)}
                className={cn(
                  "p-2 rounded-md text-sm transition-colors",
                  isToday && "border border-blue-500",
                  isSelected && "bg-green-500 text-white",
                  isRangeEnd && "bg-green-500 text-white",
                  isInRange && "bg-green-200 text-black",
                  !isSameMonth(day, monthStart) ? "text-gray-400" : "hover:bg-gray-200"
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      {/* Month Navigation */}
      <div className="flex space-x-4">
        <Button variant="outline" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>←</Button>
        <h2 className="text-xl font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button variant="outline" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>→</Button>
      </div>

      {/* Multi-Month Calendar Display */}
      <div className="grid grid-cols-2 gap-4">
        {[...Array(numberOfMonths)].map((_, i) => renderMonth(addMonths(currentMonth, i)))}
      </div>

      {/* Selected Date Range */}
      <div className="text-center text-sm text-gray-600">
        {selectedRange.from && selectedRange.to
          ? `Selected: ${format(selectedRange.from, "PPP")} - ${format(selectedRange.to, "PPP")}`
          : mode === "range"
          ? "Select a date range"
          : "Select a date"}
      </div>
    </div>
  );
};

export default CalendarCustom;
