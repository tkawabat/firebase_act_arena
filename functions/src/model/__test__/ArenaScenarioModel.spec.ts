import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
admin.initializeApp(functions.config().firebase);

import * as C from '../../lib/Const';
import * as FileUtil from '../../lib/File';

import ArenaScenarioModel, { ArenaScenario } from '../ArenaScenarioModel';


describe('ArenaModel.importTsv', () => {
    const defaultLine = [
        'title01',
        'scenarioUrl01',
        'agreementUrl01',
        '1000',
        '男1♂,女1♀',
        '男1「hello」',
        '女1「world」',
    ];

    beforeEach(async () => {
        await ArenaScenarioModel.batchDeleteAll();
    });

    afterEach(async () => {
        ArenaScenarioModel.batchSize = C.DefaultBatchSize;
    })

    it('1:1', async () => {
        jest.spyOn(FileUtil, 'readFile').mockImplementation((path) => {
            const line = defaultLine.join('\t');
            return [line];
        })

        await ArenaScenarioModel.importTsv('hoge');

        const result = await admin.firestore().collection('ArenaScenario').get();
        expect(result.docs.length).toBe(1);

        const data = result.docs[0].data() as unknown as ArenaScenario;
        expect(data.title).toBe('title01');
        expect(data.scenarioUrl).toBe('scenarioUrl01');
        expect(data.agreementUrl).toBe('agreementUrl01');
        expect(data.agreementScroll).toBe(1000);
        expect(data.characters).toEqual([
            {name: '男1', gender: C.Gender.Male},
            {name: '女1', gender: C.Gender.Female},
        ]);
        expect(data.genderRate).toEqual(['1:1']);
        expect(data.startText).toBe('男1「hello」');
        expect(data.endText).toBe('女1「world」');
    });

    it('1:1:1', async () => {
        jest.spyOn(FileUtil, 'readFile').mockImplementation((path) => {
            const line = defaultLine.slice();
            line[4] = '男1♂,不問1?,女1♀';
            return [line.join('\t')];
        });

        await ArenaScenarioModel.importTsv('hoge');

        const result = await admin.firestore().collection('ArenaScenario').get();
        expect(result.docs.length).toBe(1);

        const data = result.docs[0].data() as unknown as ArenaScenario;
        expect(data.characters).toEqual([
            {name: '男1', gender: C.Gender.Male},
            {name: '不問1', gender: C.Gender.Unknown},
            {name: '女1', gender: C.Gender.Female},
        ]);
        expect(data.genderRate).toEqual(['2:1', '1:2'])        
    });

    it('バッチサイズ超え', async () => {
        jest.spyOn(FileUtil, 'readFile').mockImplementation((path) => {
            const ret = [];
            for (let i = 0; i < 5; i++) {
                ret.push(defaultLine.join('\t'));
            }
            return ret;
        });

        ArenaScenarioModel.batchSize = 2;

        await ArenaScenarioModel.importTsv('hoge');

        const result = await admin.firestore().collection('ArenaScenario').get();
        expect(result.docs.length).toBe(5);
    });
});