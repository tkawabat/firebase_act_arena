import * as Moment from 'moment';
import * as admin from 'firebase-admin';
import { DocumentData } from '@google-cloud/firestore';

import * as C from '../lib/Const';

import ModelBase from './ModelBase';


export interface MatchingList {
    id: string;
    name: string;
    gender: C.Gender;
    playNumber: Array<number>;
    playTime: Array<C.MatchingPlayTime>;
    place: Array<C.MatchingPlace>;
    startAt: FirebaseFirestore.Timestamp;
    endAt: FirebaseFirestore.Timestamp;
    createdAt: FirebaseFirestore.Timestamp;
}

class MatchingListModel extends ModelBase {
    constructor() {
        super('MatchingList');
    }

    public asyncGetWithTimelimit = async (limit:number) :Promise<MatchingList[]> => {
        const timeLimit = admin.firestore.Timestamp.fromDate(Moment().add(-1 * C.MatchingTime, 'seconds').toDate());

        return this.ref
            .where('createdAt', '>=', timeLimit)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get().then((snapshot) => {
                return snapshot.docs.map((value) => {
                    const data = value.data();
                    return {
                        id: value.id,
                        name: data.name,
                        gender: data.gender,
                        playNumber: data.playNumber,
                        playTime: data.minutes,
                        place: data.place,
                        startAt: data.createdAt,
                        endAt: data.createdAt,
                        createdAt: data.createdAt,
                    };
                })
            });
    }

}

export default new MatchingListModel();