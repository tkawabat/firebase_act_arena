import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
admin.initializeApp(functions.config().firebase);

import * as C from '../../lib/Const';

import ArenaModel from '../ArenaModel';



describe('ArenaModel.createBatch', () => {
    beforeEach(async () => {
        await ArenaModel.delete();
    });

    it('1件', async () => {
        await ArenaModel.createBatch(1);

        const result = await admin.firestore().collection('Arena').get();
        expect(result.docs.length).toBe(1);
        expect(result.docs[0].id).toBe('0');
    });
    
    it('501件', async () => {
        await ArenaModel.createBatch(501);

        const result = await admin.firestore().collection('Arena').orderBy('id').get();
        expect(result.docs.length).toBe(501);
        expect(result.docs[500].id).toBe('500');
    });

});