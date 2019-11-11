import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, OneToMany } from 'typeorm';
import { Location, UserDetail, ServerReward } from '@tabify/entities';

@Entity()
export class Server {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({type: 'varchar', nullable: false})
    firstName!: string;

    @Column({type: 'varchar', nullable: true})
    lastName!: string;

    @Column({type: 'varchar', nullable: false})
    email!: string;

    @Column({type: 'varchar', nullable: false})
    password!: string;

    @Column({type: 'varchar', length: 5, nullable: false})
    employerIdCode!: string;

    @Column({type: 'varchar', length: 5, nullable: false, unique: true})
    referralCode!: string;

    @ManyToOne(type => Location, location => location.servers)
    location!: Location;

    @OneToMany(type => UserDetail, userDetail => userDetail.server)
    users!: UserDetail[];

    @OneToMany(type => ServerReward, serverReward => serverReward.server)
    serverRewards!: ServerReward[];
}