import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, OneToMany, Index, Unique } from 'typeorm';
import { Location, UserDetail, Ticket, ServerReward, TabifyBaseEntity } from '@tabify/entities';

@Entity()
@Unique(['employeeId', 'location'])
export class Server extends TabifyBaseEntity {
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

    @Index()
    @Column({type: 'varchar', length: 5, nullable: true})
    employeeId!: string;

    @Index({ unique: true })
    @Column({type: 'varchar', length: 5, nullable: false})
    referralCode!: string;

    @ManyToOne(type => Location, location => location.servers)
    location!: Location;

    @OneToMany(type => UserDetail, userDetail => userDetail.server)
    users!: UserDetail[];

    @OneToMany(type => Ticket, ticket => ticket.server)
    ticket!: Ticket[];

    @OneToMany(type => ServerReward, serverReward => serverReward.server)
    serverRewards!: ServerReward[];
}