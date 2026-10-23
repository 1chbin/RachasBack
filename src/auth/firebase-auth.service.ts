import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { resolveFirebaseCredential } from './firebase-credentials.util';

@Injectable()
export class FirebaseAuthService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    if (getApps().length > 0) {
      return;
    }

    const credential = resolveFirebaseCredential(this.configService);

    initializeApp({
      credential: cert(credential),
    });
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    return getAuth().verifyIdToken(idToken);
  }
}
