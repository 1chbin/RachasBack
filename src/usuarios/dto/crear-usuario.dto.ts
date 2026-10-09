import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ZONA_HORARIA_DEFAULT } from '../../common/constants/zona-horaria-default';

export class CrearUsuarioDto {
  @IsString()
  @Length(1, 120)
  nombre: string;

  @IsString()
  @Length(3, 20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'El alias solo puede contener letras, números y guion bajo',
  })
  alias: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  zonaHoraria?: string = ZONA_HORARIA_DEFAULT;
}
