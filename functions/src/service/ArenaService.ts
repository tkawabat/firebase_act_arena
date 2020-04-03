import * as Moment from 'moment';

import * as C from '../lib/Const';
import * as ArrayUtil from '../lib/ArrayUtil';

import { ArenaRoomUser } from '../model/ArenaRoomUser';
import PushModel from '../model/PushModel';


class ArenaService {

    public asyncSendEntry = (arenaId: string, arenaRoomUsersnapshot: FirebaseFirestore.DocumentSnapshot | undefined) :Promise<any> => {
        if (arenaId !== '0') {
            console.log('not public arena');
            return new Promise(() => null);
        }

        if (arenaRoomUsersnapshot === undefined || !arenaRoomUsersnapshot.data()) {
            console.error('PushModel.asyncSendEntry: arenaRoomUsersnapshot null');
            return new Promise(() => null);
        }
        const data = arenaRoomUsersnapshot.data() as ArenaRoomUser;
        if (data.state !== C.ArenaUserState.ENTRY) {
            console.log('PushModel.asyncSendEntry: not entry');
            return new Promise(() => null);
        }

        return PushModel.asyncSend('', 'アリーナでエントリーしている人がいます。\n劇をしたい方は是非エントリーを！');
    }

}


export default new ArenaService();