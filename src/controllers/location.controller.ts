import { Get, Controller } from '@nestjs/common';
import { OmnivoreService } from 'services/omnivore-service';

@Controller('locations')
export class LocationController {
  constructor(private omnivoreService: OmnivoreService) {}

  @Get()
  getLocation() {
    return this.omnivoreService.getLocations();
  }
}
