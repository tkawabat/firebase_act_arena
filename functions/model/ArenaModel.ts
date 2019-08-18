import * as admin from 'firebase-admin';
import { DocumentData } from '@google-cloud/firestore';

import ModelBase from './ModelBase';


interface Arena extends DocumentData {
    id: number
    users: Array<string>
    state: number
    time: number
    scenario: string
    createdAt: FirebaseFirestore.FieldValue
    updatedAt: FirebaseFirestore.FieldValue
}

class ArenaModel extends ModelBase {
    constructor() {
        super('Arena');
    }

    // 作成用関数
    public create = async (n: number) => {
        const batch = this.db.batch();
        for (let i = 0; i < n; i++) {
            const arena:Arena = {
                id: i
                , users: []
                , state: 0
                , time: -1
                , scenario: ''
                , createdAt: admin.firestore.FieldValue.serverTimestamp()
                , updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            batch.create(this.ref.doc(), arena);
        }
        await this.commit(batch);
    }
}

export default new ArenaModel();