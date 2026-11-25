import React from 'react';
import { ShieldCheck, ShieldAlert, ListFilter, History, Sun, Moon, BarChart2 } from 'lucide-react';

export function Header({ activeTab, setActiveTab, isUnlocked, isDarkMode, onToggleTheme }) {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 shadow-xs transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-emerald-500 flex items-center justify-center text-white dark:text-gray-950 font-bold text-sm tracking-tighter">
            f
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white leading-tight tracking-tight lowercase">
              false
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">a statement tracker</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('statements')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'statements'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            Statements
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Summary
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Activity Log
          </button>
        </div>

        {/* Right Controls: Theme Toggle & Encryption Status */}
        <div className="flex items-center gap-2">
          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
          </button>

          {/* Encryption Status Pill */}
          {isUnlocked ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Decrypted (AES-256)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Locked
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
