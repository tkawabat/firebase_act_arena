import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');
import * as test from 'firebase-functions-test';
import * as admin from 'firebase-admin';

import * as Index from '../index';

import * as C from '../lib/Const';

import ArenaModel from '../model/ArenaModel';


describe('index.arenaRoomUserDeleted', () => {
    beforeEach(async () => {
        await ArenaModel.batchDeleteAll();
    });
    afterEach(() => {
        test().cleanup();
    });

    it('非演者がいなくなっても劇は続行', async () => {
        const arenaId = 100;
        const arenaRef = admin.firestore().collection('Arena').doc(arenaId.toString());
        await arenaRef.set({
            state: C.ArenaState.ACT,
            characters: [],
        })

        const userId = 'user01';
        const user = {
            state: C.ArenaUserState.ENTRY
        }

        const wrapped = test().wrap(Index.arenaRoomUserDeleted);
        const snapshot = test().firestore.makeDocumentSnapshot(user, 'Arena/'+arenaId+'/RoomUser/'+userId);

        await wrapped(snapshot, {
            params: {
                arenaId: arenaId.toString(),
                userId: userId,
            }
        }).then(async () => {
            const result = (await arenaRef.get()).data() as FirebaseFirestore.DocumentData;
            expect(result.state).toBe(C.ArenaState.ACT);
        });
    });

    it('演者がいなくなったら劇は終了', async () => {
        const p = [];

        const arenaId = 101;
        const remainActorId = 'actor';
        const userId = 'user01';

        const arenaRef = admin.firestore().collection('Arena').doc(arenaId.toString());
        p.push(arenaRef.set({
            state: C.ArenaState.ACT,
            characters: [
                { user: remainActorId},
                { user: userId},
            ],
        }));

        const remainActorRef = arenaRef.collection('RoomUser').doc(remainActorId);
        p.push(remainActorRef.set({
            state: C.ArenaUserState.ACTOR
        }));

        const userRef = arenaRef.collection('RoomUser').doc(userId);
        const user = {
            state: C.ArenaUserState.ACTOR
        }
        p.push(userRef.set(user));

        await Promise.all(p);

        const wrapped = test().wrap(Index.arenaRoomUserDeleted);
        const snapshot = test().firestore.makeDocumentSnapshot(user, 'Arena/'+arenaId+'/RoomUser/'+userId);

        await wrapped(snapshot, {
            params: {
                arenaId: arenaId.toString(),
                userId: userId,
            }
        }).then(async () => {
            const arena = (await arenaRef.get()).data() as FirebaseFirestore.DocumentData;
            expect(arena.message).toBe('演者の接続エラー\n上演を強制終了します');
            
            const remainActor = (await remainActorRef.get()).data() as FirebaseFirestore.DocumentData;
            expect(remainActor.state).toBe(C.ArenaUserState.LISTNER);
        });
    });
});