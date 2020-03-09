import * as admin from 'firebase-admin';
import { DocumentData } from '@google-cloud/firestore';
import * as Moment from 'moment';

import * as C from '../lib/Const';
import * as ArrayUtil from '../lib/ArrayUtil';
import ModelBase from './ModelBase';
import ScenarioModel from './ScenarioModel';

interface Characters {
    name: string
    gender: number
    user: string
    userName: string
}
interface Arena extends DocumentData {
    id: number
    state: C.ArenaState
    title: string
    scenarioUrl: string
    agreementUrl: string
    agreementScroll: number
    characters: Array<Characters>
    startText: string
    endText: string
    message: string
    endAt: Array<FirebaseFirestore.Timestamp>
    createdAt: FirebaseFirestore.Timestamp
    updatedAt: FirebaseFirestore.Timestamp
}

class MatchingModel extends ModelBase {
    constructor() {
        super('Matching');
    }

    // public 

    public decideProgram = async () => {
        let users = await this.ref.limit(10).get().then((snapshot) => {
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
        const scenario = await ScenarioModel.getRandom(male, female);
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

    //     const p = [];
    //     users.forEach((user) => {
    //         p.push(arenaSnapshot.ref.collection('RoomUser').doc(user.id).update({
    //             state: C.ArenaUserState.ACTOR
    //         }));
    //     })

    //     const endAt = [];
    //     let t = Moment().add(C.ArenaStateTime[C.ArenaState.READ], 'seconds');
    //     endAt[C.ArenaState.READ] = t.toDate();
    //     t = Moment(t).add(C.ArenaStateTime[C.ArenaState.CHECK], 'seconds')
    //     endAt[C.ArenaState.CHECK] = t.toDate();
    //     t = Moment(t).add(C.ArenaStateTime[C.ArenaState.ACT], 'seconds')
    //     endAt[C.ArenaState.ACT] = t.toDate();

    //     p.push(arenaSnapshot.ref.update({
    //         //state: C.ArenaState.CONFIRM,
    //         state: C.ArenaState.WAIT, // 一旦使わない
    //         title: scenario.title,
    //         scenarioUrl: scenario.scenarioUrl,
    //         agreementUrl: scenario.agreementUrl,
    //         agreementScroll: scenario.agreementScroll,
    //         characters: scenario.characters,
    //         startText: scenario.startText,
    //         endText: scenario.endText,
    //         message: '',
    //         endAt: endAt,
    //         updatedAt: admin.firestore.Timestamp.now(),
    //     }));

    //     //p.push(this.transition2confirm(arenaSnapshot.ref));
    //     await Promise.all(p);
    }

}

export default new MatchingModel();