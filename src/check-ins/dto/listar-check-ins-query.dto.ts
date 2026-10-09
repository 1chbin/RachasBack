import { IsMongoId } from 'class-validator';

export class ListarCheckInsQueryDto {
  @IsMongoId()
  usuarioId: string;
}
