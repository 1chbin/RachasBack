import { IsString, Length } from 'class-validator';

export class UnirseDesafioDto {
  @IsString()
  @Length(6, 6)
  codigoInvitacion: string;
}
