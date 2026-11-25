import React, { useState, useEffect, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Header } from './components/Header';
import { MasterPasswordBar } from './components/MasterPasswordBar';
import { DateNavigation } from './components/DateNavigation';
import { StatementForm } from './components/StatementForm';
import { StatementList } from './components/StatementList';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { ActivityLogView } from './components/ActivityLogView';
import { SummaryView } from './components/SummaryView';
import { ConfirmModal } from './components/ConfirmModal';
import {
  fetchStatements,
  createStatement,
  updateStatementContent,
  toggleStatementStatus,
  deleteStatement,
} from './api';
import { encryptStatement, decryptStatement } from './crypto/statementCrypto';

const SESSION_STORAGE_KEY = 'stmt_tracker_session_v1';
const THEME_STORAGE_KEY = 'stmt_tracker_theme';

export function App() {
  const [activeTab, setActiveTab] = useState('statements');

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        localStorage.setItem(THEME_STORAGE_KEY, 'light');
      }
    } catch {}
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Selected date in local timezone YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString);

  // In-memory master password & decrypted state (with 7-day client-side sessioning)
  const [masterPassword, setMasterPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [cryptoError, setCryptoError] = useState(null);

  // Statements for the currently selected date
  const [statements, setStatements] = useState([]);
  const [decryptedMap, setDecryptedMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Modal for version history
  const [historyStatementId, setHistoryStatementId] = useState(null);

  // Custom confirmation modal state
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);

  // Decrypt an array of statements with a password
  const decryptAllStatements = useCallback(async (stmtList, password) => {
    const map = {};
    for (const stmt of stmtList) {
      if (stmt.content) {
        try {
          const text = await decryptStatement(stmt.content, password);
          map[stmt.statement_id] = text;
        } catch (err) {
          map[stmt.statement_id] = `[Decryption Error: ${err.message}]`;
        }
      }
    }
    return map;
  }, []);

  // Restore 7-day session on page load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (session.expiresAt && Date.now() < session.expiresAt && session.key) {
          setMasterPassword(session.key);
          setIsUnlocked(true);
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    } catch {}
  }, []);

  // Fetch statements whenever selected date changes
  const loadStatements = useCallback(
    async (date, passwordToUse) => {
      try {
        setIsLoading(true);
        setApiError(null);
        const data = await fetchStatements(date);
        setStatements(data);

        const pwd = passwordToUse !== undefined ? passwordToUse : masterPassword;
        if (pwd) {
          const decMap = await decryptAllStatements(data, pwd);
          setDecryptedMap(decMap);
        } else {
          setDecryptedMap({});
        }
      } catch (err) {
        setApiError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [masterPassword, decryptAllStatements]
  );

  useEffect(() => {
    loadStatements(selectedDate);
  }, [selectedDate, loadStatements]);

  // Handle master password unlock
  const handleUnlock = async (password, remember7Days = true) => {
    try {
      setCryptoError(null);

      // If we have existing statements, test decryption against the first one to verify password
      if (statements.length > 0) {
        const firstStmt = statements.find((s) => s.content);
        if (firstStmt) {
          await decryptStatement(firstStmt.content, password);
        }
      }

      setMasterPassword(password);
      setIsUnlocked(true);

      // Save 7-day session in client localStorage if requested
      if (remember7Days) {
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({ key: password, expiresAt })
        );
      }

      // Decrypt all currently loaded statements
      const decMap = await decryptAllStatements(statements, password);
      setDecryptedMap(decMap);
    } catch (err) {
      setCryptoError(err.message);
    }
  };

  // Handle master password lock: wipe keys and session immediately
  const handleLock = () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}
    setMasterPassword('');
    setIsUnlocked(false);
    setDecryptedMap({});
    setCryptoError(null);
  };

  // Add new statement
  const handleAddStatement = async (plaintext) => {
    if (!masterPassword || !isUnlocked) {
      setCryptoError('Please unlock with your master password first.');
      return;
    }

    try {
      setIsSubmitting(true);
      setApiError(null);

      const envelope = await encryptStatement(plaintext, masterPassword);
      const newStmt = await createStatement(selectedDate, envelope);

      setStatements((prev) => [...prev, newStmt]);
      setDecryptedMap((prev) => ({
        ...prev,
        [newStmt.statement_id]: plaintext,
      }));
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle boolean status (True / False) with custom modal confirmation
  const handleToggleStatus = (statementId, newStatus) => {
    const currentStatusStr = !newStatus ? 'TRUE' : 'FALSE';
    const nextStatusStr = newStatus ? 'TRUE' : 'FALSE';

    setConfirmModalConfig({
      title: 'Change Statement Status',
      message: `Are you sure you want to change this statement from ${currentStatusStr} to ${nextStatusStr}?`,
      confirmText: `Change to ${nextStatusStr}`,
      confirmVariant: newStatus ? 'primary' : 'danger',
      onConfirm: async () => {
        setConfirmModalConfig(null);
        try {
          const updatedStmt = await toggleStatementStatus(statementId, newStatus);
          setStatements((prev) =>
            prev.map((s) => (s.statement_id === statementId ? updatedStmt : s))
          );
        } catch (err) {
          setApiError(err.message);
        }
      },
    });
  };

  // Edit statement content (creates a new version)
  const handleEditContent = async (statementId, newPlaintext) => {
    if (!masterPassword || !isUnlocked) {
      setCryptoError('Please unlock with your master password to edit statements.');
      return;
    }

    try {
      const newEnvelope = await encryptStatement(newPlaintext, masterPassword);
      const updatedStmt = await updateStatementContent(statementId, newEnvelope);

      setStatements((prev) =>
        prev.map((s) => (s.statement_id === statementId ? updatedStmt : s))
      );
      setDecryptedMap((prev) => ({
        ...prev,
        [statementId]: newPlaintext,
      }));
    } catch (err) {
      setApiError(err.message);
    }
  };

  // Soft delete statement with custom modal confirmation
  const handleDelete = (statementId) => {
    setConfirmModalConfig({
      title: 'Delete Statement',
      message:
        'Are you sure you want to delete this statement? This will soft-delete the statement and hide it from the active list while preserving audit history.',
      confirmText: 'Delete Statement',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModalConfig(null);
        try {
          await deleteStatement(statementId);
          setStatements((prev) => prev.filter((s) => s.statement_id !== statementId));
          setDecryptedMap((prev) => {
            const copy = { ...prev };
            delete copy[statementId];
            return copy;
          });
        } catch (err) {
          setApiError(err.message);
        }
      },
    });
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'} flex flex-col font-sans transition-colors`}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isUnlocked={isUnlocked}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      <main className="max-w-5xl w-full mx-auto px-4 py-6 flex-1 space-y-6">
        {/* Master Password Bar */}
        <MasterPasswordBar
          isUnlocked={isUnlocked}
          onUnlock={handleUnlock}
          onLock={handleLock}
          error={cryptoError}
        />

        {apiError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400 font-medium">
            API Error: {apiError}
          </div>
        )}

        {/* Statements Tab */}
        {activeTab === 'statements' && (
          <div className="space-y-6">
            {/* Date Navigation */}
            <DateNavigation
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />

            {/* Add Statement Form */}
            <StatementForm
              onAddStatement={handleAddStatement}
              isUnlocked={isUnlocked}
              isSubmitting={isSubmitting}
            />

            {/* List of Statements */}
            {isLoading ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center text-xs text-gray-500 dark:text-gray-400">
                Loading statements for {selectedDate}...
              </div>
            ) : (
              <StatementList
                statements={statements}
                decryptedMap={decryptedMap}
                isUnlocked={isUnlocked}
                onToggleStatus={handleToggleStatus}
                onEditContent={handleEditContent}
                onDelete={handleDelete}
                onViewHistory={(id) => setHistoryStatementId(id)}
              />
            )}
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <SummaryView
            onSelectDate={(dateStr) => {
              setSelectedDate(dateStr);
              setActiveTab('statements');
            }}
          />
        )}

        {/* Activity Log Tab */}
        {activeTab === 'activity' && <ActivityLogView />}
      </main>

      {/* Version History Modal */}
      {historyStatementId && (
        <VersionHistoryModal
          statementId={historyStatementId}
          masterPassword={masterPassword}
          onClose={() => setHistoryStatementId(null)}
        />
      )}

      {/* Custom Confirmation Modal */}
      {confirmModalConfig && (
        <ConfirmModal
          isOpen={Boolean(confirmModalConfig)}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmText={confirmModalConfig.confirmText}
          confirmVariant={confirmModalConfig.confirmVariant}
          onConfirm={confirmModalConfig.onConfirm}
          onCancel={() => setConfirmModalConfig(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-4 text-center text-xs text-gray-400 dark:text-gray-500">
        <span className="font-bold text-gray-700 dark:text-gray-300">false</span> — a statement tracker • AES-256-GCM Client-Side Encrypted
      </footer>

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
}
export default App;
