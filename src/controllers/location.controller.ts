import { Get, Controller } from '@nestjs/common';
import { OmnivoreService } from 'services/omnivore.service';

@Controller('locations')
export class LocationController {
  constructor(private omnivoreService: OmnivoreService) {}

  /**
   * Returns a list of locations on our omnivore account
   */
  @Get()
  getLocations() {
    return this.omnivoreService.getLocations();
  }

  /**
   * Gets a list of locations given the users lat and lon
   */
  @Get('')
  getNearByLocations() {

  }
}
