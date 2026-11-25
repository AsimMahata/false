import React, { useState } from 'react';
import { PlusCircle, Lock } from 'lucide-react';

export function StatementForm({ onAddStatement, isUnlocked, isSubmitting }) {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() || !isUnlocked || isSubmitting) return;

    onAddStatement(content.trim());
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!isUnlocked || isSubmitting}
          placeholder={
            isUnlocked
              ? 'Enter a statement to track for this date (e.g. "Completed core database migration")...'
              : 'Unlock with master password above to add encrypted statements.'
          }
          className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-gray-900 dark:focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!content.trim() || !isUnlocked || isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-gray-900 dark:bg-emerald-600 text-white hover:bg-black dark:hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          {isUnlocked ? (
            <>
              <PlusCircle className="w-4 h-4" />
              {isSubmitting ? 'Encrypting & Saving...' : 'Add Statement'}
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Locked
            </>
          )}
        </button>
      </div>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
        • New statements are created with <span className="font-semibold text-emerald-600 dark:text-emerald-400">status: TRUE</span> by default.
        • Encrypted client-side with AES-256-GCM before storage.
      </p>
    </form>
  );
}
