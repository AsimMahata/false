import { useState, useEffect } from 'react';

const STORAGE_KEY = 'false_diary_uncommitted_drafts';
const DRAFT_CHANGE_EVENT = 'false_diary_drafts_changed';

/**
 * Get all uncommitted drafts from localStorage
 * @returns {Record<string, {date: string, entryId: string|null, baseVersion: string|null, title: string, mood: string, body: string, updatedAt: string}>}
 */
export function getUncommittedDrafts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read uncommitted drafts from localStorage:', err);
    return {};
  }
}

/**
 * Get draft for a specific date
 * @param {string} date
 */
export function getUncommittedDraft(date) {
  if (!date) return null;
  const drafts = getUncommittedDrafts();
  return drafts[date] || null;
}

/**
 * Save or update an uncommitted draft for a specific date
 * @param {string} date
 * @param {{entryId?: string|null, baseVersion?: string|null, title?: string, mood?: string, body: string}} draftData
 */
export function saveUncommittedDraft(date, draftData) {
  if (!date) return;
  try {
    const drafts = getUncommittedDrafts();
    const existing = drafts[date] || {};

    const updatedDraft = {
      date,
      entryId: draftData.entryId !== undefined ? draftData.entryId : existing.entryId || null,
      baseVersion: draftData.baseVersion !== undefined ? draftData.baseVersion : existing.baseVersion || null,
      title: draftData.title !== undefined ? draftData.title : existing.title || '',
      mood: draftData.mood !== undefined ? draftData.mood : existing.mood || '☕ Calm',
      body: draftData.body !== undefined ? draftData.body : existing.body || '',
      updatedAt: new Date().toISOString(),
    };

    drafts[date] = updatedDraft;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));

    // Dispatch global event for reactive UI updates
    window.dispatchEvent(new CustomEvent(DRAFT_CHANGE_EVENT, { detail: { date, draft: updatedDraft } }));
    return updatedDraft;
  } catch (err) {
    console.error('Failed to save uncommitted draft to localStorage:', err);
  }
}

/**
 * Delete uncommitted draft for a specific date
 * @param {string} date
 */
export function deleteUncommittedDraft(date) {
  if (!date) return;
  try {
    const drafts = getUncommittedDrafts();
    if (drafts[date]) {
      delete drafts[date];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
      window.dispatchEvent(new CustomEvent(DRAFT_CHANGE_EVENT, { detail: { date, draft: null } }));
    }
  } catch (err) {
    console.error('Failed to delete uncommitted draft from localStorage:', err);
  }
}

/**
 * Clear all uncommitted drafts
 */
export function clearAllUncommittedDrafts() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(DRAFT_CHANGE_EVENT, { detail: { all: true } }));
  } catch (err) {
    console.error('Failed to clear uncommitted drafts:', err);
  }
}

/**
 * React hook to observe uncommitted drafts count and list in real time
 */
export function useUncommittedDrafts() {
  const [drafts, setDrafts] = useState(() => getUncommittedDrafts());

  useEffect(() => {
    const update = () => {
      setDrafts(getUncommittedDrafts());
    };

    window.addEventListener(DRAFT_CHANGE_EVENT, update);
    window.addEventListener('storage', update);

    return () => {
      window.removeEventListener(DRAFT_CHANGE_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);

  const draftList = Object.values(drafts).sort((a, b) => {
    // Sort descending by date or updatedAt
    return new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date);
  });

  return {
    drafts,
    draftList,
    count: draftList.length,
    getDraft: (date) => drafts[date] || null,
  };
}
