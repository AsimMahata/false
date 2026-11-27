import express from 'express';
import {
  getStatementsByDate,
  createStatement,
  updateStatementContent,
  toggleStatementStatus,
  deleteStatement,
  getStatementHistory,
  getStatementSummary,
} from '../controllers/statementController.js';
import {
  getDiaryEntriesByDate,
  getDiaryDates,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
  getDiaryHistory,
  getDiarySummary,
} from '../controllers/diaryController.js';
import { getActivityLogs } from '../controllers/activityLogController.js';

export const router = express.Router();

// Summary statistics endpoint (placed before :id param routes)
router.get('/statements/summary', getStatementSummary);

// Statement endpoints
router.get('/statements', getStatementsByDate);
router.post('/statements', createStatement);
router.put('/statements/:id', updateStatementContent);
router.patch('/statements/:id/status', toggleStatementStatus);
router.delete('/statements/:id', deleteStatement);
router.get('/statements/:id/history', getStatementHistory);

// Diary endpoints (fixed routes before parameterized routes)
router.get('/diary/dates', getDiaryDates);
router.get('/diary/summary', getDiarySummary);
router.get('/diary', getDiaryEntriesByDate);
router.post('/diary', createDiaryEntry);
router.put('/diary/:id', updateDiaryEntry);
router.delete('/diary/:id', deleteDiaryEntry);
router.get('/diary/:id/history', getDiaryHistory);

// Activity logs endpoints
router.get('/activity-logs', getActivityLogs);
