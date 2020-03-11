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
        const config: Config = {
            maintenance: '',
            version: '1.0.0',
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
        }
        await this.ref.doc(id).set(config);
    }
}

export default new ConfigModel();