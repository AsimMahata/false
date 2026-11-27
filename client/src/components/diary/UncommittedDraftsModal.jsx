import React, { useState } from 'react';
import {
  FileText,
  UploadCloud,
  Trash2,
  ExternalLink,
  X,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Smile,
  ShieldCheck,
} from 'lucide-react';
import { formatDateFriendly } from './DiaryView';

export function UncommittedDraftsModal({
  isOpen,
  onClose,
  draftList = [],
  onSelectDate,
  onCommitDraft,
  onDiscardDraft,
  onDiscardAll,
  isUnlocked,
  onPromptUnlock,
}) {
  const [committingDate, setCommittingDate] = useState(null);
  const [discardingDate, setDiscardingDate] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleCommit = async (draft) => {
    if (!isUnlocked) {
      if (onPromptUnlock) onPromptUnlock();
      return;
    }
    setError(null);
    setCommittingDate(draft.date);
    try {
      await onCommitDraft(draft);
    } catch (err) {
      setError(`Failed to commit entry for ${draft.date}: ${err.message}`);
    } finally {
      setCommittingDate(null);
    }
  };

  const handleDiscard = (date) => {
    if (window.confirm(`Discard uncommitted changes for ${date}? This cannot be undone.`)) {
      onDiscardDraft(date);
    }
  };

  const formatFriendly = (dateStr) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl border border-amber-300 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-amber-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Uncommitted Pages
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-2xs">
                  {draftList.length}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Saved locally on your device • Not sent to server yet
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* List of uncommitted drafts */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {draftList.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                All Clean! No Uncommitted Pages
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Whatever you type into your diary will be kept in local storage as a draft until you commit it to the server.
              </p>
            </div>
          ) : (
            draftList.map((draft) => {
              const isCommitting = committingDate === draft.date;

              return (
                <div
                  key={draft.date}
                  className="p-4 rounded-xl border border-amber-200/90 dark:border-gray-800 bg-amber-50/30 dark:bg-gray-800/30 hover:border-amber-300 dark:hover:border-gray-700 transition-all space-y-3"
                >
                  {/* Item Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        {formatFriendly(draft.date)}
                      </span>
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                        ({draft.date})
                      </span>
                      {draft.mood && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200">
                          {draft.mood}
                        </span>
                      )}
                      {draft.entryId ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                          Editing {draft.baseVersion || 'entry'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                          New Entry (v1)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTimestamp(draft.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Snippet / Title */}
                  <div className="space-y-1">
                    {draft.title && (
                      <h4 className="text-sm font-semibold font-caveat text-amber-950 dark:text-amber-100">
                        {draft.title}
                      </h4>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 font-mono bg-white/70 dark:bg-gray-900/70 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                      {draft.body || '(Empty body)'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-100 dark:border-gray-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectDate(draft.date);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Page</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDiscard(draft.date)}
                        disabled={isCommitting}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
                        title="Discard uncommitted changes"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Discard</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCommit(draft)}
                        disabled={isCommitting}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{isCommitting ? 'Encrypting & Committing...' : 'Commit to Server'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Commits are encrypted with AES-256-GCM before sending</span>
          </div>

          <div className="flex items-center gap-2">
            {draftList.length > 1 && onDiscardAll && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to discard ALL uncommitted drafts?')) {
                    onDiscardAll();
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
              >
                Discard All
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UncommittedDraftsModal;
