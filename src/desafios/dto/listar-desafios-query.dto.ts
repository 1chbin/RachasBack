import { IsEnum, IsOptional } from 'class-validator';
import { CategoriaDesafio } from '../../common/enums/categoria-desafio.enum';
import { EstadoDesafio } from '../../common/enums/estado-desafio.enum';
import { PaginacionQueryDto } from '../../common/dto/paginacion-query.dto';

export class ListarDesafiosQueryDto extends PaginacionQueryDto {
  @IsOptional()
  @IsEnum(EstadoDesafio)
  estado?: EstadoDesafio;

  @IsOptional()
  @IsEnum(CategoriaDesafio)
  categoria?: CategoriaDesafio;
}
