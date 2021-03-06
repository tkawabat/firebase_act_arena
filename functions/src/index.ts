import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp(functions.config().firebase);

import ArenaService from './service/ArenaService';
import MatchingService from './service/MatchingService';

import ArenaModel from './model/ArenaModel';
import UserModel from './model/UserModel';
import TheaterModel from './model/TheaterModel';
import PushModel from './model/PushModel';


export const createAccountDoc = functions.region('asia-northeast1').runWith({memory: '128MB', timeoutSeconds:10}).auth.user().onCreate(async (user) => {
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

export const userStatusUpdated = functions.region('asia-northeast1').runWith({memory: '128MB', timeoutSeconds:10}).database.ref('status/{uid}').onUpdate(async (change:functions.Change<functions.database.DataSnapshot>) => {
    const userId = change.after.key;
    const firestore = admin.firestore();

    // update user connect
    await firestore.collection('User').doc(userId).update({
        connect: change.after.val().state as number === 1,
        updatedAt: admin.firestore.Timestamp.now(),
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

export const arenaChatUpdated = functions.region('asia-northeast1').runWith({memory: '128MB', timeoutSeconds:10}).firestore.document('Arena/{arenaId}/Chat/{chatId}').onCreate(async (
    snapshot: functions.firestore.DocumentSnapshot
    , context: functions.EventContext
) => {
    console.log('ArenaId: ' + context.params.arenaId);

    const p = [];
    p.push(ArenaModel.checkAndDeleteChat(context.params.arenaId));
    await Promise.all(p);
});

export const arenaRoomUserUpdated = functions.region('asia-northeast1').runWith({memory: '128MB', timeoutSeconds:15}).firestore.document('Arena/{arenaId}/RoomUser/{userId}').onUpdate(async (
    change: functions.Change<functions.firestore.DocumentSnapshot>,
    context: functions.EventContext,
) => {
    console.log('ArenaId: ' + context.params.arenaId);
    console.log('UserId: ' + context.params.userId);
    const p = [];
    p.push(ArenaService.asyncSendEntry(context.params.arenaId, change.after));
    p.push(ArenaModel.roomUserUpdated(context.params.arenaId));

    await Promise.all(p);
});

export const arenaRoomUserDeleted = functions.region('asia-northeast1').runWith({memory: '128MB', timeoutSeconds:10}).firestore.document('Arena/{arenaId}/RoomUser/{userId}').onDelete(async (
    snapshot: FirebaseFirestore.DocumentSnapshot,
    context: functions.EventContext,
) => {
    console.log('ArenaId: ' + context.params.arenaId);
    console.log('UserId: ' + context.params.userId);
    const data = snapshot.data();
    if (!data) return;
    await ArenaModel.roomUserDeleted(data, context.params.arenaId);
});

export const matchingListCreated = functions.region('asia-northeast1').runWith({memory: '128MB', timeoutSeconds:30}).firestore.document('MatchingList/{userId}').onCreate(async (
    snapshot: FirebaseFirestore.DocumentSnapshot,
    context: functions.EventContext,
) => {
    console.log('UserId: ' + context.params.userId);
    const data = snapshot.data();
    if (!data) return;

    const p = [];
    p.push(PushModel.asyncSend('', 'サシ劇マッチングでエントリーしている方がいます。\n劇をしたい方は是非エントリーを！'));
    p.push(MatchingService.decideProgram());
    await Promise.all(p);
});

export const theaterRoomUserUpdated = functions.region('asia-northeast1').runWith({memory: '128MB', timeoutSeconds:30}).firestore.document('Theater/{theaterId}/RoomUser/{userId}').onUpdate(async (
    change: functions.Change<functions.firestore.DocumentSnapshot>,
    context: functions.EventContext,
) => {
    console.log('TheaterId: ' + context.params.theaterId);
    console.log('UserId: ' + context.params.userId);
    const p = [];
    p.push(TheaterModel.roomUserUpdated(context.params.theaterId));

    await Promise.all(p);
});