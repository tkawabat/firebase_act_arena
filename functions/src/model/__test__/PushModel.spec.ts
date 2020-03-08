import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
admin.initializeApp(functions.config().firebase);

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
    const createPush = async (id:string) :Promise<Push> => {
        const data = {
            token: id,
            basicSettings: [4,5],
            temporarySettingOnOff: false,
            temporarySettingTime: admin.firestore.Timestamp.now(),
            lastSendTime: admin.firestore.Timestamp.fromDate(Moment().add(-1, 'hour').toDate()),
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
        } as PushData;
        const ref = admin.firestore().collection('Push').doc(id);
        return await ref.set(data).then(() => {
            return {ref: ref, data: data} as Push;
        });
    }

    beforeEach(async () => {
        await PushModel.batchDeleteAll();
    });

    afterEach(() => {
        PushModel.batchSize = C.DefaultBatchSize;
    })

    it('正常系　1件', async () => {
        const input : Push[] = [];
        
        const push = await createPush('push1');
        input.push(push);

        const now = Moment().second();

        await PushModel.asyncBatchUpdate(input);

        const result = (await push.ref.get()).data() as unknown as PushData;
        expect(result.lastSendTime.seconds).toBeGreaterThan(now);
    });

    it('正常系　バッチサイズ超え', async () => {
        PushModel.batchSize = 2;

        const input : Push[] = [];
        const p = [];
        for (let i = 0; i < 5; i++) {
            p.push(createPush('push'+i).then((push) => input.push(push)));
        }
        await Promise.all(p);

        const now = Moment().second();

        await PushModel.asyncBatchUpdate(input);

        const result = (await input[4].ref.get()).data() as unknown as PushData;
        expect(result.lastSendTime.seconds).toBeGreaterThan(now);
    });
});