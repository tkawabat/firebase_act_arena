import * as admin from 'firebase-admin';
import { DocumentData } from '@google-cloud/firestore';

import * as C from '../lib/Const';
import * as ArrayUtil from '../lib/Array';
import ModelBase from './ModelBase';
import ArenaScenarioModel from './ArenaScenarioModel';

interface Charactors {
    name: string
    gender: number
    user: string
}
interface Arena extends DocumentData {
    id: number
    state: C.ArenaState
    startAt: FirebaseFirestore.FieldValue
    title: string
    scenarioUrl: string
    agreementUrl: string
    agreementScroll: number
    characters: Array<Charactors>
    startText: string
    endText: string
    createdAt: FirebaseFirestore.FieldValue
    updatedAt: FirebaseFirestore.FieldValue
}

class ArenaModel extends ModelBase {
    constructor() {
        super('Arena');
    }

    private decideProgram = async (arenaSnapshot:FirebaseFirestore.DocumentSnapshot) => {
        // 演者決め
        let users = await arenaSnapshot.ref.collection('RoomUser').where('state', '==', 1).get().then((snapshot) => {
            return snapshot.docs.map((value) => {
                const data = value.data();
                data.id = value.id;
                return data;
            })
        });
        if (users.length < 2) {
            console.log('users < 2');
            return;
        }
        users = ArrayUtil.shuffle(users).slice(0,2);
        console.log('users: '+users.map((user) => user.name));
        
        // 台本決め
        let male = 0;
        let female = 0;
        for (const u of users) {
            if (u.gender === C.Gender.Male) male++;
            else if (u.gender === C.Gender.Female) female++;
        }
        const scenario = await ArenaScenarioModel.getRandom(male, female);
        if (!scenario) {
            console.error('scenario not found');
            return;
        }

        // 役決め
        // 不問以外を先に決める
        for (const [i, user] of users.entries()) {
            for (const [j, character] of scenario.characters.entries()) {
                if (character.gender === C.Gender.Unknown) continue;
                if (character.gender !== user.gender) continue;
                users[i].character = character;
                scenario.characters[j].user = user.id;
                break;
            }
        }
        // 不問を決める
        for (const [i, user] of users.entries()) {
            for (const [j, character] of scenario.characters.entries()) {
                if (character.gender !== C.Gender.Unknown) continue;
                if (user.character) continue;
                users[i].character = character;
                scenario.characters[j].user = user.id;
                break;
            }
        }
        console.log(scenario);

        const p = [];
        users.forEach((user) => {
            p.push(arenaSnapshot.ref.collection('RoomUser').doc(user.id).update({
                state: C.ArenaUserState.ACTOR
            }));
        })
        p.push(arenaSnapshot.ref.update({
            state: C.ArenaState.READY
            , startAt: admin.firestore.FieldValue.serverTimestamp()
            , title: scenario.title
            , scenarioUrl: scenario.scenarioUrl
            , agreementUrl: scenario.agreementUrl
            , agreementScroll: scenario.agreementScroll
            , characters: scenario.characters
            , startText: scenario.startText
            , endText: scenario.endText
            , updateAt: admin.firestore.FieldValue.serverTimestamp()
        }));

        await Promise.all(p);
    }

    public createBatch = async (n: number) => {
        const batch = this.firestore.batch();
        for (let i = 0; i < n; i++) {
            const arena:Arena = {
                id: i
                , state: C.ArenaState.WAIT
                , startAt: admin.firestore.FieldValue.serverTimestamp()
                , title: ''
                , scenarioUrl: ''
                , agreementUrl: ''
                , agreementScroll: -1
                , characters: []
                , startText: ''
                , endText: ''
                , createdAt: admin.firestore.FieldValue.serverTimestamp()
                , updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            batch.create(this.ref.doc(), arena);
        }
        await this.commit(batch);
    }

    public roomUserUpdated = async (arenaId:string) => {
        const arenaSnapshot = await this.firestore.collection('Arena').doc(arenaId).get();
        const arena = arenaSnapshot.data() as Arena;

        if (!arena) {
            console.error('arena not found');
            return;
        }
        if (arena.state === 0) {
            console.log('state is WAIT');
            await this.decideProgram(arenaSnapshot);
        }
    }
}

export default new ArenaModel();