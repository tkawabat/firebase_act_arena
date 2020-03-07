import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');
// import * as sinon from 'sinon';

import * as C from '../../lib/Const';

import PushModel from '../PushModel';


describe('PushModel.getNowBasicSettingKey', () => {
    let realDate: () => number;

    beforeEach(() => {
        realDate = Date.now;
    })

    afterEach(() => {
        global.Date.now = realDate;
    })

    it("9時", async () => {
        global.Date.now = jest.fn(() => new Date('2020/01/02 09:00:00').getTime())

        const actual = PushModel.getNowBasicSettingKey();
        expect(actual).toBe(C.PushBasicSettingKey.MORNING);
    });

    it("15時", async () => {
        global.Date.now = jest.fn(() => new Date('2020/01/02 15:00:00').getTime())

        const actual = PushModel.getNowBasicSettingKey();
        expect(actual).toBe(C.PushBasicSettingKey.TWILIGHT);
    });

    it("0時", async () => {
        global.Date.now = jest.fn(() => new Date('2020/01/02 00:00:00').getTime())

        const actual = PushModel.getNowBasicSettingKey();
        expect(actual).toBe(C.PushBasicSettingKey.MIDNIGHT);
    });

    it("24時", async () => {
        global.Date.now = jest.fn(() => new Date('2020/01/02 24:00:00').getTime())

        const actual = PushModel.getNowBasicSettingKey();
        expect(actual).toBe(C.PushBasicSettingKey.MIDNIGHT);
    });
})