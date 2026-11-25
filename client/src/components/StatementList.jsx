import React from 'react';
import { StatementItem } from './StatementItem';
import { FileQuestion } from 'lucide-react';

export function StatementList({
  statements,
  decryptedMap,
  isUnlocked,
  onToggleStatus,
  onEditContent,
  onDelete,
  onViewHistory,
}) {
  if (statements.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-800 p-8 text-center shadow-xs transition-colors">
        <FileQuestion className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">No statements for this date</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
          Add your first statement above. It will be encrypted client-side and saved with status TRUE by default.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {statements.map((statement) => (
        <StatementItem
          key={statement.statement_id}
          statement={statement}
          decryptedContent={decryptedMap[statement.statement_id]}
          isUnlocked={isUnlocked}
          onToggleStatus={onToggleStatus}
          onEditContent={onEditContent}
          onDelete={onDelete}
          onViewHistory={onViewHistory}
        />
      ))}
    </div>
  );
}
