import { createPrivateKey } from 'crypto';

const BEGIN_MARKER = '-----BEGIN PRIVATE KEY-----';
const END_MARKER = '-----END PRIVATE KEY-----';

function unwrapQuotes(value: string): string {
  let key = value.trim().replace(/^\uFEFF/, '');
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  return key;
}

function expandEscapedNewlines(value: string): string {
  let key = value.replace(/\r\n/g, '\n');
  let prev = '';
  while (prev !== key) {
    prev = key;
    key = key.replace(/\\n/g, '\n');
  }
  return key;
}

function wrapSingleLinePem(key: string): string {
  if (key.includes('\n') || !key.includes(BEGIN_MARKER)) {
    return key;
  }

  const beginIndex = key.indexOf(BEGIN_MARKER);
  const endIndex = key.indexOf(END_MARKER);
  if (beginIndex < 0 || endIndex < 0 || endIndex <= beginIndex) {
    return key;
  }

  const header = BEGIN_MARKER;
  const footer = END_MARKER;
  const body = key
    .slice(beginIndex + BEGIN_MARKER.length, endIndex)
    .replace(/\s+/g, '');

  const bodyLines: string[] = [];
  for (let i = 0; i < body.length; i += 64) {
    bodyLines.push(body.slice(i, i + 64));
  }

  return `${header}\n${bodyLines.join('\n')}\n${footer}\n`;
}

export function normalizarFirebasePrivateKey(raw: string): string {
  const key = wrapSingleLinePem(expandEscapedNewlines(unwrapQuotes(raw)));
  validarFirebasePrivateKey(key);
  return key;
}

export function validarFirebasePrivateKey(privateKey: string): void {
  try {
    createPrivateKey({ key: privateKey, format: 'pem' });
  } catch {
    throw new Error(
      'FIREBASE_PRIVATE_KEY inválida. Usá FIREBASE_SERVICE_ACCOUNT_PATH apuntando al JSON de la cuenta de servicio o revisá RachasBack/.env.example',
    );
  }
}
