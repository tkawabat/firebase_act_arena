import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
admin.initializeApp(functions.config().firebase);

import * as C from '../../lib/Const';

import MatchingListModel from '../MatchingListModel';


describe('MatchingListModel.asyncGetWithTimelimit', () => {
    beforeAll(async () => {
        await MatchingListModel.batchDeleteAll();

        const p = [];

        const t1 = admin.firestore.Timestamp.fromDate(Moment('2020-01-01 09:00:00').toDate());
        p.push(MatchingListModel.ref.doc('user01').set({ createdAt: t1 }));
        const t2 = admin.firestore.Timestamp.fromDate(Moment('2020-01-01 09:00:01').toDate());
        p.push(MatchingListModel.ref.doc('user02').set({ createdAt: t2 }));
        const t3 = admin.firestore.Timestamp.fromDate(Moment('2020-01-01 09:00:02').toDate());
        p.push(MatchingListModel.ref.doc('user03').set({ createdAt: t3 }));

        await Promise.all(p);
    });

    it('1件', async () => {
        global.Date.now = jest.fn(() => new Date('2020-01-01 09:30:01').getTime());

        const actual = await MatchingListModel.asyncGetWithTimelimit(1);

        expect(actual.length).toBe(1);
        expect(actual[0].id).toBe('user03');
    });
    
    it('時間切れ', async () => {
        global.Date.now = jest.fn(() => new Date('2020-01-01 09:30:03').getTime());

        const actual = await MatchingListModel.asyncGetWithTimelimit(10);

        expect(actual.length).toBe(0);
    });
});