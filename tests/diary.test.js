import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../server/src/db.js';
import { DiaryEntry } from '../server/src/models/DiaryEntry.js';
import { ActivityLog } from '../server/src/models/ActivityLog.js';
import {
  createDiaryEntry,
  getDiaryEntriesByDate,
  getDiaryDates,
  updateDiaryEntry,
  deleteDiaryEntry,
  getDiaryHistory,
  getDiarySummary,
} from '../server/src/controllers/diaryController.js';
import {
  encryptDiaryEntry,
  decryptDiaryEntry,
  encryptStatement,
  decryptStatement,
} from '../client/src/crypto/statementCrypto.js';

let mongod;
const masterPassword = 'MySecretDiaryPassword2026!';

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

describe('Diary Backend API & Security Integration Tests', () => {
  before(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await connectDB(uri);
  });

  after(async () => {
    await disconnectDB();
    if (mongod) {
      await mongod.stop();
    }
  });

  let createdEntryId = null;
  let secondEntryId = null;
  const testDate = '2026-11-27';
  const secondDate = '2026-11-28';

  const initialEntryData = {
    title: 'First Diary Entry',
    mood: 'reflective',
    body: 'Today was a productive day implementing zero-knowledge encrypted diaries.',
  };

  it('Creates a diary entry with encrypted envelope and logs ADD_DIARY', async () => {
    const encryptedContent = await encryptDiaryEntry(initialEntryData, masterPassword);

    const req = {
      body: {
        date: testDate,
        content: encryptedContent,
      },
    };
    const res = mockRes();

    await createDiaryEntry(req, res);

    assert.equal(res.statusCode, 201);
    assert.ok(res.body.entry_id.startsWith('diary_'));
    assert.equal(res.body.date, testDate);
    assert.equal(res.body.deleted, false);
    assert.equal(res.body.current_version, 'v1');
    assert.equal(res.body.versions.length, 1);
    assert.equal(res.body.versions[0].version, 'v1');

    createdEntryId = res.body.entry_id;

    // Verify ActivityLog entry
    const logs = await ActivityLog.find({ action: 'ADD_DIARY' });
    assert.equal(logs.length, 1);
    assert.equal(logs[0].action, 'ADD_DIARY');
    assert.ok(logs[0].statement_id === createdEntryId || logs[0].entry_id === createdEntryId);
    assert.equal(logs[0].metadata.date, testDate);
    // Verify zero knowledge: no plaintext, content, or ciphertext leaked in metadata
    assert.equal(logs[0].metadata.content, undefined);
    assert.equal(logs[0].metadata.ciphertext, undefined);
    assert.equal(logs[0].metadata.plaintext, undefined);
  });

  it('Fetches diary entries by date sorted by created_at', async () => {
    // Add a second entry for the same date
    const secondEncrypted = await encryptDiaryEntry('Evening reflection', masterPassword);
    const createReq = {
      body: {
        date: testDate,
        content: secondEncrypted,
      },
    };
    const createRes = mockRes();
    await createDiaryEntry(createReq, createRes);
    assert.equal(createRes.statusCode, 201);
    secondEntryId = createRes.body.entry_id;

    const req = { query: { date: testDate } };
    const res = mockRes();

    await getDiaryEntriesByDate(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body.length, 2);
    assert.equal(res.body[0].entry_id, createdEntryId);
    assert.equal(res.body[1].entry_id, secondEntryId);
  });

  it('Updates diary entry content, increments version to v2, preserves history, and logs EDIT_DIARY', async () => {
    const updatedEntryData = {
      title: 'First Diary Entry (Updated)',
      mood: 'accomplished',
      body: 'All backend endpoints and tests are running smoothly.',
    };
    const newEncryptedContent = await encryptDiaryEntry(updatedEntryData, masterPassword);

    const req = {
      params: { id: createdEntryId },
      body: { content: newEncryptedContent },
    };
    const res = mockRes();

    await updateDiaryEntry(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.current_version, 'v2');
    assert.equal(res.body.versions.length, 2);
    assert.equal(res.body.versions[0].version, 'v1');
    assert.equal(res.body.versions[1].version, 'v2');

    // Check ActivityLog for EDIT_DIARY
    const editLogs = await ActivityLog.find({ action: 'EDIT_DIARY' });
    assert.equal(editLogs.length, 1);
    assert.equal(editLogs[0].metadata.version, 'v2');
    assert.equal(editLogs[0].metadata.content, undefined);
    assert.equal(editLogs[0].metadata.ciphertext, undefined);
  });

  it('Fetches diary entry history showing all versions', async () => {
    const req = { params: { id: createdEntryId } };
    const res = mockRes();

    await getDiaryHistory(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body.length, 2);
    assert.equal(res.body[0].version, 'v1');
    assert.equal(res.body[1].version, 'v2');
  });

  it('Fetches diary dates list returning distinct active dates', async () => {
    // Add entry on second date
    const encryptedOnSecondDate = await encryptDiaryEntry('Notes on 28th', masterPassword);
    const createReq = {
      body: {
        date: secondDate,
        content: encryptedOnSecondDate,
      },
    };
    const createRes = mockRes();
    await createDiaryEntry(createReq, createRes);
    assert.equal(createRes.statusCode, 201);

    const req = {};
    const res = mockRes();

    await getDiaryDates(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.includes(testDate));
    assert.ok(res.body.includes(secondDate));
    // Verify distinct
    const uniqueDates = Array.from(new Set(res.body));
    assert.equal(res.body.length, uniqueDates.length);
  });

  it('Soft deletes a diary entry and logs DELETE_DIARY', async () => {
    const req = { params: { id: secondEntryId } };
    const res = mockRes();

    await deleteDiaryEntry(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.entry_id, secondEntryId);

    // Verify still in database physically
    const dbDoc = await DiaryEntry.findOne({ entry_id: secondEntryId });
    assert.ok(dbDoc !== null, 'Diary entry must NOT be physically removed');
    assert.equal(dbDoc.deleted, true);

    // Verify excluded from normal date queries
    const listReq = { query: { date: testDate } };
    const listRes = mockRes();
    await getDiaryEntriesByDate(listReq, listRes);
    assert.equal(listRes.body.length, 1);
    assert.equal(listRes.body[0].entry_id, createdEntryId);

    // Check ActivityLog for DELETE_DIARY
    const deleteLogs = await ActivityLog.find({ action: 'DELETE_DIARY' });
    assert.equal(deleteLogs.length, 1);
  });

  it('Fetches diary summary stats', async () => {
    const req = {};
    const res = mockRes();

    await getDiarySummary(req, res);

    assert.equal(res.statusCode, 200);
    // Active entries: createdEntryId (2026-11-27), secondEntryId is deleted, entry on 2026-11-28 is active -> 2 active entries
    assert.equal(res.body.totalEntries, 2);
    assert.equal(res.body.uniqueDays, 2);
    // Total edits: createdEntryId has 1 edit (v2)
    assert.equal(res.body.totalEdits, 1);
  });

  it('Decrypts stored diary envelopes with the master password', async () => {
    const dbEntry = await DiaryEntry.findOne({ entry_id: createdEntryId });
    assert.ok(dbEntry !== null);

    // Decrypt current version (v2)
    const decryptedCurrent = await decryptDiaryEntry(dbEntry.content, masterPassword);
    assert.equal(typeof decryptedCurrent, 'object');
    assert.equal(decryptedCurrent.title, 'First Diary Entry (Updated)');
    assert.equal(decryptedCurrent.mood, 'accomplished');

    // Decrypt v1 from history
    const v1Content = dbEntry.versions[0].content;
    const decryptedV1 = await decryptDiaryEntry(v1Content, masterPassword);
    assert.equal(typeof decryptedV1, 'object');
    assert.equal(decryptedV1.title, 'First Diary Entry');
    assert.equal(decryptedV1.mood, 'reflective');

    // Also verify decryptStatement works on raw string
    const decryptedRaw = await decryptStatement(v1Content, masterPassword);
    assert.ok(decryptedRaw.includes('First Diary Entry'));
  });

  it('Rejects unencrypted or invalid envelopes with 400', async () => {
    const invalidReqs = [
      { body: { date: testDate, content: 'Plaintext string instead of envelope' } },
      { body: { date: testDate, content: { ciphertext: 'abc' } } }, // missing salt, nonce, etc.
      { body: { date: testDate, content: null } },
      { body: { date: 'invalid-date', content: await encryptDiaryEntry('valid', masterPassword) } },
    ];

    for (const req of invalidReqs) {
      const res = mockRes();
      await createDiaryEntry(req, res);
      assert.equal(res.statusCode, 400);
      assert.ok(res.body.error);
    }

    // Invalid update
    const updateReq = {
      params: { id: createdEntryId },
      body: { content: 'invalid' },
    };
    const updateRes = mockRes();
    await updateDiaryEntry(updateReq, updateRes);
    assert.equal(updateRes.statusCode, 400);
  });

  it('Returns 404 for operations on non-existent diary entries', async () => {
    const fakeId = 'diary_non_existent';
    const validContent = await encryptDiaryEntry('test', masterPassword);

    // Update 404
    const updateRes = mockRes();
    await updateDiaryEntry({ params: { id: fakeId }, body: { content: validContent } }, updateRes);
    assert.equal(updateRes.statusCode, 404);

    // Delete 404
    const deleteRes = mockRes();
    await deleteDiaryEntry({ params: { id: fakeId } }, deleteRes);
    assert.equal(deleteRes.statusCode, 404);

    // History 404
    const historyRes = mockRes();
    await getDiaryHistory({ params: { id: fakeId } }, historyRes);
    assert.equal(historyRes.statusCode, 404);
  });
});
