import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
admin.initializeApp(functions.config().firebase);
import * as faker from 'faker';

import * as C from '../../lib/Const';

import UserModel, { User } from '../UserModel';


describe('UserModel.createRandom', () => {

    beforeEach(async () => {
        await UserModel.batchDeleteAll();
    });

    afterEach(async () => {
        UserModel.batchSize = C.DefaultBatchSize;
    });

    it('1件', async () => {
        faker.name.firstName = jest.fn(() => '太郎');

        await UserModel.createRondom(1);

        const result = await admin.firestore().collection('User').get();
        expect(result.docs.length).toBe(1);

        const data = result.docs[0].data() as unknown as User;
        expect(data.name).toBe('太郎');
        expect(data.ngList).toEqual([]);
    });

    it('バッチサイズ超え', async () => {
        UserModel.batchSize = 2;

        await UserModel.createRondom(5);

        const result = await admin.firestore().collection('User').get();
        expect(result.docs.length).toBe(5);
    });
});