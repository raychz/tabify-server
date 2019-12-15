import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  OneToMany,
} from 'typeorm';
import { Server, Ticket } from '@tabify/entities';
import { Coupon } from './coupon.entity';

@Entity()
@Unique(['omnivore_id'])
export class Location {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'varchar', nullable: false })
  omnivore_id?: string;

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

  @Column({ type: 'varchar', nullable: true })
  timezone!: string;

  @Column({ type: 'varchar', nullable: true })
  website!: string;

  @Column({ type: 'varchar', nullable: true })
  photo_url?: string;

  @Column({ type: 'varchar', nullable: true })
  zip!: string;

  @Column({ type: 'varchar', nullable: true })
  google_place_id?: string;

  @Column({ type: 'float', nullable: true })
  tax_rate?: number;

  @OneToMany(type => Ticket, ticket => ticket.location)
  tickets!: Ticket[];

  @OneToMany(type => Server, server => server.location)
  servers!: Server[];

  @OneToMany(type => Coupon, coupon => coupon.id)
  coupons?: Coupon[];
}
