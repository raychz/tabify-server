import { Injectable } from '@nestjs/common';
import { getRepository, FindOneOptions } from 'typeorm';
import { Location as LocationEntity } from '@tabify/entities';

@Injectable()
export class LocationService {
    /**
     * Gets all locations saved on the tabify db;
     */
    public async getLocations() {
        const locationRepo = await getRepository(LocationEntity);
        return locationRepo.find({
            order: {
                name: 'ASC',
            },
        });
    }

    /**
     * Returns a location based on the given id.
     */
    public async getLocation(options: FindOneOptions<LocationEntity>) {
        const locationRepo = await getRepository(LocationEntity);
        return locationRepo.findOne(options);
    }

    public async addLocation(location: any) {
        const locationRepo = await getRepository(LocationEntity);
        const nLocation = new LocationEntity();
        nLocation.omnivore_id = location.omnivore_id;
        nLocation.name = location.name;

        n.location.photo_url = location.photo_url || 'https://g.foolcdn.com/editorial/images/543929/casual-dining-restaurant.jpg';

        const resLocation = await locationRepo.save(nLocation);
        return resLocation;
    }
}
