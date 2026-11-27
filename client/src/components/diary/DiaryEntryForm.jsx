import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  X,
  Eye,
  PenTool,
  Columns,
  Sparkles,
  Smile,
  AlertCircle,
  Clock,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { BBCodeToolbar } from './BBCodeToolbar';
import { BBCodeRenderer } from './BBCodeRenderer';
import {
  getUncommittedDraft,
  saveUncommittedDraft,
  deleteUncommittedDraft,
} from '../../utils/diaryDraftStorage';

const MOODS = [
  { id: 'calm', label: '☕ Calm', emoji: '☕' },
  { id: 'grateful', label: '☀️ Grateful', emoji: '☀️' },
  { id: 'peaceful', label: '🌙 Peaceful', emoji: '🌙' },
  { id: 'reflective', label: '🌧️ Reflective', emoji: '🌧️' },
  { id: 'productive', label: '🚀 Productive', emoji: '🚀' },
  { id: 'thoughtful', label: '💭 Thoughtful', emoji: '💭' },
  { id: 'inspired', label: '💡 Inspired', emoji: '💡' },
  { id: 'serene', label: '🌿 Serene', emoji: '🌿' },
  { id: 'motivated', label: '🔥 Motivated', emoji: '🔥' },
  { id: 'tired', label: '😴 Tired', emoji: '😴' },
];

export function DiaryEntryForm({
  initialData = {},
  onCommit,
  onCancel,
  isSubmitting = false,
  date,
  fontSizeClass = 'diary-handwriting-normal',
  entryId = null,
  currentVersion = 'v1',
}) {
  // Check if an uncommitted draft already exists in localStorage for this date
  const existingDraft = getUncommittedDraft(date);

  const [title, setTitle] = useState(
    existingDraft ? existingDraft.title : initialData.title || ''
  );
  const [mood, setMood] = useState(
    existingDraft ? existingDraft.mood : initialData.mood || '☕ Calm'
  );
  const [body, setBody] = useState(
    existingDraft ? existingDraft.body : initialData.body || ''
  );

  const [activeTab, setActiveTab] = useState('split'); // 'write' | 'split' | 'preview'
  const [error, setError] = useState(null);
  const [lastSavedTime, setLastSavedTime] = useState(
    existingDraft?.updatedAt || null
  );

  const textareaRef = useRef(null);
  const isFirstRender = useRef(true);

  // Auto-resize textarea height to fit content smoothly
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(380, el.scrollHeight)}px`;
    }
  }, [body, activeTab]);

  // Real-time auto-save to localStorage on every change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Save uncommitted draft
    const updated = saveUncommittedDraft(date, {
      entryId: entryId || existingDraft?.entryId || null,
      baseVersion: currentVersion || existingDraft?.baseVersion || null,
      title,
      mood,
      body,
    });

    if (updated?.updatedAt) {
      setLastSavedTime(updated.updatedAt);
    }
  }, [title, mood, body, date, entryId, currentVersion]);

  // Compute next version label for button
  const getCommitButtonLabel = () => {
    if (isSubmitting) return 'Encrypting & Committing...';
    if (entryId) {
      // Calculate next version
      const numMatch = currentVersion?.match(/^v(\d+)$/);
      const nextNum = numMatch ? parseInt(numMatch[1], 10) + 1 : 2;
      return `Commit Changes (v${nextNum})`;
    }
    return 'Commit Entry (v1)';
  };

  const handleCommitSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!body.trim()) {
      setError('Diary content cannot be empty.');
      return;
    }
    setError(null);
    try {
      await onCommit({
        title: title.trim(),
        mood,
        body,
      });
      // Clear uncommitted draft from localStorage upon successful commit
      deleteUncommittedDraft(date);
    } catch (err) {
      setError(err.message || 'Failed to commit diary entry');
    }
  };

  const handleDiscardDraft = () => {
    if (
      window.confirm(
        `Discard uncommitted changes for ${date}? This will remove local edits and revert to the server state.`
      )
    ) {
      deleteUncommittedDraft(date);
      if (onCancel) {
        onCancel();
      } else {
        setTitle(initialData.title || '');
        setMood(initialData.mood || '☕ Calm');
        setBody(initialData.body || '');
      }
    }
  };

  const formatSavedTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <form onSubmit={handleCommitSubmit} className="space-y-4">
      {/* Mood & Title Header Card */}
      <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-amber-200/80 dark:border-gray-800 p-4 shadow-xs backdrop-blur-xs space-y-3.5 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Mood Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Smile className="w-3.5 h-3.5 text-amber-500" />
              Mood:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.label)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    mood === m.label
                      ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-2xs font-semibold'
                      : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-gray-700/80 border border-transparent'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'write'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <PenTool className="w-3 h-3" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'split'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Columns className="w-3 h-3" />
              <span>Split</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* Title Input */}
        <div>
          <input
            type="text"
            placeholder="Entry Title (optional, e.g. An Unforgettable Autumn Evening)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-800 bg-amber-50/30 dark:bg-gray-800/40 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        {/* Real-Time Local Storage Draft Status Bar */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 dark:border-gray-800/60 text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              Saved to local storage
            </span>
            {lastSavedTime && (
              <span className="text-[11px] font-mono text-gray-400">
                ({formatSavedTime(lastSavedTime)})
              </span>
            )}
          </div>

          <div className="text-[11px] text-gray-400 dark:text-gray-500">
            Will only be sent to server upon commit
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor & Preview Area */}
      <div className="rounded-2xl overflow-hidden border border-amber-300/80 dark:border-amber-900/40 diary-notebook-shadow transition-all">
        {/* BBCode Toolbar */}
        {activeTab !== 'preview' && (
          <BBCodeToolbar
            textareaRef={textareaRef}
            value={body}
            onChange={(newVal) => setBody(newVal)}
          />
        )}

        <div
          className={`grid ${
            activeTab === 'split'
              ? 'grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-amber-200 dark:divide-gray-800'
              : 'grid-cols-1'
          }`}
        >
          {/* Textarea Editor */}
          {activeTab !== 'preview' && (
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Dear Diary,&#10;&#10;Write your memories, thoughts, and reflections here in authentic handwriting...&#10;What you type is auto-saved to local storage immediately.&#10;Supports bold [b], colors [color=red], quotes [quote], spoilers [spoiler], images [img], and more."
                className={`w-full min-h-[420px] p-6 pl-18 diary-paper focus:outline-hidden resize-none ${fontSizeClass} transition-colors`}
                style={{
                  lineHeight: '36px',
                }}
              />
            </div>
          )}

          {/* Live Preview Panel */}
          {(activeTab === 'preview' || activeTab === 'split') && (
            <div className="min-h-[420px] p-6 pl-18 diary-paper relative overflow-y-auto">
              <div className="mb-4 pb-2 border-b border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between">
                <div>
                  {title ? (
                    <h3 className="text-xl font-bold font-caveat text-amber-950 dark:text-amber-100">
                      {title}
                    </h3>
                  ) : (
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      Live Preview
                    </span>
                  )}
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100/70 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300/50">
                  {mood}
                </span>
              </div>

              {/* BBCode Rendered Content */}
              <div className={fontSizeClass}>
                <BBCodeRenderer text={body} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Commits are encrypted with AES-256-GCM before leaving browser</span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleDiscardDraft}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
            title="Discard local draft changes"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard Draft</span>
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-xl text-xs font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Keep as Draft
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !body.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{getCommitButtonLabel()}</span>
          </button>
        </div>
      </div>
    </form>
  );
}

export default DiaryEntryForm;
