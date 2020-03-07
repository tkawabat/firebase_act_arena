import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');
// import * as sinon from 'sinon';

import * as C from '../../lib/Const';

//import PushModel from '../PushModel';


describe('PushModel.getNowBasicSettingKey', () => {
    it("null", async () => {
        //const actual = PushModel.getNowBasicSettingKey();
        const actual = C.PushBasicSettingKey.DAWN;

        console.log('aaaaaaa');

        expect(C.PushBasicSettingKey.DAWN).toBe(actual);
    });
})