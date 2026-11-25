import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../server/src/db.js';
import { Statement } from '../server/src/models/Statement.js';
import { ActivityLog } from '../server/src/models/ActivityLog.js';
import {
  createStatement,
  getStatementsByDate,
  updateStatementContent,
  toggleStatementStatus,
  deleteStatement,
  getStatementHistory,
} from '../server/src/controllers/statementController.js';
import { getActivityLogs } from '../server/src/controllers/activityLogController.js';
import { encryptStatement } from '../client/src/crypto/statementCrypto.js';

let mongod;
const masterPassword = 'MyMasterPassword2026!';

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

describe('Backend API & MongoDB Integration Tests', () => {
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

  let createdStatementId = null;
  const testDate = '2026-11-25';

  it('Requirement 2 & 11: Creates a statement with status=true by default and creates an ADD log', async () => {
    const encryptedContent = await encryptStatement('Initial statement v1', masterPassword);

    const req = {
      body: {
        date: testDate,
        content: encryptedContent,
      },
    };
    const res = mockRes();

    await createStatement(req, res);

    assert.equal(res.statusCode, 201);
    assert.ok(res.body.statement_id.startsWith('stmt_'));
    assert.equal(res.body.date, testDate);
    assert.equal(res.body.status, true, 'Default status must be true');
    assert.equal(res.body.deleted, false, 'Default deleted must be false');
    assert.equal(res.body.current_version, 'v1');
    assert.equal(res.body.versions.length, 1);
    assert.equal(res.body.versions[0].version, 'v1');

    createdStatementId = res.body.statement_id;

    // Check Activity Log for ADD
    const logs = await ActivityLog.find({ statement_id: createdStatementId });
    assert.equal(logs.length, 1);
    assert.equal(logs[0].action, 'ADD');
    assert.deepEqual(logs[0].metadata, {});
    // Verify no content in activity log!
    assert.equal(logs[0].metadata.content, undefined);
    assert.equal(logs[0].metadata.ciphertext, undefined);
  });

  it('Requirement 3: Retrieves non-deleted statements by date', async () => {
    const req = { query: { date: testDate } };
    const res = mockRes();

    await getStatementsByDate(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].statement_id, createdStatementId);
  });

  it('Requirement 2 & 5: Editing creates a new version v2 and logs EDIT with version identifier', async () => {
    const newContent = await encryptStatement('Edited statement v2', masterPassword);

    const req = {
      params: { id: createdStatementId },
      body: { content: newContent },
    };
    const res = mockRes();

    await updateStatementContent(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.current_version, 'v2');
    assert.equal(res.body.versions.length, 2);
    assert.equal(res.body.versions[0].version, 'v1');
    assert.equal(res.body.versions[1].version, 'v2');

    // Check Activity Log for EDIT
    const logs = await ActivityLog.find({ statement_id: createdStatementId, action: 'EDIT' });
    assert.equal(logs.length, 1);
    assert.equal(logs[0].metadata.version, 'v2');
    assert.equal(logs[0].metadata.content, undefined);
  });

  it('Requirement 2 & 5: Status change updates status WITHOUT creating a new version and logs CHANGE_STATUS', async () => {
    const req = {
      params: { id: createdStatementId },
      body: { status: false },
    };
    const res = mockRes();

    await toggleStatementStatus(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, false);
    // Crucial check: Version must NOT have changed!
    assert.equal(res.body.current_version, 'v2');
    assert.equal(res.body.versions.length, 2);

    // Check Activity Log for CHANGE_STATUS
    const logs = await ActivityLog.find({ statement_id: createdStatementId, action: 'CHANGE_STATUS' });
    assert.equal(logs.length, 1);
    assert.equal(logs[0].metadata.status, false);
  });

  it('Requirement 2: Soft delete marks deleted=true and hides from list without physical deletion', async () => {
    const req = { params: { id: createdStatementId } };
    const res = mockRes();

    await deleteStatement(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);

    // Verify still in database physically
    const dbDoc = await Statement.findOne({ statement_id: createdStatementId });
    assert.ok(dbDoc !== null, 'Statement must NOT be physically deleted');
    assert.equal(dbDoc.deleted, true);

    // Verify does NOT appear in normal statement list for that date
    const listReq = { query: { date: testDate } };
    const listRes = mockRes();
    await getStatementsByDate(listReq, listRes);
    assert.equal(listRes.body.length, 0);

    // Check Activity Log for DELETE
    const logs = await ActivityLog.find({ statement_id: createdStatementId, action: 'DELETE' });
    assert.equal(logs.length, 1);
  });

  it('Requirement 6: Fetches activity logs ordered by most recent first', async () => {
    const req = { query: {} };
    const res = mockRes();

    await getActivityLogs(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body.length, 4); // ADD, EDIT, CHANGE_STATUS, DELETE
    // Most recent is DELETE
    assert.equal(res.body[0].action, 'DELETE');
    assert.equal(res.body[1].action, 'CHANGE_STATUS');
    assert.equal(res.body[2].action, 'EDIT');
    assert.equal(res.body[3].action, 'ADD');
  });
});
