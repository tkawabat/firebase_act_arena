import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp(functions.config().firebase);

import ArenaModel from '../model/ArenaModel';

export const createAccountDoc = functions.auth.user().onCreate(async (user) => {
    const firestore = admin.firestore();

    const userCollection = firestore.collection('User');
    const userRef = userCollection.doc(user.uid);

    await userRef.set({
        name: ''
        , gender: -1
        , iconUrl: ''
    })
    .catch((err) => console.error('user created'))
    ;
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

export const arenaUpdated = functions.runWith({timeoutSeconds: 300}).firestore.document('Arena/{arenaId}').onUpdate(async (
    change: functions.Change<functions.firestore.DocumentSnapshot>
    , context: functions.EventContext
) => {
    console.log('ArenaId: ' + context.params.arenaId);
    const before = change.before.data() as FirebaseFirestore.DocumentData;
    const after = change.after.data() as FirebaseFirestore.DocumentData;
    await ArenaModel.stateTransition(before, after, context.params.arenaId);
    //await ArenaModel.arenaUpdated(context.params.arenaId);
});

export const roomUserUpdated = functions.firestore.document('Arena/{arenaId}/RoomUser/{uid}').onUpdate(async (
    change: functions.Change<functions.firestore.DocumentSnapshot>
    , context: functions.EventContext
) => {
    console.log('ArenaId: ' + context.params.arenaId);
    console.log('UserId: ' + context.params.uid);
    await ArenaModel.roomUserUpdated(context.params.arenaId);
});

export const chatUpdated = functions.firestore.document('Arena/{arenaId}/Chat/{chatId}').onCreate(async (
    snapshot: functions.firestore.DocumentSnapshot
    , context: functions.EventContext
) => {
    console.log('ArenaId: ' + context.params.arenaId);
    console.log('ChatId: ' + context.params.chatId);
    await ArenaModel.chatUpdated(context.params.arenaId);
});