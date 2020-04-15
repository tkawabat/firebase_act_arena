import * as admin from 'firebase-admin';
import { DocumentData } from '@google-cloud/firestore';
import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');

import * as C from '../lib/Const';
import * as ArrayUtil from '../lib/ArrayUtil';
import ModelBase from './ModelBase';
import { ArenaRoomUser } from './ArenaRoomUser';


export interface PushData extends DocumentData {
    token: string
    basicSettings: Array<C.PushBasicSettingKey>
    temporarySettingOnOff: boolean
    temporarySettingTime: admin.firestore.Timestamp
    lastSendTime: admin.firestore.Timestamp
    createdAt: admin.firestore.Timestamp
    updatedAt: admin.firestore.Timestamp
}

export interface Push {
    ref: admin.firestore.DocumentReference
    data: PushData
}

interface Payload {
    title: string,
    body: string,
}

class PushModel extends ModelBase {
    private nowKey: C.PushBasicSettingKey = -1;
    
    constructor() {
        super('Push');
    }

    public getNowBasicSettingKey = () :C.PushBasicSettingKey => {
        const hour = Moment().hour();
        for (const [key, hours] of Object.entries(C.PushBasicSettingEndHour)) {
            if (hour >= hours[0] && hour < hours[1]) return parseInt(key) as C.PushBasicSettingKey;
        }

        // ここにこないはず
        console.error('getNowBasicSettingKey');
        return C.PushBasicSettingKey.DAWN;
    }

    private sendFilter = (push: Push) : boolean => {
        return this.basicFilter(push.data) && this.temporaryFilter(push.data);
    }

    private basicFilter = (push: PushData) :boolean => {
        // 今だけ設定がされていたら、basicはスルー
        if (Moment.unix(push.temporarySettingTime.seconds) >= Moment()) return true;
        if (push.basicSettings.indexOf(this.nowKey) !== -1) return true;
        return false;
    }

    private temporaryFilter = (push: PushData) :boolean => {
        // 今だけ設定がされていなかったら、スルー
        if (Moment.unix(push.temporarySettingTime.seconds) < Moment()) return true;
        return push.temporarySettingOnOff;
    }

    private asyncBatchSend = async (pushList:Push[], payload:Payload) :Promise<any> => {
        const p = [];
        const g = ArrayUtil.batchGenerator(pushList, 99);

        let list = g.next();
        while (!list.done) {
            const messages = list.value.map((v) => {return {'notification': payload, 'token': v.data.token};})
            p.push(admin.messaging().sendAll(messages));
            list = g.next();
        }

        return Promise.all(p);
    }

    public asyncBatchUpdate = async (pushList:Push[]) => {
        const batch = [];
        for (const push of pushList) {
            const data = {
                lastSendTime: admin.firestore.Timestamp.now(),
                updatedAt: admin.firestore.Timestamp.now(),
            };
            batch.push({id: push.ref.id, data: data});
        }
        return this.asyncBatch(C.BatchType.Update, batch);
    }

    public asyncSend = async (title:string, body:string) :Promise<any> => {
        // nowkeyを更新
        this.nowKey = this.getNowBasicSettingKey();
        const sendLimit = admin.firestore.Timestamp.fromDate(Moment().add(-1 * C.PushIntervalHour, 'hours').toDate());

        const pushList = await this.ref.where('lastSendTime', '<=', sendLimit).get()
            .then((snapshot) => {
                const ret = snapshot.docs.map((v) => { return {ref: v.ref, data: v.data() as PushData} as Push })
                    .filter(this.sendFilter);
                return ret;
            })
            .catch((error) => {
                console.error('get pushList');
            })
            ;
        
        if (!pushList || pushList.length === 0) {
            console.log('no push target');
            return;
        }

        console.log('push target '+ pushList.length);
        const p = [];

        // send
        const payload : Payload = {
            'title': title,
            'body': body,
        }
        p.push(this.asyncBatchSend(pushList, payload));
        
        // update
        p.push(this.asyncBatchUpdate(pushList));

        return Promise.all(p);
    }

    public asyncSendById = async (title:string, body:string, userId:string) :Promise<any> => {
        // nowkeyを更新
        this.nowKey = this.getNowBasicSettingKey();
        const sendLimit = admin.firestore.Timestamp.fromDate(Moment().add(-1 * C.PushIntervalHour, 'hours').toDate());

        const push = await this.ref.doc(userId).get()
            .then((snapshot) => {
                return { ref: snapshot.ref, data: snapshot.data() as PushData } as Push;
            })
            ;
        
        if (!push) {
            console.log('no push target');
            return;
        }

        // send
        const payload : Payload = {
            'title': title,
            'body': body,
        }

        const p = [];
        //send
        p.push(this.asyncBatchSend([push], payload));
        // update
        p.push(this.asyncBatchUpdate([push]));

        return Promise.all(p);
    }

}

export default new PushModel();