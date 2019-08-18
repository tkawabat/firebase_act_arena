import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp(functions.config().firebase);

export const createAccountDoc = functions.auth.user().onCreate(async (user) => {
    const db = admin.firestore();
    const batch = db.batch();

    const userCollection = db.collection('User');
    const userRef = userCollection.doc(user.uid);

    try {
        await batch.set(userRef, {
            name: ''
            , gender: -1
            , iconUrl: ''
        });

        await batch.commit().then(() => {
            console.log('add user success.');
        })
    } catch (e) {
        console.log(`error occurs: ${e}`);
    }
});