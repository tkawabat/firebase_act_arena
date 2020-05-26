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


describe('MatchingService.calcConstraint', () => {
    const defaultUser = {
        id: 'id01',
        gender: C.Gender.Male,
        playNumber: [2,3,4,5,6],
        minutes: [C.MatchingHour.HALF,C.MatchingHour.ONE],
        place: [C.MatchingPlace.ACTARENA, C.MatchingPlace.DISCORD],
        startAt: admin.firestore.Timestamp.fromDate(Moment('2020-01-01 09:00:00').toDate()),
        endAt: admin.firestore.Timestamp.fromDate(Moment('2020-01-01 10:00:00').toDate()),
    } as MatchingList;
    const defaultInput = [
        {...defaultUser} as MatchingList,
        {...defaultUser} as MatchingList,
        {...defaultUser} as MatchingList,
        {...defaultUser} as MatchingList,
        {...defaultUser} as MatchingList,
    ];
    defaultInput[1].id = 'id02';
    defaultInput[2].id = 'id03';
    defaultInput[3].id = 'id04';
    defaultInput[4].id = 'id05';
    defaultInput[3].gender = C.Gender.Female;
    defaultInput[4].gender = C.Gender.Female;

    it('正常系', () => {
        const actual = MatchingService.calcConstraint(defaultInput) as MatchingList;
        expect(actual.startAt.seconds).toBe(Moment('2020-01-01 09:00:00').unix());
        expect(actual.endAt.seconds).toBe(Moment('2020-01-01 10:00:00').unix());
        expect(actual.place).toEqual([C.MatchingPlace.ACTARENA, C.MatchingPlace.DISCORD]);
        expect(actual.playNumber).toEqual([2,3,4,5,6]);
    });

    it('null 0人', () => {
        const input:MatchingList[] = [];
        const actual = MatchingService.calcConstraint(input) as MatchingList;
        expect(actual).toBe(null);
    });

    it('null 1人', () => {
        const input = defaultInput.slice(0,1);
        const actual = MatchingService.calcConstraint(input) as MatchingList;
        expect(actual).toBe(null);
    });

    it('null 6人', () => {
        const input = defaultInput.slice();
        input[5] =  {...defaultUser} as MatchingList;
        input[5].id = 'id06';
        input[5].gender = C.Gender.Female;
        const actual = MatchingService.calcConstraint(input) as MatchingList;
        expect(actual).toBe(null);
    });

    it('null startAt', () => {
        const input = defaultInput.slice();
        input[1].startAt = admin.firestore.Timestamp.fromDate(Moment('2020-01-01 09:00:01').toDate());
        const actual = MatchingService.calcConstraint(input) as MatchingList;
        expect(actual).toBe(null);
    });

    it('null endAt', () => {
        const input = defaultInput.slice();
        input[2].endAt = admin.firestore.Timestamp.fromDate(Moment('2020-01-01 09:59:59').toDate());
        const actual = MatchingService.calcConstraint(input) as MatchingList;
        expect(actual).toBe(null);
    });

    it('null minutes', () => {
        const input = defaultInput.slice();
        input[3].minutes = [C.MatchingHour.HALF];
        input[4].minutes = [C.MatchingHour.ONE];
        const actual = MatchingService.calcConstraint(input) as MatchingList;
        expect(actual).toBe(null);
    });

    it('null playNumber', () => {
        const input = defaultInput.slice();
        input[3].playNumber = [2,3];
        input[4].playNumber = [4,5];
        const actual = MatchingService.calcConstraint(input) as MatchingList;
        expect(actual).toBe(null);
    });

    it('null endAt', () => {
        const input = defaultInput.slice();
        input[2].place = [C.MatchingPlace.ACTARENA];
        input[3].place = [C.MatchingPlace.DISCORD];
        const actual = MatchingService.calcConstraint(input) as MatchingList;
        expect(actual).toBe(null);
    });

    it('null gender', () => {
        const input = defaultInput.slice();
        input[3].gender = C.Gender.Male;
        const actual = MatchingService.calcConstraint(input) as MatchingList;
        expect(actual).toBe(null);
    });
});

describe('MatchingService.makePatterns', () => {

    it('0件', () => {
        const input:MatchingList[] = [];

        const actual = MatchingService.makePatterns(input);
        expect(actual).toEqual([]);
    });

    it('1件', () => {
        const input = [
            { id: 'id01' } as MatchingList,
        ];

        const actual = MatchingService.makePatterns(input);
        expect(actual).toEqual([]);
    });

    it('2件', () => {
        const input = [
            { id: 'id01' } as MatchingList,
            { id: 'id02' } as MatchingList,
        ];

        const actual = MatchingService.makePatterns(input);
        expect(actual).toEqual([
            [ { id: 'id01' }, ],
            [ { id: 'id01' }, { id: 'id02' }, ],
        ]);
    });

    it('3件', () => {
        const input = [
            { id: 'id01' } as MatchingList,
            { id: 'id02' } as MatchingList,
            { id: 'id03' } as MatchingList,
        ];

        const actual = MatchingService.makePatterns(input);
        expect(actual).toEqual([
            [ { id: 'id01' }, ],
            [ { id: 'id01' }, { id: 'id02' }, ],
            [ { id: 'id01' }, { id: 'id03' }, ],
            [ { id: 'id01' }, { id: 'id02' }, { id: 'id03' }, ],
        ]);
    });
});

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