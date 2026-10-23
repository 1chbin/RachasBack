import { IsString, Length, Matches } from 'class-validator';

export class ActualizarAliasDto {
  @IsString()
  @Length(3, 20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'El alias solo puede contener letras, números y guion bajo',
  })
  alias: string;
}
