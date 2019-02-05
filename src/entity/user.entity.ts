import { Entity, Column, OneToMany } from 'typeorm';
import { Ticket } from '.';

@Entity()
export class User {
  @Column('varchar', { length: 255, primary: true, nullable: false })
  uid!: string;
}
