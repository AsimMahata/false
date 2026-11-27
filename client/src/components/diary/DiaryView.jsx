import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  History,
  Lock,
  Unlock,
  BookOpen,
  PenTool,
  Clock,
  Sparkles,
  Type,
  Maximize2,
  FileText,
  AlertCircle,
  AlertTriangle,
  UploadCloud,
} from 'lucide-react';
import { BBCodeRenderer } from './BBCodeRenderer';
import { DiaryEntryForm } from './DiaryEntryForm';
import { DiaryVersionHistoryModal } from './DiaryVersionHistoryModal';
import { UncommittedDraftsModal } from './UncommittedDraftsModal';
import {
  fetchDiaryEntry,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
} from '../../api';
import { encryptStatement, decryptStatement } from '../../crypto/statementCrypto';
import {
  useUncommittedDrafts,
  getUncommittedDraft,
  deleteUncommittedDraft,
  clearAllUncommittedDrafts,
} from '../../utils/diaryDraftStorage';

const FONT_SIZE_STORAGE_KEY = 'false_diary_font_size';

// Format date helper exportable
export const formatDateFriendly = (dateStr) => {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export function DiaryView({
  selectedDate,
  setSelectedDate,
  masterPassword,
  isUnlocked,
  onPromptUnlock,
  onDeleteConfirm, // (config) => void
}) {
  // Mode: 'read' | 'write'
  const [viewMode, setViewMode] = useState('read');

  // Font size setting: 'normal' | 'large' | 'xl'
  const [fontSize, setFontSize] = useState(() => {
    try {
      return localStorage.getItem(FONT_SIZE_STORAGE_KEY) || 'normal';
    } catch {
      return 'normal';
    }
  });

  // Diary Entry State for selectedDate from server
  const [entry, setEntry] = useState(null);
  const [decryptedData, setDecryptedData] = useState(null); // { title, mood, body }
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Version History Modal & Uncommitted Drafts Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showUncommittedModal, setShowUncommittedModal] = useState(false);

  // Uncommitted drafts hook
  const { draftList, count: uncommittedCount, getDraft } = useUncommittedDrafts();
  const currentDraft = getDraft(selectedDate);

  // Save font size preference
  const handleSetFontSize = (sz) => {
    setFontSize(sz);
    try {
      localStorage.setItem(FONT_SIZE_STORAGE_KEY, sz);
    } catch {}
  };

  const getFontSizeClass = () => {
    if (fontSize === 'xl') return 'diary-handwriting-xl';
    if (fontSize === 'large') return 'diary-handwriting-large';
    return 'diary-handwriting-normal';
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Day navigation helpers
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - 1);
    const yStr = dt.getFullYear();
    const mStr = String(dt.getMonth() + 1).padStart(2, '0');
    const dStr = String(dt.getDate()).padStart(2, '0');
    setSelectedDate(`${yStr}-${mStr}-${dStr}`);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + 1);
    const yStr = dt.getFullYear();
    const mStr = String(dt.getMonth() + 1).padStart(2, '0');
    const dStr = String(dt.getDate()).padStart(2, '0');
    setSelectedDate(`${yStr}-${mStr}-${dStr}`);
  };

  const handleToday = () => {
    const dt = new Date();
    const yStr = dt.getFullYear();
    const mStr = String(dt.getMonth() + 1).padStart(2, '0');
    const dStr = String(dt.getDate()).padStart(2, '0');
    setSelectedDate(`${yStr}-${mStr}-${dStr}`);
  };

  const isToday = () => {
    const dt = new Date();
    const yStr = dt.getFullYear();
    const mStr = String(dt.getMonth() + 1).padStart(2, '0');
    const dStr = String(dt.getDate()).padStart(2, '0');
    return selectedDate === `${yStr}-${mStr}-${dStr}`;
  };

  // Decrypt entry content
  const decryptEntryContent = useCallback(async (contentEnvelope, password) => {
    if (!contentEnvelope || !password) return null;
    try {
      const plaintext = await decryptStatement(contentEnvelope, password);
      try {
        const parsed = JSON.parse(plaintext);
        return {
          title: parsed.title || '',
          mood: parsed.mood || '☕ Calm',
          body: parsed.body || '',
        };
      } catch {
        return {
          title: '',
          mood: '☕ Calm',
          body: plaintext,
        };
      }
    } catch (err) {
      return {
        title: '',
        mood: '⚠️ Error',
        body: `[Decryption Error: ${err.message}]`,
        error: true,
      };
    }
  }, []);

  // Load diary entry for current date
  const loadEntry = useCallback(
    async (date, pwd) => {
      try {
        setIsLoading(true);
        setApiError(null);
        setDecryptedData(null);

        const data = await fetchDiaryEntry(date);
        setEntry(data);

        if (data && data.content && pwd) {
          const dec = await decryptEntryContent(data.content, pwd);
          setDecryptedData(dec);
        }
      } catch (err) {
        setApiError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [decryptEntryContent]
  );

  useEffect(() => {
    loadEntry(selectedDate, masterPassword);
  }, [selectedDate, masterPassword, loadEntry]);

  // When date changes, reset view mode to read if an entry or draft exists
  useEffect(() => {
    setViewMode('read');
  }, [selectedDate]);

  // Handle Commit (Encrypt with AES-256 and POST/PUT to server)
  const handleCommitEntry = async (formData) => {
    if (!masterPassword || !isUnlocked) {
      setApiError('Please unlock with master password before committing.');
      if (onPromptUnlock) onPromptUnlock();
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);

      // Pack title, mood, and body into JSON string
      const rawPayload = JSON.stringify({
        title: formData.title,
        mood: formData.mood,
        body: formData.body,
      });

      // Encrypt with AES-256-GCM
      const envelope = await encryptStatement(rawPayload, masterPassword);

      let saved;
      if (entry && entry.entry_id) {
        // Update existing entry (creates v2, v3, etc.)
        saved = await updateDiaryEntry(entry.entry_id, envelope);
      } else {
        // Create new entry for date (creates v1)
        saved = await createDiaryEntry(selectedDate, envelope);
      }

      // Clear local uncommitted draft
      deleteUncommittedDraft(selectedDate);

      setEntry(saved);
      setDecryptedData({
        title: formData.title,
        mood: formData.mood,
        body: formData.body,
      });
      setViewMode('read');
    } catch (err) {
      setApiError(err.message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Commit arbitrary draft from the Uncommitted Modal
  const handleCommitDraftFromModal = async (draft) => {
    if (!masterPassword || !isUnlocked) {
      if (onPromptUnlock) onPromptUnlock();
      throw new Error('Please unlock with master password first.');
    }

    const rawPayload = JSON.stringify({
      title: draft.title,
      mood: draft.mood,
      body: draft.body,
    });

    const envelope = await encryptStatement(rawPayload, masterPassword);

    if (draft.entryId) {
      await updateDiaryEntry(draft.entryId, envelope);
    } else {
      await createDiaryEntry(draft.date, envelope);
    }

    deleteUncommittedDraft(draft.date);

    if (draft.date === selectedDate) {
      await loadEntry(selectedDate, masterPassword);
    }
  };

  // Discard draft for current date
  const handleDiscardCurrentDraft = () => {
    if (
      window.confirm(
        `Discard uncommitted draft for ${formatDateFriendly(selectedDate)}?`
      )
    ) {
      deleteUncommittedDraft(selectedDate);
    }
  };

  // Handle Server Entry Delete
  const handleDeleteEntry = () => {
    if (!entry) return;

    const action = async () => {
      try {
        await deleteDiaryEntry(entry.entry_id);
        deleteUncommittedDraft(selectedDate);
        setEntry(null);
        setDecryptedData(null);
        setViewMode('read');
      } catch (err) {
        setApiError(err.message);
      }
    };

    if (onDeleteConfirm) {
      onDeleteConfirm({
        title: 'Delete Diary Entry',
        message: `Are you sure you want to delete the diary entry for ${formatDateFriendly(
          selectedDate
        )}? This will move it to archive while preserving audit history.`,
        confirmText: 'Delete Diary Entry',
        confirmVariant: 'danger',
        onConfirm: action,
      });
    } else {
      if (window.confirm('Are you sure you want to delete this diary entry?')) {
        action();
      }
    }
  };

  // Display content in read mode: prioritize uncommitted draft if one exists, otherwise server decrypted data
  const activeDisplayData = currentDraft
    ? {
        title: currentDraft.title,
        mood: currentDraft.mood,
        body: currentDraft.body,
        isDraft: true,
      }
    : decryptedData;

  return (
    <div className="space-y-6">
      {/* Date Header & Diary Controls */}
      <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-amber-200/80 dark:border-gray-800 p-4 shadow-xs backdrop-blur-xs transition-colors">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Date & Friendly Info */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-800 dark:text-amber-300 shadow-2xs border border-amber-200/60 dark:border-amber-800/40">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                  {formatDateFriendly(selectedDate)}
                </h2>
                {isToday() && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-600 dark:bg-amber-500 text-white">
                    Today
                  </span>
                )}
                {entry && !isLoading && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                    {entry.current_version || 'v1'}
                  </span>
                )}
                {currentDraft && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                    Uncommitted Draft
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                {selectedDate}
                {entry?.updated_at &&
                  ` • Last committed ${formatDateTime(entry.updated_at)}`}
              </p>
            </div>
          </div>

          {/* Controls: Date navigation & Uncommitted Pages Button & View tools */}
          <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto justify-between md:justify-end">
            {/* Uncommitted Pages Indicator Button */}
            <button
              type="button"
              onClick={() => setShowUncommittedModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                uncommittedCount > 0
                  ? 'bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 shadow-2xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="View all uncommitted local pages"
            >
              <AlertTriangle
                className={`w-3.5 h-3.5 ${
                  uncommittedCount > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-400'
                }`}
              />
              <span>Uncommitted</span>
              {uncommittedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {uncommittedCount}
                </span>
              )}
            </button>

            {/* Prev / Today / Next Date Navigation */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {!isToday() && (
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                >
                  Today
                </button>
              )}

              <button
                type="button"
                onClick={handleNextDay}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg border border-transparent hover:border-gray-300 dark:hover:border-gray-600 bg-transparent text-gray-700 dark:text-gray-300 cursor-pointer focus:outline-hidden"
              />
            </div>

            {/* Font Size Selector */}
            <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
              <span className="px-1.5 text-gray-400" title="Handwriting Font Size">
                <Type className="w-3.5 h-3.5" />
              </span>
              <button
                type="button"
                onClick={() => handleSetFontSize('normal')}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  fontSize === 'normal'
                    ? 'bg-white dark:bg-gray-700 text-amber-700 dark:text-amber-300 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => handleSetFontSize('large')}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer text-sm ${
                  fontSize === 'large'
                    ? 'bg-white dark:bg-gray-700 text-amber-700 dark:text-amber-300 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => handleSetFontSize('xl')}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer text-base ${
                  fontSize === 'xl'
                    ? 'bg-white dark:bg-gray-700 text-amber-700 dark:text-amber-300 shadow-2xs font-black'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                A++
              </button>
            </div>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Uncommitted Local Draft Notice Banner for Currently Selected Date */}
      {currentDraft && viewMode === 'read' && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-950 dark:text-amber-100">
                  Uncommitted Local Draft Active
                </span>
                <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400">
                  • Stored locally on this browser
                </span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                You are previewing local changes. Commit them to encrypt and push to server, or discard to revert.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleDiscardCurrentDraft}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-100/50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Discard</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('write')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100/50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => handleCommitEntry(currentDraft)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Committing...' : 'Commit to Server'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Journal View Body */}
      {!isUnlocked ? (
        /* Locked Journal Cover */
        <div className="rounded-3xl border border-amber-300/80 dark:border-amber-900/50 bg-linear-to-b from-amber-50/90 to-amber-100/50 dark:from-gray-900 dark:to-gray-950 p-10 text-center diary-notebook-shadow space-y-5">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-300 shadow-inner">
            <Lock className="w-10 h-10" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-2xl font-bold font-caveat text-amber-950 dark:text-amber-100">
              Journal is Locked
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-sans">
              Your diary entries are end-to-end encrypted with zero-knowledge AES-256-GCM.
              Unlock with your master password to read and commit your journal.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onPromptUnlock}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white shadow-md transition-all cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Master Password</span>
            </button>
          </div>
        </div>
      ) : isLoading ? (
        /* Loading Skeleton */
        <div className="rounded-3xl border border-amber-200 dark:border-gray-800 p-12 text-center text-xs text-gray-400 dark:text-gray-500 diary-paper min-h-[360px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span>Loading diary page for {selectedDate}...</span>
          </div>
        </div>
      ) : viewMode === 'write' ? (
        /* Write / Edit Mode Form */
        <DiaryEntryForm
          initialData={currentDraft || decryptedData || {}}
          onCommit={handleCommitEntry}
          onCancel={() => setViewMode('read')}
          isSubmitting={isSubmitting}
          date={selectedDate}
          fontSizeClass={getFontSizeClass()}
          entryId={entry?.entry_id || currentDraft?.entryId || null}
          currentVersion={entry?.current_version || currentDraft?.baseVersion || 'v1'}
        />
      ) : (
        /* Read Mode (Authentic Lined Notebook Paper View) */
        <div className="space-y-4">
          {/* Action Toolbar (Edit, Version History, Delete, Switch to Write) */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {activeDisplayData?.mood && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700 shadow-2xs">
                  Mood: {activeDisplayData.mood}
                </span>
              )}
              {activeDisplayData?.isDraft && (
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-amber-500 text-white font-bold">
                  LOCAL DRAFT
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {entry && (
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Revisions ({entry.versions?.length || 1})</span>
                </button>
              )}

              {entry || currentDraft ? (
                <>
                  <button
                    type="button"
                    onClick={() => setViewMode('write')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{currentDraft ? 'Continue Writing Draft' : 'Edit Entry'}</span>
                  </button>

                  {entry && (
                    <button
                      type="button"
                      onClick={handleDeleteEntry}
                      className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete Entry from Server"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setViewMode('write')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Start Writing Today's Journal</span>
                </button>
              )}
            </div>
          </div>

          {/* Authentic Notebook Paper Page */}
          <div className="rounded-3xl border border-amber-300/80 dark:border-amber-900/40 diary-notebook-shadow diary-paper min-h-[500px] p-6 sm:p-10 pl-16 sm:pl-20 relative overflow-hidden transition-all">
            {activeDisplayData ? (
              <div className="space-y-4">
                {/* Journal Entry Title */}
                {activeDisplayData.title && (
                  <div className="border-b border-amber-200/80 dark:border-amber-900/40 pb-2 mb-4">
                    <h1 className="text-2xl sm:text-3xl font-bold font-caveat text-amber-950 dark:text-amber-100 tracking-wide">
                      {activeDisplayData.title}
                    </h1>
                  </div>
                )}

                {/* Rendered BBCode Body */}
                <div className={getFontSizeClass()}>
                  <BBCodeRenderer text={activeDisplayData.body} />
                </div>
              </div>
            ) : (
              /* Empty Journal State */
              <div className="py-20 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100/60 dark:bg-amber-950/40 flex items-center justify-center text-amber-700 dark:text-amber-300">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold font-caveat text-amber-900 dark:text-amber-200">
                    The page is blank.
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-sans max-w-sm mx-auto">
                    No diary entry has been written for {formatDateFriendly(selectedDate)} yet.
                    Whatever you type will be saved locally until committed!
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setViewMode('write')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Write on this page</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showHistoryModal && entry && (
        <DiaryVersionHistoryModal
          entryId={entry.entry_id}
          masterPassword={masterPassword}
          onClose={() => setShowHistoryModal(false)}
          fontSizeClass={getFontSizeClass()}
        />
      )}

      {/* Uncommitted Drafts Modal */}
      <UncommittedDraftsModal
        isOpen={showUncommittedModal}
        onClose={() => setShowUncommittedModal(false)}
        draftList={draftList}
        onSelectDate={(dt) => setSelectedDate(dt)}
        onCommitDraft={handleCommitDraftFromModal}
        onDiscardDraft={(dt) => deleteUncommittedDraft(dt)}
        onDiscardAll={() => clearAllUncommittedDrafts()}
        isUnlocked={isUnlocked}
        onPromptUnlock={onPromptUnlock}
      />
    </div>
  );
}

export default DiaryView;
