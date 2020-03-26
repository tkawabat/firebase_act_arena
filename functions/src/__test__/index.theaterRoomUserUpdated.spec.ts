import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');
import * as test from 'firebase-functions-test';
import * as admin from 'firebase-admin';

import * as Index from '../index';

import * as C from '../lib/Const';

import TheaterModel, { TheaterCharacter, Theater } from '../model/theaterModel';


const defaultTheater = {
    characters: [
        {name: 'hoge', gender: C.Gender.Male, user: 'user01', userName: 'hoge'},
        {name: 'hoge', gender: C.Gender.Female, user: 'user02', userName: 'hoge'},
    ],
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

        const p = [];

        const theaterId = '100';
        const theaterRef = TheaterModel.ref.doc(theaterId);
        
        p.push(theaterRef.set(defaultTheater));
        p.push(theaterRef.collection('RoomUser').doc('user01').set({ next: true}));
        p.push(theaterRef.collection('RoomUser').doc('user02').set({ next: true}));
        
        await Promise.all(p);

        const wrapped = test().wrap(Index.theaterRoomUserUpdated);
        const snapshot = test().firestore.makeDocumentSnapshot(defaultTheater, 'theater/'+theaterId+'/RoomUser/hoge');
        const change = test().makeChange(snapshot, snapshot);

        wrapped(change, {
            params: {
                theaterId: theaterId,
                userId: 'hoge',
            }
        }).then(async () => {
            const data = (await theaterRef.get()).data() as FirebaseFirestore.DocumentData;
            expect(data.endAt[C.TheaterState.READ].seconds).toBe(Moment('2020-01-01 09:00:03').unix());
            expect(data.endAt[C.TheaterState.CHECK].seconds).toBe(Moment('2020-01-01 09:00:01').unix());
            expect(data.endAt[C.TheaterState.ACT].seconds).toBe(Moment('2020-01-01 09:00:02').unix());
        });
    });

    it('1人だけnext 更新されない', async () => {
        global.Date.now = jest.fn(() => new Date('2020-01-01 09:00:03').getTime());
        TheaterModel.calcState = jest.fn(() => C.TheaterState.READ);

        const p = [];

        const characters = new Array<TheaterCharacter>();
        characters.push({name: 'hoge', gender: C.Gender.Male, user: 'user01', userName: 'hoge'});
        characters.push({name: 'hoge', gender: C.Gender.Female, user: 'user02', userName: 'hoge'});
        
        const theaterId = '101';
        const theaterRef = TheaterModel.ref.doc(theaterId);
        
        p.push(theaterRef.set(defaultTheater));
        p.push(theaterRef.collection('RoomUser').doc('user01').set({ next: true}));
        p.push(theaterRef.collection('RoomUser').doc('user02').set({ next: false}));
        
        await Promise.all(p);

        const wrapped = test().wrap(Index.theaterRoomUserUpdated);
        const snapshot = test().firestore.makeDocumentSnapshot(defaultTheater, 'theater/'+theaterId+'/RoomUser/hoge');

        wrapped(snapshot, {
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