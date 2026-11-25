import React, { useState, useEffect } from 'react';
import { X, History, Clock, Lock } from 'lucide-react';
import { fetchStatementHistory } from '../api';
import { decryptStatement } from '../crypto/statementCrypto';

export function VersionHistoryModal({ statementId, masterPassword, onClose }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [decryptedVersions, setDecryptedVersions] = useState({});

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        const data = await fetchStatementHistory(statementId);
        setHistory(data);

        if (masterPassword && data.versions) {
          const map = {};
          for (const ver of data.versions) {
            try {
              const text = await decryptStatement(ver.content, masterPassword);
              map[ver.version] = text;
            } catch (err) {
              map[ver.version] = `[Decryption Error: ${err.message}]`;
            }
          }
          setDecryptedVersions(map);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (statementId) {
      loadHistory();
    }
  }, [statementId, masterPassword]);

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-xl border border-gray-200 dark:border-gray-800 transition-colors">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Version History</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">Statement: {statementId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {loading && (
            <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
              Loading version history...
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {!loading && history && history.versions && (
            <div className="relative border-l-2 border-gray-200 dark:border-gray-800 ml-3 space-y-5">
              {history.versions.map((ver) => {
                const isLatest = ver.version === history.current_version;
                const decrypted = decryptedVersions[ver.version];

                return (
                  <div key={ver.version} className="relative pl-6">
                    <div
                      className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center ${
                        isLatest ? 'bg-gray-900 dark:bg-emerald-500' : 'bg-gray-400 dark:bg-gray-600'
                      }`}
                    />

                    <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 border border-gray-200 dark:border-gray-700/60">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                            {ver.version}
                          </span>
                          {isLatest && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{formatDateTime(ver.created_at)}</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-800 dark:text-gray-200 mt-2 font-normal leading-relaxed">
                        {masterPassword ? (
                          decrypted || (
                            <span className="italic text-gray-400 dark:text-gray-500">Decrypting...</span>
                          )
                        ) : (
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 italic">
                            <Lock className="w-3.5 h-3.5 text-gray-400" />
                            <span>[Content Encrypted - Master password required]</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
