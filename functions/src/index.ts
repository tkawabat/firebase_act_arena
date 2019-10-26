import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp(functions.config().firebase);

import ArenaModel from '../model/ArenaModel';
import UserModel from '../model/UserModel';


export const createAccountDoc = functions.runWith({memory: '128MB', timeoutSeconds:10}).auth.user().onCreate(async (user) => {
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

export const userStatusUpdated = functions.runWith({memory: '128MB', timeoutSeconds:10}).database.ref('status/{uid}').onUpdate(async (change:functions.Change<functions.database.DataSnapshot>) => {
    const userId = change.after.key;
    const firestore = admin.firestore();

    // update user connect
    await firestore.collection('User').doc(userId).update({
        connect: change.after.val().state as number === 1
    })
    .catch((err) => console.error('update User connect'))
    ;

    // delete room user
    if (change.after.val().state as number === 0) {
        const documentData = await firestore.collection('User').doc(userId).get().then((snapshot) => {
            return snapshot.data();
        });
        if (documentData) {
            await UserModel.disconnected(documentData, userId);
        }
    }
});

// export const userUpdated = functions.firestore.document('User/{userId}').onUpdate(async (
//     change: functions.Change<functions.firestore.DocumentSnapshot>
//     , context: functions.EventContext
// ) => {
//     console.log('UserId: ' + context.params.userId);
//     const before = change.before.data() as FirebaseFirestore.DocumentData;
//     const after = change.after.data() as FirebaseFirestore.DocumentData;
//     await UserModel.updated(before, after, context.params.userId);
// });

export const arenaUpdated = functions.runWith({memory: '128MB', timeoutSeconds:10}).firestore.document('Arena/{arenaId}').onUpdate(async (
    change: functions.Change<functions.firestore.DocumentSnapshot>
    , context: functions.EventContext
) => {
    console.log('ArenaId: ' + context.params.arenaId);
    const before = change.before.data() as FirebaseFirestore.DocumentData;
    const after = change.after.data() as FirebaseFirestore.DocumentData;

    const p = [];
    p.push(ArenaModel.stateTransition(before, after, context.params.arenaId));
    p.push(ArenaModel.checkAndDeleteChat(context.params.arenaId));
    await Promise.all(p);
});

export const roomUserUpdated = functions.runWith({memory: '128MB', timeoutSeconds:10}).firestore.document('Arena/{arenaId}/RoomUser/{userId}').onUpdate(async (
    change: functions.Change<functions.firestore.DocumentSnapshot>,
    context: functions.EventContext,
) => {
    console.log('ArenaId: ' + context.params.arenaId);
    console.log('UserId: ' + context.params.userId);
    await ArenaModel.roomUserUpdated(context.params.arenaId);
});

export const roomUserDeleted = functions.runWith({memory: '128MB', timeoutSeconds:10}).firestore.document('Arena/{arenaId}/RoomUser/{userId}').onDelete(async (
    snapshot: FirebaseFirestore.DocumentSnapshot,
    context: functions.EventContext,
) => {
    console.log('ArenaId: ' + context.params.arenaId);
    console.log('UserId: ' + context.params.userId);
    const data = snapshot.data();
    if (!data) return;
    await ArenaModel.roomUserDeleted(data, context.params.arenaId);
});