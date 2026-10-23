import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CheckInsService } from './check-ins.service';
import { CrearCheckInDto } from './dto/crear-check-in.dto';
import { ListarCheckInsQueryDto } from './dto/listar-check-ins-query.dto';
import { UsuarioId } from '../common/decorators/usuario-id.decorator';

@Controller('desafios/:desafioId/check-ins')
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Post()
  registrar(
    @Param('desafioId') desafioId: string,
    @UsuarioId() usuarioId: string,
    @Body() dto: CrearCheckInDto,
  ) {
    return this.checkInsService.registrar(desafioId, usuarioId, dto);
  }

  @Delete('ultimo')
  deshacerUltimo(
    @Param('desafioId') desafioId: string,
    @UsuarioId() usuarioId: string,
  ) {
    return this.checkInsService.deshacerUltimo(desafioId, usuarioId);
  }

  @Get()
  listar(
    @Param('desafioId') desafioId: string,
    @UsuarioId() usuarioId: string,
    @Query() query: ListarCheckInsQueryDto,
  ) {
    return this.checkInsService.listarPorDesafioYUsuario(
      desafioId,
      usuarioId,
      query,
    );
  }
}
