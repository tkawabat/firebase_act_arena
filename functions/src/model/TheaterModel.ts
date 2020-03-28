import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');
import admin = require('firebase-admin');
import { DocumentData } from '@google-cloud/firestore';

import * as C from '../lib/Const';

import ModelBase from './ModelBase';
import { Scenario } from '../model/ScenarioModel';


export interface TheaterCharacter {
    name: string
    gender: number
    user: string
    userName: string
}
export interface Theater extends DocumentData {
    title: string
    author: string
    scenarioUrl: string
    agreementUrl: string
    agreementScroll: number
    characters: Array<TheaterCharacter>
    minutes: number
    message: string
    endAt: Array<FirebaseFirestore.Timestamp>
    createdAt: FirebaseFirestore.Timestamp
    updatedAt: FirebaseFirestore.Timestamp
}

class TheaterModel extends ModelBase {
    constructor() {
        super('Theater');
    }

    public createId = () => {
        return this.ref.doc().id;
    }

    public calcState = (theater:Theater) :C.TheaterState => {
         // stateと残り時間の計算
         let state:C.TheaterState = C.TheaterState.END;
         const now = Moment().unix();
         for (const [key, value] of theater.endAt.entries()) {
             if (now > value.seconds) continue;
             
             state = key as C.TheaterState;
             break;
         }
         return state;
    }

    public asyncCheckAllActorIsNext = async (snapshot:FirebaseFirestore.DocumentSnapshot) => {
        const theater = snapshot.data() as Theater;
        const RoomUserSnapshot = await snapshot.ref.collection('RoomUser').get();

        const state = this.calcState(theater);
        const nextUser:string[] = [];
        RoomUserSnapshot.docs.forEach((v) => {
            const userState = v.data().next as C.TheaterState;
            if (userState !== state) return;
            nextUser.push(v.id);
        });
        
        return theater.characters.every((v) => {
            return nextUser.indexOf(v.user) !== -1;
        });
    }

    public asyncTransitionState = (id:string, theater:Theater) => {
        const state = this.calcState(theater);
        if (state === C.TheaterState.END) return;

        const t = Moment();
        const endAt = theater.endAt.slice(0);
        endAt[state] = admin.firestore.Timestamp.fromDate(t.toDate());
        return this.ref.doc(id).update({endAt: endAt});
    }

    public asyncCreate = async (id:string, scenario:Scenario, characters:TheaterCharacter[]) => {
        const endAt = [];
        let t = Moment().add(C.TheaterStateTime[C.TheaterState.READ], 'seconds');
        endAt[C.TheaterState.READ] = admin.firestore.Timestamp.fromDate(t.toDate());
        t = Moment(t).add(C.TheaterStateTime[C.TheaterState.CHECK], 'seconds')
        endAt[C.TheaterState.CHECK] = admin.firestore.Timestamp.fromDate(t.toDate());
        t = Moment(t).add(C.TheaterStateTime[C.TheaterState.ACT], 'seconds')
        endAt[C.TheaterState.ACT] = admin.firestore.Timestamp.fromDate(t.toDate());

        const theater = {
            title: scenario.title,
            author: scenario.author,
            scenarioUrl: scenario.scenarioUrl,
            agreementUrl: scenario.agreementUrl,
            agreementScroll: scenario.agreementScroll,
            characters: characters,
            minutes: scenario.minutes,
            message: '',
            endAt: endAt,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        } as Theater;

        return this.ref.doc(id).create(theater).catch(() => {
            console.error('TheaterModel.asyncCreate');
        });
    }

    public roomUserUpdated = async (theaterId:string) => {
        const theaterSnapshot = await this.ref.doc(theaterId).get();
        const theater = theaterSnapshot.data() as Theater;

        if (!theater) {
            console.error('theater not found');
            return;
        }

        const isAllActorNext = await this.asyncCheckAllActorIsNext(theaterSnapshot);

        if (isAllActorNext) {
            console.log('transition state');
            return this.asyncTransitionState(theaterId, theater);
        }

        return;
    }

}

export default new TheaterModel();