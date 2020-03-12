import * as admin from 'firebase-admin';
import { DocumentData } from '@google-cloud/firestore';
import * as Moment from 'moment';

import * as C from '../lib/Const';

import ModelBase from './ModelBase';


export interface Matching {
    id: string;
    name: string;
    gender: C.Gender;
}
export interface Characters {
    name: string
    gender: number
    user: string
    userName: string
}
interface Theater extends DocumentData {
    title: string
    author: string
    scenarioUrl: string
    agreementUrl: string
    agreementScroll: number
    characters: Array<Characters>
    message: string
    endAt: Array<FirebaseFirestore.Timestamp>
    createdAt: FirebaseFirestore.Timestamp
    updatedAt: FirebaseFirestore.Timestamp
}

class MatchingModel extends ModelBase {
    constructor() {
        super('Matching');
    }

    public asyncGet = async (limit:number) => {
        return this.ref.limit(limit).get().then((snapshot) => {
            return snapshot.docs.map((value) => {
                const data = value.data();
                return {
                    id: value.id,
                    name: data.name,
                    gender: data.gender
                } as Matching;
            })
        });
    }

}

export default new MatchingModel();