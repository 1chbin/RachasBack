import { readFileSync } from 'fs';
import { isAbsolute, resolve } from 'path';
import { ConfigService } from '@nestjs/config';
import { ServiceAccount } from 'firebase-admin/app';
import { normalizarFirebasePrivateKey } from '../common/utils/firebase-private-key.util';

export type FirebaseCredentialMaterial = ServiceAccount;

type ServiceAccountJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function resolveServiceAccountPath(config: ConfigService): string | undefined {
  const pathValue = config.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH')?.trim();
  if (!pathValue) {
    return undefined;
  }
  return isAbsolute(pathValue) ? pathValue : resolve(process.cwd(), pathValue);
}

function loadFromJsonFile(filePath: string): FirebaseCredentialMaterial {
  let parsed: ServiceAccountJson;
  try {
    parsed = JSON.parse(readFileSync(filePath, 'utf8')) as ServiceAccountJson;
  } catch {
    throw new Error(
      `No se pudo leer FIREBASE_SERVICE_ACCOUNT_PATH (${filePath}). Verificá que el archivo exista y sea JSON válido.`,
    );
  }

  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error(
      'El JSON de la cuenta de servicio debe incluir project_id, client_email y private_key.',
    );
  }

  const privateKey = normalizarFirebasePrivateKey(parsed.private_key);

  return {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey,
  };
}

function loadFromEnv(config: ConfigService): FirebaseCredentialMaterial {
  const projectId = config.getOrThrow<string>('FIREBASE_PROJECT_ID').trim();
  const clientEmail = config.getOrThrow<string>('FIREBASE_CLIENT_EMAIL').trim();
  const privateKey = normalizarFirebasePrivateKey(
    config.getOrThrow<string>('FIREBASE_PRIVATE_KEY'),
  );

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

export function resolveFirebaseCredential(
  config: ConfigService,
): FirebaseCredentialMaterial {
  const jsonPath = resolveServiceAccountPath(config);
  if (jsonPath) {
    return loadFromJsonFile(jsonPath);
  }

  return loadFromEnv(config);
}
