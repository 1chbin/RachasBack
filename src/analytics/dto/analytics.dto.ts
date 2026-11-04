import { IsArray, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EventoUsoDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsObject()
  propiedades?: Record<string, string | number | boolean>;

  @IsString()
  ocurrioEn: string;
}

export class IngestarEventosDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventoUsoDto)
  eventos: EventoUsoDto[];
}

export class ReportarErrorClienteDto {
  @IsString()
  mensaje: string;

  @IsOptional()
  @IsString()
  pantalla?: string;

  @IsOptional()
  @IsString()
  requestId?: string;
}
