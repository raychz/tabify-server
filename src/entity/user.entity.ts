import { Entity, Column, ManyToMany, OneToMany, JoinTable } from 'typeorm';
import { Ticket, TicketItem, RestaurantCode } from '.';

@Entity()
export class User {
  @Column('varchar', { length: 255, primary: true, nullable: false })
  uid!: string;

  @ManyToMany(type => Ticket)
  tickets!: Ticket[];

  @ManyToMany(type => TicketItem)
  ticketItems!: TicketItem[];

  @OneToMany(type => RestaurantCode, restaurantCode => restaurantCode.id)
  restaurantCodes!: RestaurantCode[];
}
