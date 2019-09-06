import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  OneToMany,
} from 'typeorm';
import { Server, Ticket } from '@tabify/entities';

export interface ILocation {
  id?: number;
  omnivore_id: string;
  name: string;
  city: string;
  country: string;
  state: string;
  street1: string;
  street2: string;
  longitude: string;
  latitude: string;
  phone: string;
  timezone: string;
  website: string;
  photo_url?: string;
  zip: string;
  google_place_id?: string;
  tickets: Ticket[];
  servers: Server[];
}

@Entity()
@Unique(['omnivore_id'])
export class Location implements ILocation {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'varchar', nullable: false })
  omnivore_id!: string;

  @Column({ type: 'varchar', nullable: false })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  city!: string;

  @Column({ type: 'varchar', nullable: true })
  country!: string;

  @Column({ type: 'varchar', nullable: true })
  state!: string;

  @Column({ type: 'varchar', nullable: true })
  street1!: string;

  @Column({ type: 'varchar', nullable: true })
  street2!: string;

  @Column({ type: 'varchar', nullable: true })
  latitude!: string;

  @Column({ type: 'varchar', nullable: true })
  longitude!: string;

  @Column({ type: 'varchar', nullable: true })
  phone!: string;

  @Column({ type: 'varchar', nullable: true})
  timezone!: string;

  @Column({ type: 'varchar', nullable: true })
  website!: string;

  @Column({ type: 'varchar', nullable: true })
  photo_url?: string;

  @Column({ type: 'varchar', nullable: true })
  zip!: string;

  @Column({ type: 'varchar', nullable: true })
  google_place_id?: string;

  @OneToMany(type => Ticket, ticket => ticket.location)
  tickets!: Ticket[];

  @OneToMany(type => Server, server => server.location)
  servers!: Server[];

  constructor(location?: ILocation) {
    if (location) {
      Object.keys(location).forEach((key: string) => {
        this[key as keyof ILocation] = location[key as keyof ILocation];
      });
    }
  }
}
