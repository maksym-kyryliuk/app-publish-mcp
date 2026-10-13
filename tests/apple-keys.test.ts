import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { AppleClient } from '../src/apple/client.js';

function withKeys<T>(names: string[], run: (paths: Record<string, string>) => Promise<T> | T) {
  const directory = mkdtempSync(join(tmpdir(), 'app-publish-keys-'));
  const paths: Record<string, string> = {};
  for (const name of names) {
    const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    paths[name] = join(directory, `${name}.p8`);
    writeFileSync(paths[name], privateKey.export({ type: 'pkcs8', format: 'pem' }));
  }
  return Promise.resolve(run(paths)).finally(() => rmSync(directory, { recursive: true, force: true }));
}

test('Apple tokens are backdated so a fast local clock does not cause 401s', () => withKeys(['main'], paths => {
  const client = new AppleClient({ keyId: 'MAIN', issuerId: 'issuer', p8Path: paths.main });
  const payload = jwt.decode((client as any).getToken()) as jwt.JwtPayload;
  const now = Math.floor(Date.now() / 1000);
  assert.ok(payload.iat! <= now - 30, 'iat must be in the past');
  assert.ok(payload.exp! > now + 60, 'token must stay valid for a while');
  assert.ok(payload.exp! - payload.iat! <= 20 * 60, 'Apple rejects lifetimes over 20 minutes');
}));
