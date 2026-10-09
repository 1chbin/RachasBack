import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  Matches,
} from 'class-validator';
import { CategoriaDesafio } from '../../common/enums/categoria-desafio.enum';

export class CrearDesafioDto {
  @IsString()
  @Length(3, 60)
  nombre: string;

  @IsOptional()
  @IsString()
  @Length(0, 280)
  descripcion?: string;

  @IsEnum(CategoriaDesafio)
  categoria: CategoriaDesafio;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fechaInicio debe tener formato YYYY-MM-DD',
  })
  fechaInicio: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fechaFin debe tener formato YYYY-MM-DD',
  })
  fechaFin: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(20)
  maxParticipantes?: number;
}
