import * as admin from 'firebase-admin';
import { DocumentData } from '@google-cloud/firestore';
import * as Moment from 'moment-timezone';
Moment.tz.setDefault('Asia/Tokyo');

import * as C from '../lib/Const';
import * as ArrayUtil from '../lib/Array';
import ModelBase from './ModelBase';
import { ArenaRoomUser } from './ArenaRoomUser';


interface PushData extends DocumentData {
    token: string
    basicSettings: Array<C.PushBasicSettingKey>
    temporarySettingOnOff: boolean
    temporarySettingTime: admin.firestore.Timestamp
    lastSendTime: admin.firestore.Timestamp
    createdAt: admin.firestore.Timestamp
    updatedAt: admin.firestore.Timestamp
}

interface Push {
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
        const messages = pushList.map((v) => {return {'notification': payload, 'token': v.data.token};})

        // TODO limit 500
        return admin.messaging().sendAll(messages);
    }

    private asyncBatchUpdate = async (pushList:Push[]) :Promise<any> => {
        const p = [];
        let i = 0;
        let batch = this.firestore.batch();
        for (const push of pushList) {
            batch.update(push.ref, {lastSendTime: admin.firestore.Timestamp.now()})
            
            i++;
            if (i >= this.batchSize) {
                p.push(this.commit(batch).catch(() => {
                    console.error('PushStore.asyncBatchUpdate');
                }));
                i = 0;
                batch = this.firestore.batch();
            }
        }
        p.push(this.commit(batch).catch(() => {
            console.error('PushStore.asyncBatchUpdate');
        }))
        return Promise.all(p);
    }

    public asyncSendEntry = async (arenaId: string, arenaRoomUsersnapshot: FirebaseFirestore.DocumentSnapshot | undefined) : Promise<any> => {
        console.log('PushModel.asyncSendEntry start');
        
        const p :any[] = [];

        if (arenaId !== '0') {
            console.log('not public arena');
            return Promise.all(p);
        }

        if (arenaRoomUsersnapshot === undefined || !arenaRoomUsersnapshot.data()) {
            console.error('PushModel.asyncSendEntry: arenaRoomUsersnapshot null');
            return Promise.all(p);
        }
        const data = arenaRoomUsersnapshot.data() as ArenaRoomUser;
        if (data.state !== C.ArenaUserState.ENTRY) {
            console.log('PushModel.asyncSendEntry: not entry');
            return Promise.all(p);
        }

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
                console.error(error);
            })
            ;
        
        if (!pushList || pushList.length === 0) {
            console.log('no push target');
            return Promise.all(p);
        }

        console.log('push target '+ pushList.length);

        // send
        const payload : Payload = {
            'title': '',
            'body': 'アリーナでエントリーしている人がいます。',
        }
        p.push(this.asyncBatchSend(pushList, payload));
        
        // update
        p.push(this.asyncBatchUpdate(pushList));

        return Promise.all(p);
    }

}

export default new PushModel();