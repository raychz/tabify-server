import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, Column } from 'typeorm';
import { Location } from './location.entity';

@Entity()
export class Server {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({type: 'varchar', nullable: false})
    displayName!: string;

    @Column({type: 'varchar', nullable: false})
    email!: string;

    @Column({type: 'varchar', nullable: false})
    password!: string;

    @Column({type: 'varchar', nullable: false, unique: true})
    referralCode!: string;

    @ManyToOne(type => Location, location => location.servers)
    location!: Location;
}