import { IsEnum, IsOptional } from 'class-validator';
import { CategoriaDesafio } from '../../common/enums/categoria-desafio.enum';
import { EstadoDesafio } from '../../common/enums/estado-desafio.enum';

export class ListarDesafiosQueryDto {
  @IsOptional()
  @IsEnum(EstadoDesafio)
  estado?: EstadoDesafio;

  @IsOptional()
  @IsEnum(CategoriaDesafio)
  categoria?: CategoriaDesafio;
}
