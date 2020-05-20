import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');
import * as test from 'firebase-functions-test';
import * as admin from 'firebase-admin';

import * as Index from '../index';

import * as C from '../lib/Const';

import MatchingListModel, { MatchingList } from '../model/MatchingListModel';
import ScenarioModel, { Scenario } from '../model/ScenarioModel';
import TheaterModel from '../model/TheaterModel';
import UserModel from '../model/UserModel';
import PushModel from '../model/PushModel';


describe('index.matchingListCreated', () => {
    const defaultUser = {
        id: 'id01',
        name: 'name01',
        gender: C.Gender.Male,
        playNumber: [2,3,4,5,6],
        minutes: [C.MatchingMinutes.HALF,C.MatchingMinutes.ONE],
        place: [C.MatchingPlace.ACTARENA, C.MatchingPlace.DISCORD],
        startAt: admin.firestore.Timestamp.fromDate(Moment('2020-01-01 09:00:00').toDate()),
        endAt: admin.firestore.Timestamp.fromDate(Moment('2020-01-01 10:00:00').toDate()),
    } as MatchingList;

    beforeEach(async () => {
        const p = [];
        p.push(MatchingListModel.batchDeleteAll());
        p.push(ScenarioModel.batchDeleteAll());
        p.push(TheaterModel.batchDeleteAll());
        p.push(UserModel.batchDeleteAll());
        await Promise.all(p);
    });
    afterEach(() => {
        test().cleanup();
    });

    it('1:1マッチング', async () => {
        const p = [];

        const theaterId = 'theater01';

        const input = [
            {...defaultUser} as MatchingList,
            {...defaultUser} as MatchingList,
        ];
        input[1].id = 'id02';
        input[1].gender = C.Gender.Female;

        p.push(UserModel.ref.doc(input[0].id).set({}));
        p.push(UserModel.ref.doc(input[1].id).set({}));
        const scenario = {
            title: 'title01',
            author: 'hoge',
            scenarioUrl: 'hoge',
            agreementUrl: 'hoge',
            agreementScroll: 0,
            characters: [
                {name: 'character01', gender: C.Gender.Female},
                {name: 'character02', gender: C.Gender.Male},
            ],
            genderRate: ['1:1'],
            minutes: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        } as Scenario;
        p.push(ScenarioModel.ref.doc().set(scenario));

        await Promise.all(p);

        TheaterModel.createId = jest.fn(() => theaterId);
        MatchingListModel.asyncGetWithTimelimit = jest.fn().mockResolvedValue(input);
        const pushMock = jest.fn();
        PushModel.asyncSendById = pushMock;

        const wrapped = test().wrap(Index.matchingListCreated);
        const snapshot = test().firestore.makeDocumentSnapshot({}, 'MatchingList/aaa/'+input[0].id);

        await wrapped(snapshot, {
            params: {
                userId: 'id01',
            }
        }).then(async () => {
            const theater = (await TheaterModel.asyncGetById(theaterId)).data() as FirebaseFirestore.DocumentData;
            expect(theater.place).toBe(C.MatchingPlace.ACTARENA);
            expect(theater.title).toBe('title01');
            expect(theater.characters[0].name).toBe('character01');
            expect(theater.characters[1].name).toBe('character02');
            expect(theater.characters[0].user).toBe(input[1].id);
            expect(theater.characters[1].user).toBe(input[0].id);
            const t = Moment('2020-01-01 09:00:00').unix();
            expect(theater.endAt[C.TheaterState.READ].seconds).toBe(t);

            // TODO
            const user = (await UserModel.asyncGetById(input[0].id)).data() as FirebaseFirestore.DocumentData;
            expect(user.theater).toBe(theaterId);

            const matchingList = (await MatchingListModel.ref.get());
            expect(matchingList.docs.length).toBe(0);

            expect(pushMock.mock.calls.length).toBe(2);
        });
    });
});