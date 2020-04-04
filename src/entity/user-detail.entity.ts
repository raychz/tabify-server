import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne, Index } from 'typeorm';
import { Server, User, TabifyBaseEntity } from '@tabify/entities';

@Entity()
export class UserDetail extends TabifyBaseEntity {
    @Column({ type: 'varchar', nullable: false })
    displayName!: string;

    @Column({ type: 'varchar', nullable: false })
    email!: string;

    @Column({ type: 'varchar', nullable: true })
    photo_url!: string;

    // Bi-directional one-to-one
    @Index()
    @OneToOne(type => User, user => user.userDetail, { onDelete: 'CASCADE' })
    @JoinColumn()
    user!: User;

    @ManyToOne(type => Server, server => server.users)
    server!: Server;

    // stored as int in MySQL. 1 = True, 0 = False
    @Column({ type: 'boolean', nullable: false, default: true })
    newUser!: boolean;
}