import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');
import * as test from 'firebase-functions-test';
import * as admin from 'firebase-admin';

import * as C from '../../lib/Const';

import PushModel, { Push, PushData } from '../PushModel';


describe('PushModel.getNowBasicSettingKey', () => {
    let realDate: () => number;

    beforeEach(() => {
        realDate = Date.now;
    })

    afterEach(() => {
        global.Date.now = realDate;
    })

    it("9時", () => {
        global.Date.now = jest.fn(() => new Date('2020/01/02 09:00:00').getTime())

        const actual = PushModel.getNowBasicSettingKey();
        expect(actual).toBe(C.PushBasicSettingKey.MORNING);
    });

    it("15時", () => {
        global.Date.now = jest.fn(() => new Date('2020/01/02 15:00:00').getTime())

        const actual = PushModel.getNowBasicSettingKey();
        expect(actual).toBe(C.PushBasicSettingKey.TWILIGHT);
    });

    it("0時", () => {
        global.Date.now = jest.fn(() => new Date('2020/01/02 00:00:00').getTime())

        const actual = PushModel.getNowBasicSettingKey();
        expect(actual).toBe(C.PushBasicSettingKey.MIDNIGHT);
    });

    it("24時", () => {
        global.Date.now = jest.fn(() => new Date('2020/01/02 24:00:00').getTime())

        const actual = PushModel.getNowBasicSettingKey();
        expect(actual).toBe(C.PushBasicSettingKey.MIDNIGHT);
    });
});

describe('PushModel.asyncBatchUpdate', () => {
    afterEach(() => {
        test().cleanup();
    });

    it('正常系　1件', async () => {
        const input : Push[] = [];
        
        const id1 = 'aaa';
        const data1 = {
            token: 'aaa',
            basicSettings: [4,5],
            temporarySettingOnOff: false,
            temporarySettingTime: admin.firestore.Timestamp.now(),
            lastSendTime: admin.firestore.Timestamp.fromDate(Moment().add(-1, 'hour').toDate()),
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
        } as PushData;
        const ref1 = admin.firestore().collection('Push').doc(id1);
        await ref1.set(data1);

        const snapshot1 = test().firestore.makeDocumentSnapshot(data1, '/Push/'+id1) as PushData;
        const push1 = {ref: ref1, data: snapshot1} as Push;
        input.push(push1);
        
        const now = Moment().second();

        await PushModel.asyncBatchUpdate(input);

        const result = (await ref1.get()).data() as unknown as PushData;
        expect(result.lastSendTime.seconds).toBeGreaterThan(now);
    });
});