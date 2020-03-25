import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class TabifyBaseEntity {

    @CreateDateColumn()
    date_created?: Date;

    @UpdateDateColumn()
    date_updated?: Date;

}