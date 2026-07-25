import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health(): { status: string; service: string; phase: string } {
    return { status: 'ok', service: 'ase-os-api', phase: 'Phase 1' };
  }
}
