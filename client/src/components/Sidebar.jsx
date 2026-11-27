import React from 'react';
import {
  FileText,
  BookOpen,
  BarChart2,
  History,
  ShieldCheck,
  ShieldAlert,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  Unlock,
  Layers,
} from 'lucide-react';
import { useUncommittedDrafts } from '../utils/diaryDraftStorage';

export function Sidebar({
  activePage = 'statement', // 'statement' | 'diary'
  onSelectPage,
  activeStatementSubTab = 'list', // 'list' | 'summary' | 'activity'
  onSelectStatementSubTab,
  isUnlocked,
  isDarkMode,
  onToggleTheme,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) {
  const { count: uncommittedCount } = useUncommittedDrafts();
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-2xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between transition-all duration-300 ease-in-out shadow-xs ${
          /* Mobile Drawer */
          isOpenMobile
            ? 'translate-x-0 w-64'
            : '-translate-x-full md:translate-x-0'
        } ${
          /* Desktop Width */
          isCollapsed ? 'md:w-18' : 'md:w-64'
        }`}
      >
        {/* Top Header Section */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-gray-900 dark:bg-emerald-500 flex items-center justify-center text-white dark:text-gray-950 font-black text-sm tracking-tighter shrink-0 shadow-2xs">
                f
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <h1 className="text-base font-black text-gray-900 dark:text-white leading-tight lowercase tracking-tight">
                    false
                  </h1>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                    statement tracker & diary
                  </p>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 md:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1.5">
            {/* Statements Section */}
            <div>
              <button
                onClick={() => {
                  onSelectPage('statement');
                  if (isOpenMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activePage === 'statement'
                    ? 'bg-gray-900 text-white dark:bg-emerald-500 dark:text-gray-950 shadow-2xs'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Statements"
              >
                <FileText className="w-4 h-4 shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1 text-left flex items-center justify-between">
                    <span>Statements</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono opacity-80">
                      /statement
                    </span>
                  </div>
                )}
              </button>

              {/* Sub-navigation for Statements when active and not collapsed */}
              {activePage === 'statement' && !isCollapsed && (
                <div className="ml-5 mt-1.5 pl-3 border-l-2 border-gray-200 dark:border-gray-800 space-y-1 py-0.5">
                  <button
                    onClick={() => {
                      onSelectStatementSubTab('list');
                      if (isOpenMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-left ${
                      activeStatementSubTab === 'list'
                        ? 'text-gray-900 dark:text-white font-bold bg-gray-100 dark:bg-gray-800'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>Statements List</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectStatementSubTab('summary');
                      if (isOpenMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-left ${
                      activeStatementSubTab === 'summary'
                        ? 'text-gray-900 dark:text-white font-bold bg-gray-100 dark:bg-gray-800'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <BarChart2 className="w-3 h-3" />
                    <span>Summary & Analytics</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectStatementSubTab('activity');
                      if (isOpenMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-left ${
                      activeStatementSubTab === 'activity'
                        ? 'text-gray-900 dark:text-white font-bold bg-gray-100 dark:bg-gray-800'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <History className="w-3 h-3" />
                    <span>Activity Log</span>
                  </button>
                </div>
              )}
            </div>

            {/* Diary / Dairy Page */}
            <div>
              <button
                onClick={() => {
                  onSelectPage('diary');
                  if (isOpenMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activePage === 'diary'
                    ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-gray-950 shadow-2xs'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                }`}
                title="Diary ('Dairy')"
              >
                <div className="relative shrink-0">
                  <BookOpen className="w-4 h-4" />
                  {uncommittedCount > 0 && isCollapsed && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 text-left flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-caveat text-sm font-bold tracking-wide">
                        Diary ("Dairy")
                      </span>
                      {uncommittedCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                          {uncommittedCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono opacity-80">
                      /dairy
                    </span>
                  </div>
                )}
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom Section: Theme, Encryption Status, Collapse Rail Toggle */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800/80 space-y-2">
          {/* Encryption Status Pill */}
          {!isCollapsed ? (
            <div className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isUnlocked ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                )}
                <div>
                  <div className="text-[11px] font-bold text-gray-800 dark:text-gray-200">
                    {isUnlocked ? 'Unlocked (AES-256)' : 'Locked'}
                  </div>
                  <div className="text-[9px] text-gray-400 dark:text-gray-500">
                    Client-Side Protected
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={isUnlocked ? 'Unlocked' : 'Locked'}>
              {isUnlocked ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
          )}

          {/* Theme Toggle & Collapse Toggle */}
          <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between'}`}>
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-gray-600" />
              )}
            </button>

            {/* Desktop Collapse / Expand Button */}
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
