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
    message: string
    createdAt: FirebaseFirestore.Timestamp
    updatedAt: FirebaseFirestore.Timestamp
}

class ArenaModel extends ModelBase {
    constructor() {
        super('Arena');
    }

    private getState = async (id:string) :Promise<C.ArenaState> => {
        return this.firestore.collection('Arena').doc(id).get()
        .then((snapshot) => {
            const data = snapshot.data();
            if (!data) return null;
            return data.state;
        })
        .catch((err) => console.error('get arena state '+id))
        ;
    }

    private transition2confirm = (arena:FirebaseFirestore.DocumentReference) :Promise<any> => {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                const state = await this.getState(arena.id);
                if (!state || state !== C.ArenaState.CONFIRM) return;

                const endAt = Moment().add(C.ArenaStateTime[C.ArenaState.CHECK], 'seconds').toDate();
                arena.update({
                    state: C.ArenaState.CHECK,
                    endAt: admin.firestore.Timestamp.fromDate(endAt),
                    message: '台本チェック',
                    updatedAt: admin.firestore.Timestamp.now(),
                })
                .then(resolve, reject)
                .catch(() => console.error('stateTransition update Arena'))
                ;
            }, C.ArenaStateTime[C.ArenaState.CONFIRM] * 1000);
        })
        .catch((err) => console.error('promise'))
        ;
    }

    public decideProgram = async (arenaSnapshot:FirebaseFirestore.DocumentSnapshot) => {
        const arena = arenaSnapshot.data();
        if (!arena) return;
        if (Moment(arena.endAt.toDate()).isAfter(Moment())) return;

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
        const endAt = Moment()
            .add(C.ArenaStateTime[C.ArenaState.CONFIRM], 'seconds')
            .add(C.ArenaStateTime[C.ArenaState.CHECK], 'seconds')
            .add(C.ArenaStateTime[C.ArenaState.ACT], 'seconds')
            .toDate()
        ;
        p.push(arenaSnapshot.ref.update({
            //state: C.ArenaState.CONFIRM,
            state: C.ArenaState.WAIT, // 一旦使わない
            endAt: admin.firestore.Timestamp.fromDate(endAt),
            title: scenario.title,
            scenarioUrl: scenario.scenarioUrl,
            agreementUrl: scenario.agreementUrl,
            agreementScroll: scenario.agreementScroll,
            characters: scenario.characters,
            startText: scenario.startText,
            endText: scenario.endText,
            message: '',
            updatedAt: admin.firestore.Timestamp.now(),
        }));

        //p.push(this.transition2confirm(arenaSnapshot.ref));
        await Promise.all(p);
    }

    private asyncTerminateAct = async (arena:FirebaseFirestore.DocumentReference, message:string) => {
        const p = [];

        const snapshot = await arena.get();
        const data = snapshot.data();
        if (data !== undefined) {
            for (const c of data.characters) {
                p.push(arena.collection('RoomUser').doc(c.user).update({
                    state: C.ArenaUserState.LISTNER
                })
                .catch(() => { console.error('asyncTerminateAct update RoomUser') })
                );
            }
        }

        p.push(this.ref.doc(arena.id).update({
            state: C.ArenaState.WAIT,
            endAt: admin.firestore.Timestamp.fromDate(Moment().add(-1, 'seconds').toDate()),
            title: '',
            scenarioUrl: '',
            agreementUrl: '',
            agreementScroll: -1,
            characters: [],
            startText: '',
            endText: '',
            message: message,
            updatedAt: admin.firestore.Timestamp.now(),
        })
        .catch(() => { console.error('asyncTerminateAct update Arena') })
        );

        return Promise.all(p);
    }

    public stateTransition = async (before:FirebaseFirestore.DocumentData, after:FirebaseFirestore.DocumentData, arenaId:string) => {
        const snapshot = await this.firestore.collection('Arena').doc(arenaId).get();
        await this.decideProgram(snapshot);
    }

    public createBatch = async (n: number) => {
        const batch = this.firestore.batch();
        for (let i = 0; i < n; i++) {
            const arena:Arena = {
                id: i,
                state: C.ArenaState.WAIT,
                endAt: admin.firestore.Timestamp.fromDate(Moment().add(-1, 'seconds').toDate()),
                title: '',
                scenarioUrl: '',
                agreementUrl: '',
                agreementScroll: -1,
                characters: [],
                startText: '',
                endText: '',
                message: '',
                createdAt: admin.firestore.Timestamp.now(),
                updatedAt: admin.firestore.Timestamp.now(),
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

    public roomUserDeleted = async (roomUser:admin.firestore.DocumentData, arenaId:string) => {
        if (roomUser.state as C.ArenaUserState !== C.ArenaUserState.ACTOR) return;

        const arena = await this.ref.doc(arenaId);
        await this.asyncTerminateAct(arena, '演者の接続エラー\n上演を強制終了します');
    }

    public checkAndDeleteChat = async (arenaId:string) => {
        const chat = this.firestore.collection('Arena').doc(arenaId).collection('Chat');
        const querySnapshot = await chat.orderBy('createdAt').get();
        const n = querySnapshot.size - C.ChatMax;
        if (!n) return;

        const p = [];
        for (let i = 0; i < n; i++) {
            console.log('delete chat '+querySnapshot.docs[i].id);
            p.push(chat.doc(querySnapshot.docs[i].id).delete());
        }
        await Promise.all(p)
        .catch((err) => console.error('delete chat error'))
        ;
    }
}

export default new ArenaModel();