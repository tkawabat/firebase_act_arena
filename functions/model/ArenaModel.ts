import * as admin from 'firebase-admin';
import { DocumentData } from '@google-cloud/firestore';
import * as Moment from 'moment';

import * as C from '../lib/Const';
import * as ArrayUtil from '../lib/Array';
import ModelBase from './ModelBase';
import ArenaScenarioModel from './ArenaScenarioModel';

interface Characters {
    name: string
    gender: number
    user: string
    userName: string
}
interface Arena extends DocumentData {
    id: number
    state: C.ArenaState
    endAt: FirebaseFirestore.Timestamp
    title: string
    scenarioUrl: string
    agreementUrl: string
    agreementScroll: number
    characters: Array<Characters>
    startText: string
    endText: string
    createdAt: FirebaseFirestore.Timestamp
    updatedAt: FirebaseFirestore.Timestamp
}

class ArenaModel extends ModelBase {
    constructor() {
        super('Arena');
    }

    private transition2confirm = (arena:FirebaseFirestore.DocumentReference) :Promise<any> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                arena.update({
                    state: C.ArenaState.CHECK
                    , endAt: admin.firestore.Timestamp.fromDate(Moment().add(C.ArenaStateTime[C.ArenaState.CHECK], 'seconds').toDate())
                    , updatedAt: admin.firestore.Timestamp.now()
                })
                .then(resolve, reject)
                .catch(() => console.error('stateTransition update Arena'))
                ;
            }, C.ArenaStateTime[C.ArenaState.CONFIRM] * 1000);
        })
        .catch((err) => console.error('promise'))
        ;
    }

    private transition2check = (arena:FirebaseFirestore.DocumentReference) :Promise<any> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                arena.update({
                    state: C.ArenaState.ACT
                    , endAt: admin.firestore.Timestamp.fromDate(Moment().add(C.ArenaStateTime[C.ArenaState.ACT], 'seconds').toDate())
                    , updatedAt: admin.firestore.Timestamp.now()
                })
                .then(resolve, reject)
                .catch(() => console.error('stateTransition update Arena'))
                ;
            }, C.ArenaStateTime[C.ArenaState.CHECK] * 1000);
        })
        .catch((err) => console.error('promise'))
        ;
    }

    private transition2act = (arena:FirebaseFirestore.DocumentReference, after: FirebaseFirestore.DocumentData) :Promise<any> => {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                const p = [];
                for (const c of after.characters) {
                    p.push(arena.collection('RoomUser').doc(c.user).update({
                        state: C.ArenaUserState.LISTNER
                    }).catch(() => {console.error('transition2act update RoomUser')}));
                }
                p.push(arena.update({
                    state: C.ArenaState.WAIT
                    , endAt: admin.firestore.Timestamp.fromDate(Moment().add(-1, 'seconds').toDate())
                    , title: ''
                    , scenarioUrl: ''
                    , agreementUrl: ''
                    , agreementScroll: -1
                    , characters: []
                    , startText: ''
                    , endText: ''
                    , updatedAt: admin.firestore.Timestamp.now()
                }).catch(() => {console.error('transition2act update Arena')}));

                await Promise.all(p)
                .then(resolve, reject)
                .catch(() => console.error('stateTransition update Arena'))
                ;
            }, C.ArenaStateTime[C.ArenaState.ACT] * 1000);
        })
        .catch((err) => console.error('promise'))
        ;
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
                if (scenario.characters[j].user) continue;
                if (character.gender === C.Gender.Unknown) continue;
                if (character.gender !== user.gender) continue;
                users[i].character = character;
                scenario.characters[j].user = user.id;
                scenario.characters[j].userName = user.name;
                break;
            }
        }
        // 不問を決める
        for (const [i, user] of users.entries()) {
            for (const [j, character] of scenario.characters.entries()) {
                if (scenario.characters[j].user) continue;
                if (character.gender !== C.Gender.Unknown) continue;
                if (user.character) continue;
                scenario.characters[j].user = user.id;
                scenario.characters[j].userName = user.name;
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
            state: C.ArenaState.CONFIRM
            , endAt: admin.firestore.Timestamp.fromDate(Moment().add(C.ArenaStateTime[C.ArenaState.CONFIRM], 'seconds').toDate())
            , title: scenario.title
            , scenarioUrl: scenario.scenarioUrl
            , agreementUrl: scenario.agreementUrl
            , agreementScroll: scenario.agreementScroll
            , characters: scenario.characters
            , startText: scenario.startText
            , endText: scenario.endText
            , updatedAt: admin.firestore.Timestamp.now()
        }));

        p.push(this.transition2confirm(arenaSnapshot.ref));
        await Promise.all(p);
    }

    public stateTransition = async (before:FirebaseFirestore.DocumentData, after:FirebaseFirestore.DocumentData, arenaId:string) => {
        console.log('before: '+before.state+', after: '+after.state);
        if (before.state === after.state) return;
        const state = after.state as C.ArenaState;
        ;

        const arena = this.firestore.collection('Arena').doc(arenaId);
        switch (state) {
            case C.ArenaState.WAIT:
                const snapshot = await this.firestore.collection('Arena').doc(arenaId).get();
                await this.decideProgram(snapshot);
                break;
            case C.ArenaState.CHECK:
                await this.transition2check(arena);
                break;
            case C.ArenaState.ACT:
                await this.transition2act(arena, after);
                break;
        }
    }

    public createBatch = async (n: number) => {
        const batch = this.firestore.batch();
        for (let i = 0; i < n; i++) {
            const arena:Arena = {
                id: i
                , state: C.ArenaState.WAIT
                , endAt: admin.firestore.Timestamp.fromDate(Moment().add(-1, 'seconds').toDate())
                , title: ''
                , scenarioUrl: ''
                , agreementUrl: ''
                , agreementScroll: -1
                , characters: []
                , startText: ''
                , endText: ''
                , createdAt: admin.firestore.Timestamp.now()
                , updatedAt: admin.firestore.Timestamp.now()
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