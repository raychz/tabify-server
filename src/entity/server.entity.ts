import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, OneToMany, Index } from 'typeorm';
import { Location, UserDetail } from '@tabify/entities';

@Entity()
export class Server {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({type: 'varchar', nullable: false})
    firstName!: string;

    @Column({type: 'varchar', nullable: true})
    lastName!: string;

    @Column({type: 'varchar', nullable: true, unique: true})
    email!: string;

    @Column({type: 'varchar', length: 25, nullable: true})
    phone!: string;

    @Column({type: 'varchar', nullable: true})
    password!: string;

    @Column({type: 'varchar', length: 5, nullable: true})
    employeeId!: string;

    @Index({ unique: true })
    @Column({type: 'varchar', length: 5, nullable: false})
    referralCode!: string;

    @ManyToOne(type => Location, location => location.servers)
    location!: Location;

    @OneToMany(type => UserDetail, userDetail => userDetail.server)
    users!: UserDetail[];
}