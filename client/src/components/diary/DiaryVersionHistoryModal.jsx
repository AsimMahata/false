import React, { useState, useEffect } from 'react';
import { X, History, Clock, Lock, Sparkles, BookOpen } from 'lucide-react';
import { fetchDiaryHistory } from '../../api';
import { decryptStatement } from '../../crypto/statementCrypto';
import { BBCodeRenderer } from './BBCodeRenderer';

export function DiaryVersionHistoryModal({
  entryId,
  masterPassword,
  onClose,
  fontSizeClass = 'diary-handwriting-normal',
}) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [decryptedVersions, setDecryptedVersions] = useState({});

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        const data = await fetchDiaryHistory(entryId);
        const versionList = Array.isArray(data) ? data : data.versions || [];
        const currentVer = Array.isArray(data)
          ? data[data.length - 1]?.version
          : data.current_version;
        setHistory({ versions: versionList, current_version: currentVer });

        if (masterPassword && versionList.length > 0) {
          const map = {};
          for (const ver of versionList) {
            try {
              const text = await decryptStatement(ver.content, masterPassword);
              // Parse title/mood/body if JSON
              try {
                const parsed = JSON.parse(text);
                map[ver.version] = parsed;
              } catch {
                map[ver.version] = { body: text, mood: '☕ Calm', title: '' };
              }
            } catch (err) {
              map[ver.version] = {
                error: `[Decryption Error: ${err.message}]`,
                body: '',
              };
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

    if (entryId) {
      loadHistory();
    }
  }, [entryId, masterPassword]);

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
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800 transition-colors">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Diary Version History
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Entry ID: {entryId}
              </p>
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
            <div className="text-center py-10 text-sm text-gray-500 dark:text-gray-400">
              Loading diary revisions...
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {!loading && history && history.versions && (
            <div className="relative border-l-2 border-amber-300 dark:border-amber-900/60 ml-3 space-y-6">
              {history.versions.map((ver) => {
                const isLatest = ver.version === history.current_version;
                const dec = decryptedVersions[ver.version];

                return (
                  <div key={ver.version} className="relative pl-6">
                    {/* Timeline bullet */}
                    <div
                      className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center ${
                        isLatest
                          ? 'bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-900'
                          : 'bg-gray-400 dark:bg-gray-600'
                      }`}
                    />

                    <div className="bg-amber-50/40 dark:bg-gray-800/60 rounded-xl p-4 border border-amber-200/80 dark:border-gray-700/60 shadow-2xs">
                      {/* Version Tag & Timestamp */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                            {ver.version}
                          </span>
                          {isLatest && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              Current Version
                            </span>
                          )}
                          {dec?.mood && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100/60 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                              {dec.mood}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{formatDateTime(ver.created_at)}</span>
                        </div>
                      </div>

                      {/* Decrypted Version Content */}
                      <div className="mt-2">
                        {masterPassword ? (
                          dec ? (
                            dec.error ? (
                              <div className="text-xs text-rose-600 dark:text-rose-400 font-mono">
                                {dec.error}
                              </div>
                            ) : (
                              <div className="p-4 rounded-xl diary-paper text-[#2c2724] border border-amber-200/80 overflow-hidden">
                                {dec.title && (
                                  <h4 className="font-caveat font-bold text-lg text-amber-950 mb-2">
                                    {dec.title}
                                  </h4>
                                )}
                                <div className={`${fontSizeClass} text-[#2c2724]`}>
                                  <BBCodeRenderer text={dec.body} />
                                </div>
                              </div>
                            )
                          ) : (
                            <span className="italic text-xs text-gray-400">Decrypting...</span>
                          )
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 italic py-2">
                            <Lock className="w-4 h-4 text-amber-500" />
                            <span>[Content Encrypted — Master password required]</span>
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

export default DiaryVersionHistoryModal;
