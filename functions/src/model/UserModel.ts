import * as admin from 'firebase-admin';
import { DocumentData } from '@google-cloud/firestore';
import * as faker from 'faker';

import ModelBase from './ModelBase';
import * as C from '../lib/Const';


export interface User extends DocumentData {
    name: string
    gender: number
    iconUrl: string
    arena: string
    theater: string
    ngList: Array<String>
    createdAt: FirebaseFirestore.FieldValue
    updatedAt: FirebaseFirestore.FieldValue
}

class UserModel extends ModelBase {
    constructor() {
        super('User');
    }

    public disconnected = async (documentData:FirebaseFirestore.DocumentData, userId:string) :Promise<any> => {
        const p = [];

        // matching
        p.push(this.firestore.collection('MatchingList').doc(userId).delete()
            .catch(() => {
                console.error('Matching delete');
            }));

        // arena
        if (documentData.arena && documentData.arena !== '') {
            p.push(this.firestore.collection('Arena').doc(documentData.arena).collection('RoomUser').doc(userId).delete()
            .then(() => console.log('ArenaRoomUser delete'))
            .catch(() => {
                console.error('ArenaRoomUser delete');
            }));
        }

        // theater
        if (documentData.theater && documentData.theater !== '') {
            p.push(this.firestore.collection('Theater').doc(documentData.theater).collection('RoomUser').doc(userId).delete()
            .then(() => console.log('TheaterRoomUser delete'))
            .catch(() => {
                console.error('TheaterRoomUser delete');
            }));
        }

        return Promise.all(p);
    }
    
    public createRondom = async (n: number) => {
        if (n >= 1000) {
            console.error('too many.');
            return;
        }

        const batch = [];
        for (let i = 0; i < n; i++) {
            const gender = faker.random.number({min:1, max:2});
            const user: User = {
                name: faker.name.firstName(),
                gender: gender,
                iconUrl: '',
                arena: '',
                theater: '',
                ngList: [],
                fake: 1,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }
            batch.push({id: null, data:user})
        }

        await this.asyncBatch(C.BatchType.Create, batch);
    }

    public updated = async (before:FirebaseFirestore.DocumentData, after:FirebaseFirestore.DocumentData, userId:string) => {
        if (before.connect as boolean === true && after.connect as boolean === false) {
            return this.disconnected(after, userId);
        }
    }

    public asyncUpdateTheater = async (userId:string, theater: string) => {
        return this.ref.doc(userId).update({
            theater: theater
        }).catch(() => {
            console.error('UserModel.asyncSetTheater');
        })
    }
}

export default new UserModel();