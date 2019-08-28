import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp(functions.config().firebase);

import ArenaModel from '../model/ArenaModel';

export const createAccountDoc = functions.auth.user().onCreate(async (user) => {
    const firestore = admin.firestore();
    const batch = firestore.batch();

    const userCollection = firestore.collection('User');
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

export const userStatusUpdated = functions.database.ref('status/{uid}').onUpdate(async (change:functions.Change<functions.database.DataSnapshot>) => {
    if (change.after.val().state !== 0) {
        return;
    }
    const uid = change.after.key;
    console.log('uid: '+uid);

    const firestore = admin.firestore();
    const arena:string = await firestore.collection('User').doc(uid).get().then((snapshot) => {
        const data = snapshot.data();
        if (!data) return '';
        return data.arena as string;
    });
    if (arena === '') {
        console.log('no data');
        return;
    }

    firestore.collection('Arena').doc(arena).collection('RoomUser').doc(uid).delete()
    .then(() => console.log('ok'))
    .catch(() => console.log('user delete error'))
    ;
});

export const roomUserUpdated = functions.firestore.document('Arena/{arenaId}/RoomUser/{uid}').onUpdate(async (
    change: functions.Change<functions.firestore.DocumentSnapshot>
    , context: functions.EventContext
) => {
    console.log('ArenaId: ' + context.params.arenaId);
    await ArenaModel.roomUserUpdated(context.params.arenaId);
});