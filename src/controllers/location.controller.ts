import { Get, Controller, Body, Post } from '@nestjs/common';
import { LocationService, OmnivoreService} from '@tabify/services';

@Controller('locations')
export class LocationController {
  constructor(private omnivoreService: OmnivoreService, private locationService: LocationService) {}

  /**
   * Returns a list of locations on our omnivore account
   */
  @Get()
  getLocations() {
    return this.locationService.getLocations();
  }

  /**
   * Gets a list of locations given the users lat and lon
   */
  @Get('')
  getNearByLocations() {

  }

  @Post()
  createLocation(@Body() body: any) {
    return this.locationService.addLocation(body);
  }

  @Post('sync')
  syncLocations() {
    return this.omnivoreService.syncLocations();
  }
}
