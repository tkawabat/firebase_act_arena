import * as Moment from 'moment';

import * as C from '../lib/Const';
import * as ArrayUtil from '../lib/ArrayUtil';

import MatchingListModel, { MatchingList } from '../model/MatchingListModel';
import ScenarioModel, { Scenario } from '../model/ScenarioModel';
import TheaterModel, { TheaterCharacter, Theater } from '../model/TheaterModel';
import UserModel from '../model/UserModel';

class MatchingService {

    public decideUsers = (users: MatchingList[], male:number, female: number, unkown:number) :MatchingList[] => {
        const ret = [];

        const shuffled = ArrayUtil.shuffle(users) as MatchingList[];

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

    public decideCast = (users:MatchingList[], scenario: Scenario) :TheaterCharacter[] => {
        const decided = [];
        const characters = scenario.characters.map((v) => {
            return {
                name: v.name,
                gender: v.gender,
                user: '',
                userName: ''
            } as TheaterCharacter;
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
        // 演者決め
        let users = await MatchingListModel.asyncGet(10);
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
        const characters = this.decideCast(users, scenario);
        console.log(scenario);

        // update data
        const p = [];
        const theaterId = TheaterModel.createId();
        p.push(TheaterModel.asyncCreate(theaterId, scenario, characters));
        users.forEach((user) => {
            p.push(UserModel.asyncUpdateTheater(user.id, theaterId));
            p.push(MatchingListModel.asyncDeleteById(user.id));
        });
        
    }

}


export default new MatchingService();