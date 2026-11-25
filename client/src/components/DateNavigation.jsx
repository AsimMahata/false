import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export function DateNavigation({ selectedDate, setSelectedDate }) {
  const formatDateForInput = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDateForInput(new Date());

  const handlePrevDay = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setDate(dateObj.getDate() - 1);
    setSelectedDate(formatDateForInput(dateObj));
  };

  const handleNextDay = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setDate(dateObj.getDate() + 1);
    setSelectedDate(formatDateForInput(dateObj));
  };

  const handleToday = () => {
    setSelectedDate(todayStr);
  };

  const formatFriendlyDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isToday = selectedDate === todayStr;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Prominent Date Display */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                {formatFriendlyDate(selectedDate)}
              </h2>
              {isToday && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-900 dark:bg-emerald-500 text-white dark:text-gray-950">
                  Today
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{selectedDate}</p>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Today
            </button>
          )}

          <button
            onClick={handleNextDay}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Native Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-hidden focus:ring-2 focus:ring-gray-900 dark:focus:ring-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
