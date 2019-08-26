import * as admin from 'firebase-admin';
import { DocumentData } from '@google-cloud/firestore';

import * as C from '../lib/Const';
import ModelBase from './ModelBase';


interface Arena extends DocumentData {
    id: number
    state: C.ArenaState
    time: number
    scenario: string
    createdAt: FirebaseFirestore.FieldValue
    updatedAt: FirebaseFirestore.FieldValue
}

class ArenaModel extends ModelBase {
    constructor() {
        super('Arena');
    }

    private shuffle = (list:Array<any>) => {
        const copied = list.slice();
        for (let i = copied.length - 1; i > 0; i--){
            const r = Math.floor(Math.random() * (i + 1));
            const tmp = copied[i];
            copied[i] = copied[r];
            copied[r] = tmp;
        }
        return copied;
    }

    public createBatch = async (n: number) => {
        const batch = this.firestore.batch();
        for (let i = 0; i < n; i++) {
            const arena:Arena = {
                id: i
                , state: C.ArenaState.WAIT
                , time: -1
                , scenario: ''
                , createdAt: admin.firestore.FieldValue.serverTimestamp()
                , updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            batch.create(this.ref.doc(), arena);
        }
        await this.commit(batch);
    }

    public arenaUpdated = async (areanaId:string) => {
        const arenaSnapshot = await this.firestore.collection('Arena').doc(areanaId).get();
        const arena = arenaSnapshot.data() as Arena;

        if (!arena) return;
        if (arena.state !== 0) return;

        let users = await arenaSnapshot.ref.collection('RoomUser').where('state', '==', 1).get().then((snapshot) => {
            return snapshot.docs.map((value) => {
                const data = value.data();
                data.id = value.id;
                return data;
            })
        });

        if (users.length < 2) return;

        users = this.shuffle(users).slice(0,2);
        const p = [];
        p.push(arenaSnapshot.ref.collection('RoomUser').doc(users[0].id).update({
            state: C.ArenaUserState.ACTOR
        }));
        p.push(arenaSnapshot.ref.collection('RoomUser').doc(users[1].id).update({
            state: C.ArenaUserState.ACTOR
        }));
        p.push(arenaSnapshot.ref.update({
            state: C.ArenaState.READY
            , time: 60
        }));

        await Promise.all(p);
    }
}

export default new ArenaModel();