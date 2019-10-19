import { Injectable, Logger, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import * as firebaseAdmin from 'firebase-admin';
import { auth } from 'firebase-admin';
import { Ticket, User } from '@tabify/entities';
import * as currency from 'currency.js';

// please keep the user status enum in order of execution as they are used for calculations
enum UserStatus { Selecting, Waiting, Confirmed, Paying, Paid }
enum TicketStatus { Open, Closed }

@Injectable()
export class FirebaseService {
  async getUserInfo(uid: string) {
    return await firebaseAdmin.auth().getUser(uid);
  }

  async getUidFromToken(token: string): Promise<string | null> {
    try {
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
      return decodedToken.uid;
    } catch (err) {
      Logger.error(err);
      return null;
    }
  }

  async addUserToFirestoreTicket(ticketId: number, user: auth.UserRecord) {
    const db = firebaseAdmin.firestore();
    const ticketsRef = db.collection('tickets').doc(`${ticketId}`);

    const ticketDoc = await ticketsRef.get();
    const overallUsersProgress = ticketDoc.get('overallUsersProgress') as UserStatus;
    const userUids = ticketDoc.get('uids') as string[];

    if (!userUids.find(uid => uid === user.uid)) {
      if (overallUsersProgress >= UserStatus.Paying) {
        throw new ForbiddenException('The patrons of this tab have already selected their items and moved on to payment.');
      }
      await ticketsRef.update({
        users: firebaseAdmin.firestore.FieldValue.arrayUnion({
          uid: user.uid,
          name: user.displayName,
          status: UserStatus.Selecting,
          photoUrl: null,
          totals: {
            tax: 0, // user's share of the tax
            tip: 0, // user's tip
            subtotal: 0, // user's sum of the share of their selected items
            total: 0, // user's tax + tip + subtotal
          },
        }),
        uids: firebaseAdmin.firestore.FieldValue.arrayUnion(user.uid),
      });
    }
  }

  async removeUserFromFirestoreTicket(ticket: Ticket, user: auth.UserRecord) { // currently not being called
    const db = firebaseAdmin.firestore();
    const ticketsRef = db.collection('tickets').doc(`${ticket.id}`);

    await ticketsRef.update({
      users: firebaseAdmin.firestore.FieldValue.arrayRemove({
        uid: user.uid,
        name: user.displayName,
      }),
      uids: firebaseAdmin.firestore.FieldValue.arrayRemove(user.uid),
    });
  }

  async addTicketToFirestore(ticket: Ticket) {
    const db = firebaseAdmin.firestore();
    const batch = db.batch();

    const ticketsRef = db.collection('tickets').doc(`${ticket.id}`);
    batch.set(
      ticketsRef,
      this.toPlainObject({
        tab_id: ticket.tab_id,
        ticket_number: ticket.ticket_number,
        location: {
          name: ticket.location!.name,
          id: ticket.location!.id,
          omnivore_id: ticket.location!.omnivore_id,
        },
        date_created: ticket.date_created,
        status: TicketStatus.Open,
        overallUsersProgress: UserStatus.Selecting,
        ticketTotalFinalized: false,
        ticketTotal: ticket.ticketTotal,
        users: [],
        uids: [],
      }),
    );

    ticket.items!.forEach((item: any) => {
      const ticketItemsRef = ticketsRef
        .collection('ticketItems')
        .doc(`${item.id}`);

      batch.set(
        ticketItemsRef,
        this.toPlainObject({
          name: item.name,
          price: item.price,
          ticket_item_id: item.ticket_item_id,
          quantity: item.quantity,
          users: [],
        }),
      );
    });

    await batch.commit();
  }

  async finalizeUserTotals(ticketId: number) {
    const db = firebaseAdmin.firestore();
    const ticketRef = db.collection('tickets').doc(`${ticketId}`);
    const ticketItemsRef = ticketRef.collection('ticketItems');

    /*
    1. Determine if totals are finalized. If not, proceed.
    2. Get sum of items for each user, and compare against the totals due.  If not equal, throw error.
    3. Distribute tax due evenly.
    */
    try {
      await db.runTransaction(async transaction => {
        const ticket = await transaction.get(ticketRef);
        if (!ticket.exists) {
          throw new Error('Document does not exist!');
        }

        const ticketTotalFinalized = ticket.get('ticketTotalFinalized') as boolean;
        if (ticketTotalFinalized) {
          throw new Error('totals_already_finalized');
        }

        const users = ticket.get('users') as any[];
        const _ticketItems = await transaction.get(ticketItemsRef);
        const ticketItems: any = [];
        _ticketItems.forEach(doc => {
          ticketItems.push(doc.data());
        });
        const ticketTotal = ticket.get('ticketTotal');
        const distributedTax = currency(ticketTotal.tax / 100).distribute(users.length);

        let allUsersSubtotal = 0;
        let allUsersTax = 0;
        let allUsersTotal = 0;
        users.forEach((user: any, index: number) => {
          // Find sum of the selected items for this user
          let subtotal = 0;
          ticketItems.forEach((ticketItem: any) => {
            const userOnItem = ticketItem.users.find((_user: any) => _user.uid === user.uid);
            if (userOnItem) {
              subtotal += userOnItem.price;
            }
          });
          user.totals.subtotal = subtotal;
          allUsersSubtotal += user.totals.subtotal;

          // Distribute the tax evenly
          // TODO: Distribute the tax proportionally
          user.totals.tax = distributedTax[index].intValue;
          allUsersTax += user.totals.tax;

          // Set the user total
          user.totals.total = user.totals.subtotal + user.totals.tax;
          allUsersTotal += user.totals.total;
        });

        const ticketLocation = ticket.get('location');
        if (ticketLocation.omnivore_id === 'i8yBgkjT') {
          // Account for Omnivore Virtual POS bug that adds a $5 service charge to every ticket
          allUsersTotal += 500;
        }

        if (
          allUsersSubtotal !== ticketTotal.sub_total ||
          allUsersTax !== ticketTotal.tax ||
          allUsersTotal !== ticketTotal.total
        ) {
          throw new Error('The users subtotal, tax, or total is not equal to the ticket totals!');
        }

        transaction.set(
          ticketRef,
          { users, ticketTotalFinalized: true },
          { merge: true },
        );
        return transaction;
      });

      return {
        success: true,
        message: 'The ticket totals have been finalized.',
      };
    } catch (e) {
      if (e instanceof Error && e.message === 'totals_already_finalized') {
        return {
          success: true,
          message: 'The ticket totals have already been finalized.',
        };
      }
      throw new InternalServerErrorException(
        e,
        'The transaction failed.',
      );
    }
  }

  private toPlainObject(obj: any) {
    return JSON.parse(JSON.stringify(obj));
  }
}
