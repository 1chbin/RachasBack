import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { IngestarEventosDto, ReportarErrorClienteDto } from './dto/analytics.dto';
import { UsuarioId } from '../common/decorators/usuario-id.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller({ path: 'analytics', version: '2' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  ingestar(
    @Body() dto: IngestarEventosDto,
    @UsuarioId() usuarioId: string,
    @Headers('x-app-version') appVersion?: string,
    @Headers('x-platform') platform?: string,
  ) {
    return this.analyticsService.ingestarLote(dto.eventos, {
      usuarioId,
      appVersion: Array.isArray(appVersion) ? appVersion[0] : appVersion,
      platform: Array.isArray(platform) ? platform[0] : platform,
    });
  }

  @Public()
  @Post('client-errors')
  reportarError(
    @Body() dto: ReportarErrorClienteDto,
    @Headers('x-app-version') appVersion?: string,
    @Headers('x-platform') platform?: string,
  ) {
    return this.analyticsService.reportarErrorCliente(dto, {
      appVersion: Array.isArray(appVersion) ? appVersion[0] : appVersion,
      platform: Array.isArray(platform) ? platform[0] : platform,
    });
  }

  @Get('reportes/personas-activas-por-dia')
  personasActivasPorDia() {
    return this.analyticsService.personasActivasPorDia();
  }
}
