import * as Moment from 'moment';

import * as C from '../lib/Const';
import * as ArrayUtil from '../lib/ArrayUtil';

import MatchingListModel, { MatchingList } from '../model/MatchingListModel';
import ScenarioModel, { Scenario } from '../model/ScenarioModel';
import TheaterModel, { TheaterCharacter, Theater } from '../model/TheaterModel';
import UserModel from '../model/UserModel';
import PushModel from '../model/PushModel';

class MatchingService {

    /**
     * 制約条件が入ったMatchingListを返す。
     * 条件を満たさない場合はnull
     */
    public calcConstraint = (users: MatchingList[]) :MatchingList|null => {
        // 人数チェック
        if (users.length < 2 || users.length >= 6) return null;

        const first = users.slice(0, 1)[0];
        const count = {
            [C.Gender.Male]: 0,
            [C.Gender.Female]: 0,
            [C.Gender.Unknown]: 0, // not use
        }
        const limit = {
            [C.Gender.Male]: 3,
            [C.Gender.Female]: 3,
        }
        
        for (const user of users) {
            // 制約条件更新
            if (first.startAt.seconds <= user.startAt.seconds) {
                first.startAt = user.startAt;
            }
            if (first.endAt.seconds >= user.endAt.seconds) {
                first.endAt = user.endAt;
            }
            first.playNumber.filter((v) => user.playNumber.includes(v));
            first.place.filter((v) => user.place.includes(v));
            count[user.gender]++;

            // 条件確認
            if (first.startAt.seconds + 60 * 60 > first.endAt.seconds) {
                return null;
            }
            if (first.playNumber.length === 0) return null;
            if (first.place.length === 0) return null;
            if (user.gender !== C.Gender.Unknown && count[user.gender] > limit[user.gender]) continue; // 性別上限
            
        }

        return first;
    }

    public makePatterns = (users: MatchingList[]) :MatchingList[][] => {
        let ret:MatchingList[][] = [];

        // 先頭をまず追加
        ret.push([users.shift() as MatchingList]);

        for (const user of users) {
            const added = ret.map((v) => v.concat([user]));
            ret = ret.concat(added);
        }

        return ret;
    }

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
        let users = await MatchingListModel.asyncGetWithTimelimit(15);
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
            p.push(PushModel.asyncSendById('','サシ劇でマッチングしました！', user.id))
        });

        return Promise.all(p);
    }

}


export default new MatchingService();