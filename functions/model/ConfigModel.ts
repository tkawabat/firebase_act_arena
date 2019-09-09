import * as admin from 'firebase-admin';
import { DocumentData } from '@google-cloud/firestore';

import ModelBase from './ModelBase';
import * as C from '../lib/Const';


interface Config extends DocumentData {
    maintenance: string
    version: string
    createdAt: FirebaseFirestore.Timestamp
    updatedAt: FirebaseFirestore.Timestamp
}

class ConfigModel extends ModelBase {
    constructor() {
        super('Config');
    }
    
    public create = async () => {
        const id = 'config';
        let batch = this.firestore.batch();
        const config: Config = {
            maintenance: '',
            version: '1.0.0',
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
        }
        batch.create(this.ref.doc(id), config);    
        await this.commit(batch);
    }
}

export default new ConfigModel();