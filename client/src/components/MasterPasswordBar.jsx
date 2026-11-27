import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, Clock } from 'lucide-react';

export function MasterPasswordBar({ isUnlocked, onUnlock, onLock, error }) {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember7Days, setRemember7Days] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passwordInput.trim()) {
      onUnlock(passwordInput.trim(), remember7Days);
    }
  };

  const handleLock = () => {
    setPasswordInput('');
    onLock();
  };

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isUnlocked
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300'
          : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              isUnlocked
                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
            }`}
          >
            {isUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {isUnlocked
                  ? 'Client-Side Encryption Active'
                  : 'Master Password Required to Decrypt Journal & Statements'}
              </h3>
              {isUnlocked && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-medium">
                  <Clock className="w-3 h-3" />
                  7-Day Session Active
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {isUnlocked
                ? 'Decrypted locally in browser memory. Key is never transmitted across the network.'
                : 'Enter your master password. Content is decrypted client-side with AES-256-GCM.'}
            </p>
          </div>
        </div>

        {isUnlocked ? (
          <button
            onClick={handleLock}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white shadow-xs transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            Lock App
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <input
                  id="master-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter master password..."
                  className="w-full pl-8 pr-16 py-1.5 text-xs bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-hidden focus:ring-2 focus:ring-gray-900 dark:focus:ring-emerald-500"
                />
                <KeyRound className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <button
                type="submit"
                disabled={!passwordInput.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 dark:bg-emerald-600 text-white hover:bg-black dark:hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                Unlock
              </button>
            </div>

            {/* 7-day session checkbox */}
            <label className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember7Days}
                onChange={(e) => setRemember7Days(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 dark:border-gray-700 dark:bg-gray-800 cursor-pointer"
              />
              <span>Remember unlocked session for 7 days on this device</span>
            </label>
          </form>
        )}
      </div>

      {error && (
        <div className="mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400 font-medium">
          {error}
        </div>
      )}
    </div>
  );
}
