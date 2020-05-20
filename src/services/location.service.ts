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

        nLocation.photo_url = location.photo_url || 'https://firebasestorage.googleapis.com/v0/b/tabify-40746.appspot.com/o/Default-Resturant-Pic.jpg?alt=media&token=5440f9ec-9f3a-4b4c-aaa9-2b98ee41d2e7';

        const resLocation = await locationRepo.save(nLocation);
        return resLocation;
    }
}
