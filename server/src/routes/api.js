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

// Activity logs endpoints
router.get('/activity-logs', getActivityLogs);
