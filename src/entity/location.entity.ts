import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['omnivore_id'])
export class Location {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: false })
  omnivore_id!: number;

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
  photo_url!: string;
}
