import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  Matches,
} from 'class-validator';

export class ActualizarDesafioDto {
  @IsOptional()
  @IsString()
  @Length(3, 60)
  nombre?: string;

  @IsOptional()
  @IsString()
  @Length(0, 280)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fechaInicio?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fechaFin?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(20)
  maxParticipantes?: number;
}
