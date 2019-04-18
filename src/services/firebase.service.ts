import { Injectable, Logger } from '@nestjs/common';
import * as firebaseAdmin from 'firebase-admin';
import { Ticket, User } from '../entity';
import { auth } from 'firebase-admin';

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

  async addUserToFirestoreTicket(ticket: Ticket, user: auth.UserRecord) {
    const db = firebaseAdmin.firestore();
    const ticketsRef = db.collection('tickets').doc(`${ticket.id}`);

    await ticketsRef.update({
      users: firebaseAdmin.firestore.FieldValue.arrayUnion({
        uid: user.uid,
        name: user.displayName,
      }),
      uids: firebaseAdmin.firestore.FieldValue.arrayUnion(user.uid),
    });
  }

  async removeUserFromFirestoreTicket(ticket: Ticket, user: auth.UserRecord) {
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
        location: ticket.location.name,
        date_created: ticket.date_created,
        users: [],
        uids: [],
      }),
    );

    ticket.items.forEach((item: any) => {
      const ticketItemsRef = ticketsRef
        .collection('ticketItems')
        .doc(`${item.id}`);

      batch.set(
        ticketItemsRef,
        this.toPlainObject({
          name: item.name,
          price: item.price,
          ticket_item_id: item.ticket_item_id,
          users: [],
        }),
      );
    });

    await batch.commit();
  }

  private toPlainObject(obj: any) {
    return JSON.parse(JSON.stringify(obj));
  }
}
