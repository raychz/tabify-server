import { CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, DeleteDateColumn } from 'typeorm';

export abstract class TabifyBaseEntity {

    @PrimaryGeneratedColumn()
    id?: number;

    @CreateDateColumn()
    date_created?: Date;

    @UpdateDateColumn()
    date_updated?: Date;

    @DeleteDateColumn()
    date_deleted?: Date;
}