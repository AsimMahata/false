import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encryptStatement, decryptStatement } from '../client/src/crypto/statementCrypto.js';

describe('Statement Client-Side Encryption (Version 1)', () => {
  const masterPassword = 'TestSuperSecretMasterPassword!2026';
  const sampleStatement = 'The project requirements are fully satisfied.';

  it('successfully encrypts and decrypts a statement with valid master password', async () => {
    const envelope = await encryptStatement(sampleStatement, masterPassword);

    // Verify envelope structure
    assert.equal(envelope.version, 1);
    assert.equal(envelope.algorithm, 'AES-256-GCM');
    assert.equal(envelope.kdf, 'PBKDF2-HMAC-SHA256');
    assert.equal(envelope.iterations, 600000);
    assert.ok(typeof envelope.salt === 'string' && envelope.salt.length > 0);
    assert.ok(typeof envelope.nonce === 'string' && envelope.nonce.length > 0);
    assert.ok(typeof envelope.ciphertext === 'string' && envelope.ciphertext.length > 0);
    assert.ok(typeof envelope.tag === 'string' && envelope.tag.length > 0);

    // Decrypt
    const decrypted = await decryptStatement(envelope, masterPassword);
    assert.equal(decrypted, sampleStatement);
  });

  it('generates a fresh random salt and nonce for every encryption', async () => {
    const env1 = await encryptStatement(sampleStatement, masterPassword);
    const env2 = await encryptStatement(sampleStatement, masterPassword);

    assert.notEqual(env1.salt, env2.salt, 'Salts must be randomly generated and unique');
    assert.notEqual(env1.nonce, env2.nonce, 'Nonces must be randomly generated and unique');
    assert.notEqual(env1.ciphertext, env2.ciphertext, 'Ciphertexts must differ due to distinct nonces');

    // Both should decrypt back to the same plaintext
    assert.equal(await decryptStatement(env1, masterPassword), sampleStatement);
    assert.equal(await decryptStatement(env2, masterPassword), sampleStatement);
  });

  it('fails decryption with clear error when given an incorrect master password', async () => {
    const envelope = await encryptStatement(sampleStatement, masterPassword);
    await assert.rejects(
      async () => {
        await decryptStatement(envelope, 'WrongPassword123');
      },
      (err) => {
        assert.ok(err.message.includes('Decryption failed'));
        return true;
      }
    );
  });

  it('detects tampering with ciphertext or authentication tag', async () => {
    const envelope = await encryptStatement(sampleStatement, masterPassword);

    // Tamper with ciphertext by altering characters
    const tamperedCiphertext = envelope.ciphertext.slice(0, -2) + 'AA';
    const tamperedEnvelope = { ...envelope, ciphertext: tamperedCiphertext };

    await assert.rejects(
      async () => {
        await decryptStatement(tamperedEnvelope, masterPassword);
      },
      (err) => {
        assert.ok(err.message.includes('Decryption failed'));
        return true;
      }
    );
  });

  it('rejects envelopes with unsupported metadata', async () => {
    const envelope = await encryptStatement(sampleStatement, masterPassword);

    await assert.rejects(
      async () => {
        await decryptStatement({ ...envelope, algorithm: 'DES-CBC' }, masterPassword);
      },
      /Unsupported encryption algorithm/
    );

    await assert.rejects(
      async () => {
        await decryptStatement({ ...envelope, kdf: 'MD5' }, masterPassword);
      },
      /Unsupported key derivation function/
    );
  });
});
