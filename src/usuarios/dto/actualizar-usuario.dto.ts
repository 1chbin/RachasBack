import { IsOptional, IsString, Length } from 'class-validator';

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  nombre?: string;

  @IsOptional()
  @IsString()
  zonaHoraria?: string;
}
