import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
admin.initializeApp(functions.config().firebase);

import * as C from '../../lib/Const';

import TheaterModel, { TheaterCharacter } from '../TheaterModel';
import { Scenario, ScenarioCharacter } from '../ScenarioModel';


describe('TheaterModel.asyncCreate', () => {

    beforeEach(async () => {
        await TheaterModel.batchDeleteAll();
    });

    afterEach(() => {
        TheaterModel.batchSize = C.DefaultBatchSize;
    });

    it('正常系', async () => {
        global.Date.now = jest.fn(() => new Date('2020/01/01 09:00:00').getTime());

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

        const data = (await TheaterModel.asyncGet(id)).data() as FirebaseFirestore.DocumentData;
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