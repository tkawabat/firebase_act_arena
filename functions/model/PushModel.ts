import * as admin from 'firebase-admin';
import { DocumentData } from '@google-cloud/firestore';
import * as Moment from 'moment';

import * as C from '../lib/Const';
import * as ArrayUtil from '../lib/Array';
import ModelBase from './ModelBase';

interface Push extends DocumentData {
    token: string
    basicSettings: Array<C.PushBasicSettingKey>
    temporarySettingOnOff: boolean
    temporarySettingTime: admin.firestore.Timestamp
    lastSendTime: admin.firestore.Timestamp
    createdAt: admin.firestore.Timestamp
    updatedAt: admin.firestore.Timestamp
}

class PushModel extends ModelBase {
    private nowKey: C.PushBasicSettingKey = -1;
    constructor() {
        super('Push');

        this.nowKey = this.getNowBasicSettingKey();
    }

    private getNowBasicSettingKey = () :C.PushBasicSettingKey => {
        const hour = Moment().hour();
        for (const [key, hours] of Object.entries(C.PushBasicSettingEndHour)) {
            if (hour >= hours[0] && hour < hours[1]) return parseInt(key) as C.PushBasicSettingKey;
        }

        // ここにこないはず
        console.error('getNowBasicSettingKey');
        return C.PushBasicSettingKey.DAWN;
    }

    private sendFilter = (push: Push) : boolean => {
        return this.basicFilter(push) && this.temporaryFilter(push);
    }

    private basicFilter = (push: Push) :boolean => {
        // 今だけ設定がされていたら、basicはスルー
        if (Moment.unix(push.temporarySettingTime.seconds) >= Moment()) return true;
        if (push.basicSettings.indexOf(this.nowKey) !== -1) return true;
        return false;
    }

    private temporaryFilter = (push: Push) :boolean => {
        // 今だけ設定がされていなかったら、スルー
        if (Moment.unix(push.temporarySettingTime.seconds) < Moment()) return true;
        return push.temporarySettingOnOff;
    }

    public asyncSendEntry = async () => {
        const sendLimit = admin.firestore.Timestamp.fromDate(Moment().add(-1 * C.PushIntervalHour, 'hours').toDate());
        
        const pushList = await this.ref.where('lastSendTime', '<=', sendLimit).get()
            .then((snapshot) => {
                return snapshot.docs.map(v => v.data() as Push).filter(this.sendFilter);
            })
            .catch((error) => {
                console.error('get by basicSettings');
                console.error(error);
            })
            ;
        console.log('getNow:', this.getNowBasicSettingKey());
        console.log('pushList:', pushList);

        
        // TODO send
        // TODO update last send time
    }

}

export default new PushModel();