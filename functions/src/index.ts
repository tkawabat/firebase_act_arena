// import * as functions from 'firebase-functions';

// // // Start writing Firebase Functions
// // // https://firebase.google.com/docs/functions/typescript
// //
// export const helloWorld = functions.https.onRequest((request, response) => {
//     response.send("Hello from Firebase!");
// });

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp(functions.config().firebase);

export const createAccountDoc = functions.region('asia-northeast1').auth.user().onCreate( async (user) => {
  const db = admin.firestore();
  const batch = db.batch();

  const userCollection = db.collection('User');
  const userRef = userCollection.doc(user.uid);

  try{
    await batch.set(userRef, { name: '未設定' });

    await batch.commit().then(() => {
    console.log('add user success.');
    })
  }
  catch(e) {
    console.log(`error occurs: ${e}`);
  }
});

