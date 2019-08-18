import * as admin from 'firebase-admin';
import { DocumentData } from '@google-cloud/firestore';
import * as faker from 'faker';

import ModelBase from './ModelBase';


interface User extends DocumentData {
    name: string
    gender: number
    iconUrl: string
    createdAt: FirebaseFirestore.FieldValue
    updatedAt: FirebaseFirestore.FieldValue
}

class UserModel extends ModelBase {
    constructor() {
        super('User');
    }
    
    public createFunctions = async (uid:string) => {
        // const user:User = {
        //     name: null
        //     , gender: -1
        //     , iconUrl: null
        //     ,
        // }
        // const ref = this.db.doc(uid);
        
        // await this.commit(batch);
    }
}

export default new UserModel();