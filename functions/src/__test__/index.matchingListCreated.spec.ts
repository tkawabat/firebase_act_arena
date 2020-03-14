import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');
import * as test from 'firebase-functions-test';
import * as admin from 'firebase-admin';

import * as Index from '../index';

import * as C from '../lib/Const';

import MatchingListModel from '../model/MatchingListModel';
import ScenarioModel, { Scenario } from '../model/ScenarioModel';
import TheaterModel from '../model/TheaterModel';
import UserModel from '../model/UserModel';


describe('index.matchingListCreated', () => {
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
        const theaterId = 'theater01';
        TheaterModel.createId = jest.fn(() => theaterId);

        const p = [];

        const userIds = ['userid01', 'userId02'];
        p.push(UserModel.ref.doc(userIds[0]).set({
            name: 'username01',
            gender: C.Gender.Male
        }));
        p.push(UserModel.ref.doc(userIds[1]).set({
            name: 'username02',
            gender: C.Gender.Female
        }));
        p.push(MatchingListModel.ref.doc(userIds[0]).set({
            name: 'username01',
            gender: C.Gender.Male
        }));
        p.push(MatchingListModel.ref.doc(userIds[1]).set({
            name: 'username02',
            gender: C.Gender.Female
        }));
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

        const wrapped = test().wrap(Index.matchingListCreated);
        const snapshot = test().firestore.makeDocumentSnapshot({}, 'MatchingList/aaa/'+userIds[0]);

        wrapped(snapshot, {
            params: {
                userId: userIds[0],
            }
        }).then(async () => {
            const theater = (await TheaterModel.asyncGetById(theaterId)).data() as FirebaseFirestore.DocumentData;
            expect(theater.title).toBe('title01');
            expect(theater.characters[0].name).toBe('character01');
            expect(theater.characters[1].name).toBe('character02');
            expect(theater.characters[0].user).toBe(userIds[1]);
            expect(theater.characters[1].user).toBe(userIds[2]);

            const user = (await UserModel.asyncGetById(userIds[0])).data() as FirebaseFirestore.DocumentData;
            expect(user.theater).toBe(theaterId);

            const matchingList = (await MatchingListModel.asyncGet(10));
            expect(matchingList.length).toBe(0);
        });
    });
});