import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
admin.initializeApp(functions.config().firebase);

import * as C from '../../lib/Const';
import * as ArrayUtil from '../../lib/ArrayUtil';

import MatchingService from '../MatchingService';
import { ScenarioCharacter, Scenario } from '../../model/ScenarioModel';
import { MatchingList } from '../../model/MatchingListModel';


describe('MatchingService.decideUsers', () => {

    it('2:1 1:1 マッチング成功', () => {
        jest.spyOn(ArrayUtil, 'shuffle').mockImplementation(() => [
            { id: 'id01', name: 'hoge', gender: C.Gender.Male },
            { id: 'id02', name: 'hoge', gender: C.Gender.Male },
            { id: 'id03', name: 'hoge', gender: C.Gender.Female }
        ]);

        const actual = MatchingService.decideUsers([], 1, 1, 0);
        expect(actual).toEqual([
            { id: 'id01', name: 'hoge', gender: C.Gender.Male },
            { id: 'id03', name: 'hoge', gender: C.Gender.Female }
        ]);

    });

    it('3:0 1:1 マッチング失敗', () => {
        jest.spyOn(ArrayUtil, 'shuffle').mockImplementation(() => [
            { id: 'id01', name: 'hoge', gender: C.Gender.Male },
            { id: 'id02', name: 'hoge', gender: C.Gender.Male },
            { id: 'id03', name: 'hoge', gender: C.Gender.Male },
        ]);

        const actual = MatchingService.decideUsers([], 1, 1, 0);
        expect(actual).toEqual([
            { id: 'id01', name: 'hoge', gender: C.Gender.Male },
        ]);
    });

    it('3:2 1:1:1 マッチング成功', () => {
        jest.spyOn(ArrayUtil, 'shuffle').mockImplementation(() => [
            { id: 'id01', name: 'hoge', gender: C.Gender.Male },
            { id: 'id02', name: 'hoge', gender: C.Gender.Male },
            { id: 'id03', name: 'hoge', gender: C.Gender.Male },
            { id: 'id04', name: 'hoge', gender: C.Gender.Female },
            { id: 'id05', name: 'hoge', gender: C.Gender.Female },
        ]);

        const actual = MatchingService.decideUsers([], 1, 1, 1);
        expect(actual).toEqual([
            { id: 'id01', name: 'hoge', gender: C.Gender.Male },
            { id: 'id02', name: 'hoge', gender: C.Gender.Male },
            { id: 'id04', name: 'hoge', gender: C.Gender.Female },
        ]);
    });
});

describe('MatchingService.decideCasting', () => {
    const scenario = {
        title: '',
        author: '',
        scenarioUrl: '',
        agreementUrl: '',
        agreementScroll: 0,
        characters: [],
        genderRate: [],
        minutes: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    } as Scenario;

    it('性別ごとに正しく配役', () => {
        const users = [
            { id: 'id01', name: 'hoge', gender: C.Gender.Male } as MatchingList,
            { id: 'id02', name: 'hoge', gender: C.Gender.Female } as MatchingList,
        ];
        const characaters =  [
            {name: 'a', gender: C.Gender.Female},
            {name: 'b', gender: C.Gender.Male},
        ];
        scenario.characters = characaters;

        const actual = MatchingService.decideCast(users, scenario);
        expect(actual).toEqual([
            {name: 'a', gender: C.Gender.Female, user: 'id02', userName: 'hoge'},
            {name: 'b', gender: C.Gender.Male, user: 'id01', userName: 'hoge'},
        ]);
    });

    it('不問はあとで決める', () => {
        const users = [
            { id: 'id01', name: 'hoge', gender: C.Gender.Male } as MatchingList,
            { id: 'id02', name: 'hoge', gender: C.Gender.Female } as MatchingList,
            { id: 'id03', name: 'hoge', gender: C.Gender.Female } as MatchingList,
        ];
        const characaters =  [
            {name: 'a', gender: C.Gender.Unknown},
            {name: 'b', gender: C.Gender.Female},
            {name: 'c', gender: C.Gender.Male},
        ];
        scenario.characters = characaters;

        const actual = MatchingService.decideCast(users, scenario);
        expect(actual).toEqual([
            {name: 'a', gender: C.Gender.Unknown, user: 'id03', userName: 'hoge'},
            {name: 'b', gender: C.Gender.Female, user: 'id02', userName: 'hoge'},
            {name: 'c', gender: C.Gender.Male, user: 'id01', userName: 'hoge'},
        ]);
    });
});