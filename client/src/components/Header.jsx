import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ListFilter,
  History,
  Sun,
  Moon,
  BarChart2,
  BookOpen,
  Menu,
} from 'lucide-react';
import { useUncommittedDrafts } from '../utils/diaryDraftStorage';

export function Header({
  activePage = 'statement', // 'statement' | 'diary'
  onSelectPage,
  activeTab = 'statements', // 'statements' | 'summary' | 'activity'
  setActiveTab,
  isUnlocked,
  isDarkMode,
  onToggleTheme,
  onToggleMobileSidebar,
}) {
  const { count: uncommittedCount } = useUncommittedDrafts();
  return (
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 shadow-xs transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 md:hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => onSelectPage && onSelectPage('statement')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-xl bg-gray-900 dark:bg-emerald-500 flex items-center justify-center text-white dark:text-gray-950 font-black text-sm tracking-tighter shadow-2xs group-hover:scale-105 transition-transform">
              f
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black text-gray-900 dark:text-white leading-tight tracking-tight lowercase">
                  false
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  v2
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                statement tracker & journal
              </p>
            </div>
          </div>
        </div>

        {/* Center: Prominent Multi-Page Navigation Pills */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/90 p-1 rounded-xl">
          {/* Statements Page Button */}
          <button
            onClick={() => onSelectPage && onSelectPage('statement')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activePage === 'statement'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Statements</span>
          </button>

          {/* Diary ("Dairy") Page Button */}
          <button
            onClick={() => onSelectPage && onSelectPage('diary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activePage === 'diary'
                ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-gray-950 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-amber-800 dark:hover:text-amber-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="font-caveat text-sm font-bold">Diary</span>
            {uncommittedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {uncommittedCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Controls: Theme Toggle & Encryption Status */}
        <div className="flex items-center gap-2">
          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-gray-600" />
            )}
          </button>

          {/* Encryption Status Pill */}
          {isUnlocked ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Decrypted</span> (AES-256)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Locked</span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
