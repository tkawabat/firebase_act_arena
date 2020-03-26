import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');
import * as test from 'firebase-functions-test';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
admin.initializeApp(functions.config().firebase);

import * as C from '../../lib/Const';

import TheaterModel, { TheaterCharacter, Theater } from '../TheaterModel';
import { Scenario, ScenarioCharacter } from '../ScenarioModel';


const defaultTheater = {
    endAt: [
        admin.firestore.Timestamp.fromDate(Moment('2020-01-01 09:00:00').toDate()),
        admin.firestore.Timestamp.fromDate(Moment('2020-01-01 09:00:01').toDate()),
        admin.firestore.Timestamp.fromDate(Moment('2020-01-01 09:00:02').toDate()),
    ]
} as Theater;

describe('TheaterModel.calcState', () => {

    it('第本確認', () => {
        global.Date.now = jest.fn(() => new Date('2020-01-01 09:00:00').getTime());
        const actual = TheaterModel.calcState(defaultTheater);
        expect(actual).toBe(C.TheaterState.READ);
    });

    it('音声確認', () => {
        global.Date.now = jest.fn(() => new Date('2020-01-01 09:00:01').getTime());
        const actual = TheaterModel.calcState(defaultTheater);
        expect(actual).toBe(C.TheaterState.CHECK);
    });

    it('上演中', () => {
        global.Date.now = jest.fn(() => new Date('2020-01-01 09:00:02').getTime());
        const actual = TheaterModel.calcState(defaultTheater);
        expect(actual).toBe(C.TheaterState.ACT);
    });

    it('上演終了', () => {
        global.Date.now = jest.fn(() => new Date('2020-01-01 09:00:03').getTime());
        const actual = TheaterModel.calcState(defaultTheater);
        expect(actual).toBe(C.TheaterState.END);
    });
});

describe('TheaterModel.asyncTransactionState', () => {

    beforeAll(async () => {
        await TheaterModel.batchDeleteAll();
    });

    afterEach(() => {
        TheaterModel.batchSize = C.DefaultBatchSize;
    });

    it('台本確認', async () => {
        global.Date.now = jest.fn(() => new Date('2020-01-01 09:00:03').getTime());
        TheaterModel.calcState = jest.fn(() => C.TheaterState.READ);
        const id = 'id01';
        await TheaterModel.ref.doc(id).set(defaultTheater);
        
        await TheaterModel.asyncTransitionState(id, defaultTheater);

        const data = (await TheaterModel.asyncGetById(id)).data() as FirebaseFirestore.DocumentData;
        expect(data.endAt[C.TheaterState.READ].seconds).toBe(Moment('2020-01-01 09:00:03').unix());
        expect(data.endAt[C.TheaterState.CHECK].seconds).toBe(Moment('2020-01-01 09:00:01').unix());
        expect(data.endAt[C.TheaterState.ACT].seconds).toBe(Moment('2020-01-01 09:00:02').unix());
    });


    it('音声確認', async () => {
        global.Date.now = jest.fn(() => new Date('2020-01-01 09:00:03').getTime());
        TheaterModel.calcState = jest.fn(() => C.TheaterState.CHECK);
        const id = 'id02';
        await TheaterModel.ref.doc(id).set(defaultTheater);

        await TheaterModel.asyncTransitionState(id, defaultTheater);

        const data = (await TheaterModel.asyncGetById(id)).data() as FirebaseFirestore.DocumentData;
        expect(data.endAt[C.TheaterState.READ].seconds).toBe(Moment('2020-01-01 09:00:00').unix());
        expect(data.endAt[C.TheaterState.CHECK].seconds).toBe(Moment('2020-01-01 09:00:03').unix());
        expect(data.endAt[C.TheaterState.ACT].seconds).toBe(Moment('2020-01-01 09:00:02').unix());
    });


    it('上演中', async () => {
        global.Date.now = jest.fn(() => new Date('2020-01-01 09:00:03').getTime());
        TheaterModel.calcState = jest.fn(() => C.TheaterState.ACT);
        const id = 'id03';
        await TheaterModel.ref.doc(id).set(defaultTheater);

        await TheaterModel.asyncTransitionState(id, defaultTheater);

        const data = (await TheaterModel.asyncGetById(id)).data() as FirebaseFirestore.DocumentData;
        expect(data.endAt[C.TheaterState.READ].seconds).toBe(Moment('2020-01-01 09:00:00').unix());
        expect(data.endAt[C.TheaterState.CHECK].seconds).toBe(Moment('2020-01-01 09:00:01').unix());
        expect(data.endAt[C.TheaterState.ACT].seconds).toBe(Moment('2020-01-01 09:00:03').unix());
    });


    it('上演終了', async () => {
        global.Date.now = jest.fn(() => new Date('2020-01-01 09:00:03').getTime());
        TheaterModel.calcState = jest.fn(() => C.TheaterState.END);
        const id = 'id04';
        await TheaterModel.ref.doc(id).set(defaultTheater);

        await TheaterModel.asyncTransitionState(id, defaultTheater);

        const data = (await TheaterModel.asyncGetById(id)).data() as FirebaseFirestore.DocumentData;
        expect(data.endAt[C.TheaterState.READ].seconds).toBe(Moment('2020-01-01 09:00:00').unix());
        expect(data.endAt[C.TheaterState.CHECK].seconds).toBe(Moment('2020-01-01 09:00:01').unix());
        expect(data.endAt[C.TheaterState.ACT].seconds).toBe(Moment('2020-01-01 09:00:02').unix());
    });
});

describe('TheaterModel.asyncCreate', () => {

    beforeEach(async () => {
        await TheaterModel.batchDeleteAll();
    });

    afterEach(() => {
        TheaterModel.batchSize = C.DefaultBatchSize;
    });

    it('正常系', async () => {
        global.Date.now = jest.fn(() => new Date('2020-01-01 09:00:00').getTime());

        const id = 'id01';
        const scenario = {
            title: 'title01',
            author: 'hoge',
            scenarioUrl: 'hoge',
            agreementUrl: 'hoge',
            agreementScroll: 0,
            characters: [],
            genderRate: [],
            minutes: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        } as Scenario;
        const characters = new Array<TheaterCharacter>();
        characters.push({name: 'name01', gender: C.Gender.Male, user: 'hoge', userName: 'hoge'});
        characters.push({name: 'name02', gender: C.Gender.Female, user: 'hoge', userName: 'hoge'});
        
        await TheaterModel.asyncCreate(id, scenario, characters);

        const readEnd = Moment('2020-01-01 09:10:03').unix();
        const checkEnd = Moment('2020-01-01 09:15:03').unix();
        const actEnd = Moment('2020-01-01 10:15:04').unix();

        const data = (await TheaterModel.asyncGetById(id)).data() as FirebaseFirestore.DocumentData;
        expect(data.title).toBe('title01');
        expect(data.characters.length).toBe(2);
        expect(data.characters[0].name).toBe('name01');
        expect(data.characters[1].name).toBe('name02');
        expect(data.characters[0].gender).toBe(C.Gender.Male);
        expect(data.characters[1].gender).toBe(C.Gender.Female);
        expect(data.endAt[C.TheaterState.READ].seconds).toBe(readEnd);
        expect(data.endAt[C.TheaterState.CHECK].seconds).toBe(checkEnd);
        expect(data.endAt[C.TheaterState.ACT].seconds).toBe(actEnd);
    });
});
