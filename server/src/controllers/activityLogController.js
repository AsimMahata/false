import { ActivityLog } from '../models/ActivityLog.js';

/**
 * GET /api/activity-logs
 * Fetch recent activity logs. Shows most recent activity first.
 */
export async function getActivityLogs(req, res) {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs.' });
  }
}
