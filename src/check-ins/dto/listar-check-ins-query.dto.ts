import { IsMongoId } from 'class-validator';
import { PaginacionQueryDto } from '../../common/dto/paginacion-query.dto';

export class ListarCheckInsQueryDto extends PaginacionQueryDto {
  @IsMongoId()
  usuarioId: string;
}
