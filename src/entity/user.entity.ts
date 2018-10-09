import { Entity, Column, OneToMany } from 'typeorm';
import { PaymentMethod, Ticket } from '.';

@Entity()
export class User {
  @Column('varchar', { length: 255, primary: true, nullable: false })
  uid: string;

  @OneToMany(type => PaymentMethod, method => method.id)
  payment_methods: string[];

  @OneToMany(type => Ticket, ticket => ticket.id)
  tickets: Ticket[];
}
