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
      status: true, // Behavior 1: newly created statement has status = true by default
      deleted: false,
      current_version: 'v1',
      content,
      versions: [initialVersion],
      created_at: now,
      updated_at: now,
    });

    await statement.save();

    // Log ADD action: Logging Rules say "ADD -> statement_id only"
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

    // Determine next version identifier
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

    // Log EDIT action: Logging Rules say "EDIT -> statement_id and new version identifier (v1, v2, v3...)"
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
 * Constraint: Does NOT create a new version when only the status changes.
 */
export async function toggleStatementStatus(req, res) {
  try {
    const { id } = req.params;
    const statement = await Statement.findOne({ statement_id: id, deleted: false });

    if (!statement) {
      return res.status(404).json({ error: 'Statement not found or has been deleted.' });
    }

    // Toggle or take explicitly provided boolean
    const newStatus = typeof req.body.status === 'boolean' ? req.body.status : !statement.status;
    const now = new Date();

    statement.status = newStatus;
    statement.updated_at = now;

    await statement.save();

    // Log CHANGE_STATUS action: Logging Rules say "CHANGE_STATUS -> statement_id and new Boolean status"
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

    // Log DELETE action: Logging Rules say "DELETE -> statement_id only"
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
