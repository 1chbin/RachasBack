import { IsNumber, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CrearCheckInDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dia debe tener formato YYYY-MM-DD',
  })
  dia: string;

  @IsOptional()
  @IsString()
  @Length(0, 140)
  nota?: string;

  @IsOptional()
  @IsNumber()
  valor?: number;
}
