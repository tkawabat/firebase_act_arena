import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp(functions.config().firebase);

import ArenaModel from '../model/ArenaModel';
import UserModel from '../model/UserModel';

export const createAccountDoc = functions.auth.user().onCreate(async (user) => {
    const firestore = admin.firestore();
    const userCollection = firestore.collection('User');
    const userRef = userCollection.doc(user.uid);

    await userRef.set({
        name: '',
        gender: -1,
        iconUrl: null,
        arena: '',
        connect: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    .catch((err) => console.error('user created'))
    ;
});

export const userStatusUpdated = functions.database.ref('status/{uid}').onUpdate(async (change:functions.Change<functions.database.DataSnapshot>) => {
    const userId = change.after.key;
    const firestore = admin.firestore();
    await firestore.collection('User').doc(userId).update({
        connect: change.after.val().state as number === 1
    })
    .catch((err) => console.error('update User connect'))
    ;
});

export const userUpdated = functions.firestore.document('User/{userId}').onUpdate(async (
    change: functions.Change<functions.firestore.DocumentSnapshot>
    , context: functions.EventContext
) => {
    console.log('UserId: ' + context.params.userId);
    const before = change.before.data() as FirebaseFirestore.DocumentData;
    const after = change.after.data() as FirebaseFirestore.DocumentData;
    await UserModel.updated(before, after, context.params.userId);
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