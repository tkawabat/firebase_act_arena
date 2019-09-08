import * as admin from 'firebase-admin';
import { DocumentData } from '@google-cloud/firestore';
import * as faker from 'faker';

import ModelBase from './ModelBase';
import * as C from '../lib/Const';


interface User extends DocumentData {
    name: string
    gender: number
    //iconUrl: string
    arena: string
    createdAt: FirebaseFirestore.FieldValue
    updatedAt: FirebaseFirestore.FieldValue
}

class UserModel extends ModelBase {
    constructor() {
        super('User');
    }
    
    public createRondom = async (n: number) => {
        let batch = this.firestore.batch();
        for (let i = 0; i < n; i++) {
            const gender = faker.random.number({min:1, max:2});
            const user: User = {
                name: faker.name.firstName()
                , gender: gender
                //, iconUrl: null
                , arena: ''
                , fake: 1
                , createdAt: admin.firestore.FieldValue.serverTimestamp()
                , updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }
            batch.create(this.ref.doc(), user);
            if (i >= this.batchSize) {
                await this.commit(batch);
                i = 0;
                batch = this.firestore.batch();
            }
        }

        await this.commit(batch);
    }
}

export default new UserModel();