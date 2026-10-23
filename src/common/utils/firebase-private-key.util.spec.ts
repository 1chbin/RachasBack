import { generateKeyPairSync } from 'crypto';
import { normalizarFirebasePrivateKey } from './firebase-private-key.util';

describe('normalizarFirebasePrivateKey', () => {
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });

  it('acepta PEM con \\n escapados', () => {
    const escaped = privateKey.replace(/\n/g, '\\n');
    const result = normalizarFirebasePrivateKey(`"${escaped}"`);
    expect(result).toContain('-----BEGIN PRIVATE KEY-----');
    expect(result).toContain('-----END PRIVATE KEY-----');
  });

  it('acepta PEM en una sola línea', () => {
    const oneLine = privateKey.replace(/\n/g, '');
    const result = normalizarFirebasePrivateKey(oneLine);
    expect(result.split('\n').length).toBeGreaterThan(2);
  });
});
