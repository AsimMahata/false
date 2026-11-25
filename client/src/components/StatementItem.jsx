import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  History,
  Lock,
  Save,
  X,
  Clock,
} from 'lucide-react';

export function StatementItem({
  statement,
  decryptedContent,
  isUnlocked,
  onToggleStatus,
  onEditContent,
  onDelete,
  onViewHistory,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(decryptedContent || '');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const isTrue = statement.status === true;

  const handleStartEdit = () => {
    setEditText(decryptedContent || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    setIsSavingEdit(true);
    try {
      await onEditContent(statement.statement_id, editText.trim());
      setIsEditing(false);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`rounded-xl border transition-all p-4 ${
        isTrue
          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-xs'
          : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60 shadow-xs'
      }`}
    >
      <div className="flex flex-col gap-3">
        {/* Top bar: Status badge + Version & Actions */}
        <div className="flex items-center justify-between gap-2">
          {/* Status Badge (Green for TRUE, Red for FALSE) */}
          <button
            onClick={() => onToggleStatus(statement.statement_id, !statement.status)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              isTrue
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
            }`}
            title="Click to toggle status (True / False)"
          >
            {isTrue ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                TRUE
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" />
                FALSE
              </>
            )}
          </button>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {/* Version History Button */}
            <button
              onClick={() => onViewHistory(statement.statement_id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer"
              title="View Version History"
            >
              <History className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              <span>{statement.current_version}</span>
              {statement.versions?.length > 1 && (
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                  ({statement.versions.length})
                </span>
              )}
            </button>

            {/* Edit button */}
            {isUnlocked && !isEditing && (
              <button
                onClick={handleStartEdit}
                className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer"
                title="Edit Statement Content"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Delete button (Soft Delete) */}
            <button
              onClick={() => onDelete(statement.statement_id)}
              className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 bg-white/80 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer"
              title="Delete Statement (Soft Delete)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content area */}
        {isEditing ? (
          <div className="flex flex-col gap-2 mt-1">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              className="w-full p-2.5 text-sm bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-gray-900 dark:focus:ring-emerald-500 resize-none"
              placeholder="Edit statement text..."
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleCancelEdit}
                disabled={isSavingEdit}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editText.trim() || isSavingEdit}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-gray-900 dark:bg-emerald-600 text-white hover:bg-black dark:hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3 h-3" />
                {isSavingEdit ? 'Saving Version...' : 'Save New Version'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-0.5">
            {isUnlocked ? (
              <p
                className={`text-base font-medium leading-relaxed ${
                  isTrue
                    ? 'text-emerald-950 dark:text-emerald-100'
                    : 'text-rose-950 dark:text-rose-100'
                }`}
              >
                {decryptedContent || (
                  <span className="italic text-gray-400 dark:text-gray-500">Decryption pending...</span>
                )}
              </p>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 italic py-1">
                <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                <span>[Encrypted statement content — unlock with master password to view]</span>
              </div>
            )}
          </div>
        )}

        {/* Footer: Metadata & Timestamps */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200/60 dark:border-gray-800">
          <span className="font-mono text-gray-400 dark:text-gray-500">
            ID: {statement.statement_id.slice(0, 13)}...
          </span>
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3 text-gray-400" />
            <span>Created: {formatTime(statement.created_at)}</span>
            {statement.updated_at && statement.updated_at !== statement.created_at && (
              <span>• Modified: {formatTime(statement.updated_at)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
