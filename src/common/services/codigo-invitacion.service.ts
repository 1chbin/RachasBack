import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

const CARACTERES = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class CodigoInvitacionService {
  generar(): string {
    const bytes = randomBytes(6);
    let codigo = '';
    for (let i = 0; i < 6; i += 1) {
      codigo += CARACTERES[bytes[i] % CARACTERES.length];
    }
    return codigo;
  }
}
