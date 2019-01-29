import { Injectable } from '@nestjs/common';
import { Location as LocationEntity, Location } from '../entity';
import { getManager, getRepository } from 'typeorm';

@Injectable()
export class LocationService {
    constructor() { }

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
    public async getLocation(locationId: string) {
        const locationRepo = await getRepository(LocationEntity);
        return locationRepo.find({
            where: {
                id: locationId,
            },
        });
    }

    public async addLocation(location: any) {
        const locationRepo = await getRepository(LocationEntity);
        const nLocation = new LocationEntity();
        nLocation.omnivore_id = location.omnivore_id;
        nLocation.name = location.name;
        const resLocation = await locationRepo.save(nLocation);
        return resLocation;
     }
}