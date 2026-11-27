import { v4 as uuidv4 } from 'uuid';
import { DiaryEntry } from '../models/DiaryEntry.js';
import { ActivityLog } from '../models/ActivityLog.js';

/**
 * Validate that an object looks like a valid encrypted envelope (Version 1)
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
 * GET /api/diary?date=YYYY-MM-DD
 * Get all non-deleted diary entries for a specific date sorted by created_at ascending
 */
export async function getDiaryEntriesByDate(req, res) {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date query parameter is required (format: YYYY-MM-DD).' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD.' });
    }

    const entries = await DiaryEntry.find({
      date,
      deleted: false,
    }).sort({ created_at: 1 });

    res.json(entries);
  } catch (error) {
    console.error('Error fetching diary entries by date:', error);
    res.status(500).json({ error: 'Failed to fetch diary entries.' });
  }
}

/**
 * GET /api/diary/dates
 * Get distinct array of dates that have active (non-deleted) diary entries
 */
export async function getDiaryDates(req, res) {
  try {
    const dates = await DiaryEntry.distinct('date', { deleted: false });
    res.json(dates.sort());
  } catch (error) {
    console.error('Error fetching diary dates:', error);
    res.status(500).json({ error: 'Failed to fetch diary dates.' });
  }
}

/**
 * POST /api/diary
 * Create a new diary entry. Body: { date, content }
 */
export async function createDiaryEntry(req, res) {
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

    const entryId = `diary_${uuidv4()}`;
    const logId = `log_${uuidv4()}`;
    const now = new Date();

    const initialVersion = {
      version: 'v1',
      content,
      created_at: now,
    };

    const diaryEntry = new DiaryEntry({
      entry_id: entryId,
      date,
      deleted: false,
      current_version: 'v1',
      content,
      versions: [initialVersion],
      created_at: now,
      updated_at: now,
    });

    await diaryEntry.save();

    const log = new ActivityLog({
      log_id: logId,
      statement_id: entryId,
      entry_id: entryId,
      action: 'ADD_DIARY',
      metadata: { date },
      timestamp: now,
    });

    await log.save();

    res.status(201).json(diaryEntry);
  } catch (error) {
    console.error('Error creating diary entry:', error);
    res.status(500).json({ error: 'Failed to create diary entry.' });
  }
}

/**
 * PUT /api/diary/:id
 * Edit a diary entry's content. Archives current version, bumps version to v2, v3, etc.
 */
export async function updateDiaryEntry(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!isValidEnvelope(content)) {
      return res.status(400).json({
        error: 'Invalid content format. Content must be an encrypted envelope adhering to Version 1.',
      });
    }

    const diary = await DiaryEntry.findOne({ entry_id: id, deleted: false });
    if (!diary) {
      return res.status(404).json({ error: 'Diary entry not found or has been deleted.' });
    }

    const currentVersionNum = parseInt(diary.current_version.replace(/^v/, ''), 10) || diary.versions.length;
    const nextVersionId = `v${currentVersionNum + 1}`;
    const now = new Date();

    const newVersion = {
      version: nextVersionId,
      content,
      created_at: now,
    };

    diary.versions.push(newVersion);
    diary.current_version = nextVersionId;
    diary.content = content;
    diary.updated_at = now;

    await diary.save();

    const log = new ActivityLog({
      log_id: `log_${uuidv4()}`,
      statement_id: diary.entry_id,
      entry_id: diary.entry_id,
      action: 'EDIT_DIARY',
      metadata: { version: nextVersionId, date: diary.date },
      timestamp: now,
    });

    await log.save();

    res.json(diary);
  } catch (error) {
    console.error('Error updating diary entry:', error);
    res.status(500).json({ error: 'Failed to update diary entry.' });
  }
}

/**
 * DELETE /api/diary/:id
 * Soft delete diary entry.
 */
export async function deleteDiaryEntry(req, res) {
  try {
    const { id } = req.params;
    const diary = await DiaryEntry.findOne({ entry_id: id, deleted: false });

    if (!diary) {
      return res.status(404).json({ error: 'Diary entry not found or already deleted.' });
    }

    const now = new Date();
    diary.deleted = true;
    diary.updated_at = now;

    await diary.save();

    const log = new ActivityLog({
      log_id: `log_${uuidv4()}`,
      statement_id: diary.entry_id,
      entry_id: diary.entry_id,
      action: 'DELETE_DIARY',
      metadata: { date: diary.date },
      timestamp: now,
    });

    await log.save();

    res.json({ success: true, entry_id: id });
  } catch (error) {
    console.error('Error deleting diary entry:', error);
    res.status(500).json({ error: 'Failed to delete diary entry.' });
  }
}

/**
 * GET /api/diary/:id/history
 * Return versions array for a diary entry
 */
export async function getDiaryHistory(req, res) {
  try {
    const { id } = req.params;
    const diary = await DiaryEntry.findOne({ entry_id: id });

    if (!diary) {
      return res.status(404).json({ error: 'Diary entry not found.' });
    }

    res.json(diary.versions);
  } catch (error) {
    console.error('Error fetching diary history:', error);
    res.status(500).json({ error: 'Failed to fetch diary history.' });
  }
}

/**
 * GET /api/diary/summary
 * Return summary statistics: total active entries, unique days with entries, total edits
 */
export async function getDiarySummary(req, res) {
  try {
    const activeEntries = await DiaryEntry.find(
      { deleted: false },
      { date: 1, current_version: 1, versions: 1 }
    );

    const totalActive = activeEntries.length;
    const uniqueDaysSet = new Set(activeEntries.map((e) => e.date));
    const uniqueDaysCount = uniqueDaysSet.size;

    const totalEdits = activeEntries.reduce((sum, entry) => {
      const vCount = entry.versions ? entry.versions.length : 1;
      return sum + Math.max(0, vCount - 1);
    }, 0);

    res.json({
      totalEntries: totalActive,
      totalActiveEntries: totalActive,
      uniqueDays: uniqueDaysCount,
      uniqueDaysWithEntries: uniqueDaysCount,
      totalEdits: totalEdits,
      total_entries: totalActive,
      unique_days: uniqueDaysCount,
      total_edits: totalEdits,
    });
  } catch (error) {
    console.error('Error fetching diary summary:', error);
    res.status(500).json({ error: 'Failed to fetch diary summary.' });
  }
}
