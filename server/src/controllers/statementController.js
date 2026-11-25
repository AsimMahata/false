import { v4 as uuidv4 } from 'uuid';
import { Statement } from '../models/Statement.js';
import { ActivityLog } from '../models/ActivityLog.js';

/**
 * Validate that an object looks like a valid encrypted envelope
 */
function isValidEnvelope(envelope) {
  return (
    envelope &&
    typeof envelope === 'object' &&
    envelope.version !== undefined &&
    typeof envelope.algorithm === 'string' &&
    typeof envelope.kdf === 'string' &&
    typeof envelope.iterations === 'number' &&
    typeof envelope.salt === 'string' &&
    typeof envelope.nonce === 'string' &&
    typeof envelope.ciphertext === 'string' &&
    typeof envelope.tag === 'string'
  );
}

/**
 * GET /api/statements?date=YYYY-MM-DD
 * Get all non-deleted statements for a specific date
 */
export async function getStatementsByDate(req, res) {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date query parameter is required (format: YYYY-MM-DD).' });
    }

    const statements = await Statement.find({
      date,
      deleted: false,
    }).sort({ created_at: 1 });

    res.json(statements);
  } catch (error) {
    console.error('Error fetching statements:', error);
    res.status(500).json({ error: 'Failed to fetch statements.' });
  }
}

/**
 * POST /api/statements
 * Create a new statement. Default status is true, initial version is v1.
 */
export async function createStatement(req, res) {
  try {
    const { date, content } = req.body;

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Valid date is required in YYYY-MM-DD format.' });
    }

    if (!isValidEnvelope(content)) {
      return res.status(400).json({
        error: 'Invalid content format. Content must be an encrypted envelope adhering to Version 1.',
      });
    }

    const statementId = `stmt_${uuidv4()}`;
    const logId = `log_${uuidv4()}`;
    const now = new Date();

    const initialVersion = {
      version: 'v1',
      content,
      created_at: now,
    };

    const statement = new Statement({
      statement_id: statementId,
      date,
      status: true,
      deleted: false,
      current_version: 'v1',
      content,
      versions: [initialVersion],
      created_at: now,
      updated_at: now,
    });

    await statement.save();

    const log = new ActivityLog({
      log_id: logId,
      statement_id: statementId,
      action: 'ADD',
      metadata: {},
      timestamp: now,
    });

    await log.save();

    res.status(201).json(statement);
  } catch (error) {
    console.error('Error creating statement:', error);
    res.status(500).json({ error: 'Failed to create statement.' });
  }
}

/**
 * PUT /api/statements/:id
 * Edit a statement's content. Creates a new version (v2, v3, etc.)
 */
export async function updateStatementContent(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!isValidEnvelope(content)) {
      return res.status(400).json({
        error: 'Invalid content format. Content must be an encrypted envelope adhering to Version 1.',
      });
    }

    const statement = await Statement.findOne({ statement_id: id, deleted: false });
    if (!statement) {
      return res.status(404).json({ error: 'Statement not found or has been deleted.' });
    }

    const currentVersionNum = parseInt(statement.current_version.replace(/^v/, ''), 10) || statement.versions.length;
    const nextVersionId = `v${currentVersionNum + 1}`;
    const now = new Date();

    const newVersion = {
      version: nextVersionId,
      content,
      created_at: now,
    };

    statement.versions.push(newVersion);
    statement.current_version = nextVersionId;
    statement.content = content;
    statement.updated_at = now;

    await statement.save();

    const log = new ActivityLog({
      log_id: `log_${uuidv4()}`,
      statement_id: statement.statement_id,
      action: 'EDIT',
      metadata: { version: nextVersionId },
      timestamp: now,
    });

    await log.save();

    res.json(statement);
  } catch (error) {
    console.error('Error updating statement content:', error);
    res.status(500).json({ error: 'Failed to update statement.' });
  }
}

/**
 * PATCH /api/statements/:id/status
 * Toggle or update the boolean status.
 */
export async function toggleStatementStatus(req, res) {
  try {
    const { id } = req.params;
    const statement = await Statement.findOne({ statement_id: id, deleted: false });

    if (!statement) {
      return res.status(404).json({ error: 'Statement not found or has been deleted.' });
    }

    const newStatus = typeof req.body.status === 'boolean' ? req.body.status : !statement.status;
    const now = new Date();

    statement.status = newStatus;
    statement.updated_at = now;

    await statement.save();

    const log = new ActivityLog({
      log_id: `log_${uuidv4()}`,
      statement_id: statement.statement_id,
      action: 'CHANGE_STATUS',
      metadata: { status: newStatus },
      timestamp: now,
    });

    await log.save();

    res.json(statement);
  } catch (error) {
    console.error('Error toggling statement status:', error);
    res.status(500).json({ error: 'Failed to change statement status.' });
  }
}

/**
 * DELETE /api/statements/:id
 * Soft delete the statement. Never physically remove from database.
 */
export async function deleteStatement(req, res) {
  try {
    const { id } = req.params;
    const statement = await Statement.findOne({ statement_id: id, deleted: false });

    if (!statement) {
      return res.status(404).json({ error: 'Statement not found or already deleted.' });
    }

    const now = new Date();
    statement.deleted = true;
    statement.updated_at = now;

    await statement.save();

    const log = new ActivityLog({
      log_id: `log_${uuidv4()}`,
      statement_id: statement.statement_id,
      action: 'DELETE',
      metadata: {},
      timestamp: now,
    });

    await log.save();

    res.json({ success: true, statement_id: id });
  } catch (error) {
    console.error('Error deleting statement:', error);
    res.status(500).json({ error: 'Failed to delete statement.' });
  }
}

/**
 * GET /api/statements/:id/history
 * Return version history for a statement
 */
export async function getStatementHistory(req, res) {
  try {
    const { id } = req.params;
    const statement = await Statement.findOne({ statement_id: id });

    if (!statement) {
      return res.status(404).json({ error: 'Statement not found.' });
    }

    res.json({
      statement_id: statement.statement_id,
      date: statement.date,
      status: statement.status,
      deleted: statement.deleted,
      current_version: statement.current_version,
      versions: statement.versions,
    });
  } catch (error) {
    console.error('Error fetching statement history:', error);
    res.status(500).json({ error: 'Failed to fetch statement history.' });
  }
}

/**
 * GET /api/statements/summary
 * Aggregate statements date-wise, month-wise, year-wise, and all-time with True/False ratios.
 */
export async function getStatementSummary(req, res) {
  try {
    const activeStatements = await Statement.find({ deleted: false }, { date: 1, status: 1, created_at: 1 });

    const dailyMap = {};
    const monthlyMap = {};
    const yearlyMap = {};

    let totalAllTime = 0;
    let trueAllTime = 0;
    let falseAllTime = 0;

    for (const stmt of activeStatements) {
      const date = stmt.date; // YYYY-MM-DD
      const month = date.slice(0, 7); // YYYY-MM
      const year = date.slice(0, 4); // YYYY
      const isTrue = Boolean(stmt.status);

      totalAllTime++;
      if (isTrue) trueAllTime++;
      else falseAllTime++;

      // Daily
      if (!dailyMap[date]) {
        dailyMap[date] = { total: 0, trueCount: 0, falseCount: 0 };
      }
      dailyMap[date].total++;
      if (isTrue) dailyMap[date].trueCount++;
      else dailyMap[date].falseCount++;

      // Monthly
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, total: 0, trueCount: 0, falseCount: 0 };
      }
      monthlyMap[month].total++;
      if (isTrue) monthlyMap[month].trueCount++;
      else monthlyMap[month].falseCount++;

      // Yearly
      if (!yearlyMap[year]) {
        yearlyMap[year] = { year, total: 0, trueCount: 0, falseCount: 0 };
      }
      yearlyMap[year].total++;
      if (isTrue) yearlyMap[year].trueCount++;
      else yearlyMap[year].falseCount++;
    }

    // Compute ratios
    const computeRatio = (trueCount, falseCount) => {
      const total = trueCount + falseCount;
      if (total === 0) return { truePct: 0, falsePct: 0, ratioStr: 'N/A' };
      const truePct = Math.round((trueCount / total) * 100);
      const falsePct = 100 - truePct;
      return { truePct, falsePct, ratioStr: `${trueCount}T / ${falseCount}F` };
    };

    // Format daily
    const daily = {};
    for (const [d, v] of Object.entries(dailyMap)) {
      daily[d] = {
        ...v,
        ...computeRatio(v.trueCount, v.falseCount),
      };
    }

    // Format monthly (sorted descending)
    const monthly = Object.values(monthlyMap)
      .map((m) => ({
        ...m,
        ...computeRatio(m.trueCount, m.falseCount),
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    // Format yearly (sorted descending)
    const yearly = Object.values(yearlyMap)
      .map((y) => ({
        ...y,
        ...computeRatio(y.trueCount, y.falseCount),
      }))
      .sort((a, b) => b.year.localeCompare(a.year));

    res.json({
      allTime: {
        total: totalAllTime,
        trueCount: trueAllTime,
        falseCount: falseAllTime,
        ...computeRatio(trueAllTime, falseAllTime),
      },
      daily,
      monthly,
      yearly,
    });
  } catch (error) {
    console.error('Error calculating statement summary:', error);
    res.status(500).json({ error: 'Failed to calculate summary.' });
  }
}
