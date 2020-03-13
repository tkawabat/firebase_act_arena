import * as Moment from 'moment';
import { DocumentData } from '@google-cloud/firestore';

import * as C from '../lib/Const';

import ModelBase from './ModelBase';


export interface MatchingList {
    id: string;
    name: string;
    gender: C.Gender;
}

class MatchingListModel extends ModelBase {
    constructor() {
        super('MatchingList');
    }

    public asyncGet = async (limit:number) => {
        return this.ref.limit(limit).get().then((snapshot) => {
            return snapshot.docs.map((value) => {
                const data = value.data();
                return {
                    id: value.id,
                    name: data.name,
                    gender: data.gender
                } as MatchingList;
            })
        });
    }

}

export default new MatchingListModel();