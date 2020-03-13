import * as Moment from 'moment';

import * as C from '../lib/Const';
import * as ArrayUtil from '../lib/ArrayUtil';

import MatchingListModel, { MatchingList } from '../model/MatchingListModel';

class MatchingService {

    public decideUsers = (users: Matching[], male:number, female: number, unkown:number) :Matching[] => {
        const ret = [];

        const shuffled = ArrayUtil.shuffle(users) as Matching[];

        const count = {
            [C.Gender.Male]: 0,
            [C.Gender.Female]: 0,
            [C.Gender.Unknown]: 0, // not use
        }
        const limit = {
            [C.Gender.Male]: male + unkown,
            [C.Gender.Female]: female + unkown,
        }
        const sum = male + female + unkown;
        for (const m of shuffled) {
            if (ret.length === sum) break;

            if (m.gender !== C.Gender.Unknown && count[m.gender] >= limit[m.gender]) continue; // 性別上限
            count[m.gender]++;
            ret.push(m);
        }
        return ret;
    }

    public decideCast = (users:Matching[], scenario: Scenario) :Characters[] => {
        const decided = [];
        const characters = scenario.characters.map((v) => {
            return {
                name: v.name,
                gender: v.gender,
                user: '',
                userName: ''
            } as Characters;
        });

        // 不問以外を先に決める
        for (const [i, user] of users.entries()) {
            for (const [j, c] of characters.entries()) {
                if (characters[j].user) continue;
                if (c.gender === C.Gender.Unknown) continue;
                if (c.gender !== user.gender) continue;
                decided.push(user.id);
                characters[j].user = user.id;
                characters[j].userName = user.name;
                break;
            }
        }
        // 不問を決める
        for (const [i, user] of users.entries()) {
            if (decided.indexOf(user.id) !== -1) continue;
            for (const [j, c] of characters.entries()) {
                if (characters[j].user) continue;
                if (c.gender !== C.Gender.Unknown) continue;
                characters[j].user = user.id;
                characters[j].userName = user.name;
                break;
            }
        }

        return characters;
    }

    public decideProgram = async () => {
        let users = await MatchingModel.asyncGet(10);

        users = this.decideUsers(users, 1, 1, 0);

        if (users.length !== 2) {
            console.log('user miss match');
            return;
        }
        console.log('users: ' + users.map((user) => user.name));

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
        scenario.characters = this.decideCast(users, scenario);
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


export default new MatchingService();