import React, { useState, useEffect } from 'react';
import { History, RefreshCw, Plus, Trash2, Edit3, ToggleLeft } from 'lucide-react';
import { fetchActivityLogs } from '../api';

export function ActivityLogView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchActivityLogs();
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const formatTimestamp = (isoString) => {
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

  const getActionBadge = (action) => {
    switch (action) {
      case 'ADD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Plus className="w-3 h-3" /> ADD
          </span>
        );
      case 'EDIT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Edit3 className="w-3 h-3" /> EDIT
          </span>
        );
      case 'CHANGE_STATUS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <ToggleLeft className="w-3 h-3" /> CHANGE_STATUS
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <Trash2 className="w-3 h-3" /> DELETE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
            {action}
          </span>
        );
    }
  };

  const renderMetadata = (action, metadata) => {
    if (!metadata || Object.keys(metadata).length === 0) {
      return <span className="text-gray-400 dark:text-gray-500 text-xs italic">—</span>;
    }

    if (action === 'EDIT' && metadata.version) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
          version: {metadata.version}
        </span>
      );
    }

    if (action === 'CHANGE_STATUS' && typeof metadata.status === 'boolean') {
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide ${
            metadata.status
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
          }`}
        >
          status: {String(metadata.status)}
        </span>
      );
    }

    return (
      <code className="text-[11px] font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
        {JSON.stringify(metadata)}
      </code>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-800/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-emerald-600 text-white flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Activity Audit Trail</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Minimal append-only log. Never stores statement content.
            </p>
          </div>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Log
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400">
          Failed to load activity logs: {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Log ID</th>
              <th className="py-3 px-4">Statement ID</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Metadata</th>
              <th className="py-3 px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400 dark:text-gray-500">
                  Loading activity logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400 dark:text-gray-500">
                  No activity recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.log_id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-400">
                    {log.log_id.slice(0, 16)}...
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-800 dark:text-gray-200 font-medium">
                    {log.statement_id.slice(0, 16)}...
                  </td>
                  <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                  <td className="py-3 px-4">{renderMetadata(log.action, log.metadata)}</td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 font-medium">
                    {formatTimestamp(log.timestamp)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
