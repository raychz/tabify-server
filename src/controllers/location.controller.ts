import { Get, Controller, Body, Post } from '@nestjs/common';
import { LocationService } from 'services/location.service';

@Controller('locations')
export class LocationController {
  constructor(private locationService: LocationService) {}

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
    console.log(body)
    return this.locationService.addLocation(body);
  }
}
