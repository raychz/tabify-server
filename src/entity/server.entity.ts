import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, OneToMany } from 'typeorm';
import { Location } from './location.entity';
import { UserDetail } from './user-detail.entity';

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

    @Column({type: 'varchar', length: 5, nullable: false, unique: true})
    referralCode!: string;

    @ManyToOne(type => Location, location => location.servers)
    location!: Location;

    @OneToMany(type => UserDetail, userDetail => userDetail.server)
    users!: UserDetail[];
}