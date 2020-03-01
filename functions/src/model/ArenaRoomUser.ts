import { DocumentData } from '@google-cloud/firestore';

import * as C from '../lib/Const';


export interface ArenaRoomUser extends DocumentData {
    name: string
    gender: C.Gender
    state: C.ArenaUserState
}