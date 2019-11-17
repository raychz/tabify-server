import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
  } from 'typeorm';
import { Location } from './location.entity';

@Entity()
  export class Coupon {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ type: 'varchar', nullable: false })
    header!: string;

    @Column({ type: 'varchar', nullable: false })
    description!: string;

    @CreateDateColumn()
    date_created!: Date;

    @UpdateDateColumn()
    date_updated!: Date;

    @Column({type: 'date', nullable: false})
    coupon_start_date!: Date;

    @Column({type: 'date', nullable: false})
    coupon_end_date!: Date;

    @ManyToOne(type => Location, location => location.coupons)
    location!: Location;
  }