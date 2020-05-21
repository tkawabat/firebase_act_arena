import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');
import * as test from 'firebase-functions-test';
import * as admin from 'firebase-admin';

import * as Index from '../index';

import * as C from '../lib/Const';

import TheaterModel, { Theater } from '../model/theaterModel';


const defaultTheater = {
    endAt: [
        admin.firestore.Timestamp.fromDate(Moment('2020-01-01 09:00:00').toDate()),
        admin.firestore.Timestamp.fromDate(Moment('2020-01-01 09:00:01').toDate()),
        admin.firestore.Timestamp.fromDate(Moment('2020-01-01 09:00:02').toDate()),
    ]
} as Theater;

describe('index.theaterRoomUserUpdated', () => {
    beforeAll(async () => {
        await TheaterModel.batchDeleteAll();
    });
    afterEach(() => {
        test().cleanup();
    });

    it('更新される', async () => {
        global.Date.now = jest.fn(() => new Date('2020-01-01 09:00:03').getTime());
        TheaterModel.calcState = jest.fn(() => C.TheaterState.READ);
        TheaterModel.asyncCheckAllActorIsNext = jest.fn().mockResolvedValue(true);

        const p = [];

        const theaterId = 'theaterRoomUserUpdated01';
        const theaterRef = TheaterModel.ref.doc(theaterId);
        
        p.push(theaterRef.set(defaultTheater));
        
        await Promise.all(p);

        const wrapped = test().wrap(Index.theaterRoomUserUpdated);
        const snapshot = test().firestore.makeDocumentSnapshot(defaultTheater, 'theater/'+theaterId+'/RoomUser/hoge');
        const change = test().makeChange(snapshot, snapshot);

        await wrapped(change, {
            params: {
                theaterId: theaterId,
                userId: 'hoge',
            }
        }).then(async () => {
            const data = (await theaterRef.get()).data() as FirebaseFirestore.DocumentData;
            expect(data.endAt[C.TheaterState.READ].seconds).toBe(Moment('2020-01-01 09:00:09').unix());
            expect(data.endAt[C.TheaterState.CHECK].seconds).toBe(Moment('2020-01-01 09:00:01').unix());
            expect(data.endAt[C.TheaterState.ACT].seconds).toBe(Moment('2020-01-01 09:00:02').unix());
        });
    });

    it('1人だけnext 更新されない', async () => {
        global.Date.now = jest.fn(() => new Date('2020-01-01 09:00:03').getTime());
        TheaterModel.calcState = jest.fn(() => C.TheaterState.READ);
        TheaterModel.asyncCheckAllActorIsNext = jest.fn().mockResolvedValue(false);

        const p = [];
        
        const theaterId = 'theaterRoomUserUpdated02';
        const theaterRef = TheaterModel.ref.doc(theaterId);
        
        p.push(theaterRef.set(defaultTheater));
        
        await Promise.all(p);

        const wrapped = test().wrap(Index.theaterRoomUserUpdated);
        const snapshot = test().firestore.makeDocumentSnapshot(defaultTheater, 'theater/'+theaterId+'/RoomUser/hoge');

        await wrapped(snapshot, {
            params: {
                theaterId: theaterId,
                userId: 'hoge',
            }
        }).then(async () => {
            const data = (await theaterRef.get()).data() as FirebaseFirestore.DocumentData;
            expect(data.endAt[C.TheaterState.READ].seconds).toBe(Moment('2020-01-01 09:00:00').unix());
            expect(data.endAt[C.TheaterState.CHECK].seconds).toBe(Moment('2020-01-01 09:00:01').unix());
            expect(data.endAt[C.TheaterState.ACT].seconds).toBe(Moment('2020-01-01 09:00:02').unix());
        });
    });

});