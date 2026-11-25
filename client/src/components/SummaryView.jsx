import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { fetchStatementSummary } from '../api';

export function SummaryView({ onSelectDate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calendar month/year navigation state
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await fetchStatementSummary();
      setData(summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  // Helper date formatting
  const pad = (n) => String(n).padStart(2, '0');

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  // Compute stats for This Year, This Month, This Week, Today from daily data
  const computeTimeframeStats = () => {
    if (!data || !data.daily) {
      return {
        today: { total: 0, trueCount: 0, falseCount: 0, truePct: 0, falsePct: 0 },
        thisWeek: { total: 0, trueCount: 0, falseCount: 0, truePct: 0, falsePct: 0 },
        thisMonth: { total: 0, trueCount: 0, falseCount: 0, truePct: 0, falsePct: 0 },
        thisYear: { total: 0, trueCount: 0, falseCount: 0, truePct: 0, falsePct: 0 },
      };
    }

    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const thisMonthStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
    const thisYearStr = `${today.getFullYear()}`;

    // Get date range for current week (Monday through Sunday)
    const currentDayOfWeek = today.getDay(); // 0 is Sunday
    const distanceToMonday = (currentDayOfWeek + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);

    const weekDates = new Set();
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.add(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    }

    const todayStats = data.daily[todayStr] || { total: 0, trueCount: 0, falseCount: 0, truePct: 0, falsePct: 0 };

    let weekTotal = 0, weekTrue = 0, weekFalse = 0;
    let monthTotal = 0, monthTrue = 0, monthFalse = 0;
    let yearTotal = 0, yearTrue = 0, yearFalse = 0;

    for (const [dateStr, d] of Object.entries(data.daily)) {
      if (weekDates.has(dateStr)) {
        weekTotal += d.total;
        weekTrue += d.trueCount;
        weekFalse += d.falseCount;
      }
      if (dateStr.startsWith(thisMonthStr)) {
        monthTotal += d.total;
        monthTrue += d.trueCount;
        monthFalse += d.falseCount;
      }
      if (dateStr.startsWith(thisYearStr)) {
        yearTotal += d.total;
        yearTrue += d.trueCount;
        yearFalse += d.falseCount;
      }
    }

    const calcPcts = (t, f, tot) => {
      if (tot === 0) return { truePct: 0, falsePct: 0 };
      const truePct = Math.round((t / tot) * 100);
      return { truePct, falsePct: 100 - truePct };
    };

    return {
      today: { ...todayStats, ...calcPcts(todayStats.trueCount, todayStats.falseCount, todayStats.total) },
      thisWeek: { total: weekTotal, trueCount: weekTrue, falseCount: weekFalse, ...calcPcts(weekTrue, weekFalse, weekTotal) },
      thisMonth: { total: monthTotal, trueCount: monthTrue, falseCount: monthFalse, ...calcPcts(monthTrue, monthFalse, monthTotal) },
      thisYear: { total: yearTotal, trueCount: yearTrue, falseCount: yearFalse, ...calcPcts(yearTrue, yearFalse, yearTotal) },
    };
  };

  const timeframeStats = computeTimeframeStats();

  // Calendar generation for viewYear & viewMonth
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday = 0
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const calendarDays = [];
  // Empty slots before first day
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  // Month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const renderRatioBar = (truePct, falsePct) => (
    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
      {truePct > 0 && (
        <div style={{ width: `${truePct}%` }} className="bg-emerald-500 h-full" title={`True: ${truePct}%`} />
      )}
      {falsePct > 0 && (
        <div style={{ width: `${falsePct}%` }} className="bg-rose-500 h-full" title={`False: ${falsePct}%`} />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-emerald-600 text-white flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Summary & Analytics</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Calendar ratios, time-wise aggregates (day, week, month, year, all-time).
            </p>
          </div>
        </div>

        <button
          onClick={loadSummary}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-400">
          Failed to load summary: {error}
        </div>
      )}

      {/* KPI Cards: All-Time, Year, Month, Week, Today */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* All-Time */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              All Time
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {data?.allTime?.total ?? 0}
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="text-emerald-700 dark:text-emerald-400">{data?.allTime?.trueCount ?? 0} True</span>
              <span className="text-rose-700 dark:text-rose-400">{data?.allTime?.falseCount ?? 0} False</span>
            </div>
            {renderRatioBar(data?.allTime?.truePct ?? 0, data?.allTime?.falsePct ?? 0)}
            <div className="text-[10px] text-gray-400 text-right">
              {data?.allTime?.truePct ?? 0}% True
            </div>
          </div>
        </div>

        {/* This Year */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              This Year
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {timeframeStats.thisYear.total}
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="text-emerald-700 dark:text-emerald-400">{timeframeStats.thisYear.trueCount} T</span>
              <span className="text-rose-700 dark:text-rose-400">{timeframeStats.thisYear.falseCount} F</span>
            </div>
            {renderRatioBar(timeframeStats.thisYear.truePct, timeframeStats.thisYear.falsePct)}
            <div className="text-[10px] text-gray-400 text-right">
              {timeframeStats.thisYear.truePct}% True
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              This Month
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {timeframeStats.thisMonth.total}
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="text-emerald-700 dark:text-emerald-400">{timeframeStats.thisMonth.trueCount} T</span>
              <span className="text-rose-700 dark:text-rose-400">{timeframeStats.thisMonth.falseCount} F</span>
            </div>
            {renderRatioBar(timeframeStats.thisMonth.truePct, timeframeStats.thisMonth.falsePct)}
            <div className="text-[10px] text-gray-400 text-right">
              {timeframeStats.thisMonth.truePct}% True
            </div>
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              This Week
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {timeframeStats.thisWeek.total}
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="text-emerald-700 dark:text-emerald-400">{timeframeStats.thisWeek.trueCount} T</span>
              <span className="text-rose-700 dark:text-rose-400">{timeframeStats.thisWeek.falseCount} F</span>
            </div>
            {renderRatioBar(timeframeStats.thisWeek.truePct, timeframeStats.thisWeek.falsePct)}
            <div className="text-[10px] text-gray-400 text-right">
              {timeframeStats.thisWeek.truePct}% True
            </div>
          </div>
        </div>

        {/* Today */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div>
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Today
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {timeframeStats.today.total}
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="text-emerald-700 dark:text-emerald-400">{timeframeStats.today.trueCount} T</span>
              <span className="text-rose-700 dark:text-rose-400">{timeframeStats.today.falseCount} F</span>
            </div>
            {renderRatioBar(timeframeStats.today.truePct, timeframeStats.today.falsePct)}
            <div className="text-[10px] text-gray-400 text-right">
              {timeframeStats.today.truePct}% True
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View with True/False Ratios */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden transition-colors">
        {/* Calendar Month Navigation */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{monthName}</h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleCurrentMonth}
              className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              This Month
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 text-center border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/60 py-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-gray-800/70 border-b border-gray-200 dark:border-gray-800">
          {calendarDays.map((dayNum, idx) => {
            if (!dayNum) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[90px] p-2 bg-gray-50/30 dark:bg-gray-950/20"
                />
              );
            }

            const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(dayNum)}`;
            const dayData = data?.daily?.[dateStr];
            const isTodayDate =
              today.getFullYear() === viewYear &&
              today.getMonth() === viewMonth &&
              today.getDate() === dayNum;

            return (
              <div
                key={dateStr}
                onClick={() => onSelectDate(dateStr)}
                className={`min-h-[90px] p-2.5 flex flex-col justify-between transition-colors cursor-pointer group ${
                  dayData
                    ? 'hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 bg-white dark:bg-gray-900'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/40 bg-white dark:bg-gray-900'
                }`}
                title={`Click to view statements for ${dateStr}`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isTodayDate
                        ? 'bg-gray-900 dark:bg-emerald-500 text-white dark:text-gray-950'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayData && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {dayData.total} {dayData.total === 1 ? 'stmt' : 'stmts'}
                    </span>
                  )}
                </div>

                {/* Day Content: Ratios or Null */}
                <div className="mt-2">
                  {dayData ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-semibold">
                        <span className="text-emerald-700 dark:text-emerald-400">{dayData.trueCount}T</span>
                        <span className="text-rose-700 dark:text-rose-400">{dayData.falseCount}F</span>
                        <span className="text-gray-500 font-mono">{dayData.truePct}%</span>
                      </div>
                      {renderRatioBar(dayData.truePct, dayData.falsePct)}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-[11px] text-gray-400 dark:text-gray-600 font-mono select-none">
                      null
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Month-wise and Year-wise Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Month-wise Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden transition-colors">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Month-wise Statements & Ratios
            </h3>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {!data?.monthly || data.monthly.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">No monthly data available yet.</div>
            ) : (
              data.monthly.map((m) => (
                <div key={m.month} className="p-3.5 hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-white font-mono">{m.month}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{m.total} total</span>
                      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        {m.trueCount} True
                      </span>
                      <span className="text-[11px] font-medium text-rose-700 dark:text-rose-400">
                        {m.falseCount} False
                      </span>
                    </div>
                  </div>
                  {renderRatioBar(m.truePct, m.falsePct)}
                  <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
                    <span>Ratio: {m.ratioStr}</span>
                    <span>{m.truePct}% True / {m.falsePct}% False</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Year-wise Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden transition-colors">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Year-wise Statements & Ratios
            </h3>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {!data?.yearly || data.yearly.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">No yearly data available yet.</div>
            ) : (
              data.yearly.map((y) => (
                <div key={y.year} className="p-3.5 hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-white font-mono">{y.year}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{y.total} total</span>
                      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        {y.trueCount} True
                      </span>
                      <span className="text-[11px] font-medium text-rose-700 dark:text-rose-400">
                        {y.falseCount} False
                      </span>
                    </div>
                  </div>
                  {renderRatioBar(y.truePct, y.falsePct)}
                  <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
                    <span>Ratio: {y.ratioStr}</span>
                    <span>{y.truePct}% True / {y.falsePct}% False</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
