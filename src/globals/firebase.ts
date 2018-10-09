import * as admin from 'firebase-admin';
import * as path from 'path';

// This should ideally come from a .json file we get from firebase
const firebaseCerts = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

export default {
  credential: admin.credential.cert(firebaseCerts),
};
