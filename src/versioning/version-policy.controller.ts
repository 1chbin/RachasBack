import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../common/decorators/public.decorator';
import { VERSION_NEUTRAL } from '@nestjs/common';

@Public()
@Controller({ path: 'version-policy', version: VERSION_NEUTRAL })
export class VersionPolicyController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  obtenerPolitica() {
    return {
      min: this.configService.get<string>('MIN_APP_VERSION')?.trim() ?? '1.0.0',
      recommended:
        this.configService.get<string>('RECOMMENDED_APP_VERSION')?.trim() ??
        '1.1.0',
    };
  }
}
