import React, { useState, useRef, useEffect } from 'react';
import {
  Save,
  X,
  Eye,
  PenTool,
  Columns,
  Sparkles,
  Smile,
  AlertCircle,
} from 'lucide-react';
import { BBCodeToolbar } from './BBCodeToolbar';
import { BBCodeRenderer } from './BBCodeRenderer';

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
  onSave,
  onCancel,
  isSubmitting = false,
  date,
  fontSizeClass = 'diary-handwriting-normal',
}) {
  const [title, setTitle] = useState(initialData.title || '');
  const [mood, setMood] = useState(initialData.mood || '☕ Calm');
  const [body, setBody] = useState(initialData.body || '');
  const [activeTab, setActiveTab] = useState('split'); // 'write' | 'split' | 'preview'
  const [error, setError] = useState(null);

  const textareaRef = useRef(null);

  // Auto-resize textarea height to fit content smoothly
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(380, el.scrollHeight)}px`;
    }
  }, [body, activeTab]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!body.trim()) {
      setError('Diary content cannot be empty.');
      return;
    }
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        mood,
        body,
      });
    } catch (err) {
      setError(err.message || 'Failed to save diary entry');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* Optional Title Input */}
        <div>
          <input
            type="text"
            placeholder="Entry Title (optional, e.g. An Unforgettable Autumn Evening)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-800 bg-amber-50/30 dark:bg-gray-800/40 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
          />
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

        <div className={`grid ${activeTab === 'split' ? 'grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-amber-200 dark:divide-gray-800' : 'grid-cols-1'}`}>
          {/* Textarea Editor */}
          {activeTab !== 'preview' && (
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Dear Diary,&#10;&#10;Write your memories, thoughts, and reflections here in authentic handwriting...&#10;Supports bold [b], colors [color=red], quotes [quote], spoilers [spoiler], images [img], and more."
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
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Encrypted with AES-256 before leaving your browser</span>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !body.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Encrypting & Saving...' : 'Save Diary Entry'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}

export default DiaryEntryForm;
