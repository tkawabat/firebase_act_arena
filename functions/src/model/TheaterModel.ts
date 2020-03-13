import * as Moment from 'moment';
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

    public asyncGet = async (id:string) => {
        return this.ref.doc(id).get();
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
            message: '',
            endAt: endAt,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        } as Theater;

        return this.ref.doc(id).create(theater).catch(() => {
            console.error('TheaterModel.asyncCreate');
        });
    }

}

export default new TheaterModel();