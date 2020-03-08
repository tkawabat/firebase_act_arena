import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
admin.initializeApp(functions.config().firebase);

import * as C from '../../lib/Const';

import ArenaModel from '../ArenaModel';


describe('ArenaModel.createBatch', () => {
    beforeEach(async () => {
        await ArenaModel.batchDeleteAll();
    });

    afterEach(async () => {
        ArenaModel.batchSize = C.DefaultBatchSize;
    })

    it('1件', async () => {
        await ArenaModel.createBatch(1);

        const result = await admin.firestore().collection('Arena').get();
        expect(result.docs.length).toBe(1);
        expect(result.docs[0].id).toBe('0');
    });
    
    it('バッチサイズ超え', async () => {
        ArenaModel.batchSize = 2;
        await ArenaModel.createBatch(5);

        const result = await admin.firestore().collection('Arena').orderBy('id').get();
        expect(result.docs.length).toBe(5);
        expect(result.docs[4].id).toBe('4');
    });

    it('1000件 too many', async () => {
        jest.spyOn(console, 'error');
        await ArenaModel.createBatch(1000);
        expect(console.error).toBeCalled();
    });
});