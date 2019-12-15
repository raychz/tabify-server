import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, OneToMany, Index } from 'typeorm';
import { Location, UserDetail } from '@tabify/entities';

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

    @Index({ unique: true })
    @Column({type: 'varchar', length: 5, nullable: false})
    referralCode!: string;

    @ManyToOne(type => Location, location => location.servers)
    location!: Location;

    @OneToMany(type => UserDetail, userDetail => userDetail.server)
    users!: UserDetail[];
}