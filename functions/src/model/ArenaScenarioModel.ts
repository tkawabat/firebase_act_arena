import * as admin from 'firebase-admin';
import { DocumentData } from '@google-cloud/firestore';

import * as C from '../lib/Const';
import * as ArrayUtil from '../lib/ArrayUtil';
import * as FileUtil from '../lib/FileUtil';
import ModelBase from './ModelBase';

interface Characters extends DocumentData {
    name: string
    gender: number
}
export interface ArenaScenario extends DocumentData {
    title: string
    scenarioUrl: string
    agreementUrl: string
    agreementScroll: number
    characters: Array<Characters>
    genderRate: Array<string>
    startText: string
    endText: string
    createdAt: admin.firestore.FieldValue
    updatedAt: admin.firestore.FieldValue
}

class ArenaScenarioModel extends ModelBase {
    constructor() {
        super('ArenaScenario');
    }

    private parseLine = (line: String): ArenaScenario => {
        const l = line.split('\t');
        const characters = [];

        let male: number = 0;
        let female: number = 0;
        let unknown: number = 0;
        for (const c of l[4].split(',')) {
            let gender: number = 0;
            if (c.indexOf('♂') !== -1) {
                gender = 1;
                male++;
            } else if (c.indexOf('♀') !== -1) {
                gender = 2;
                female++;
            } else if (c.indexOf('?') !== -1) {
                gender = 0;
                unknown++;
            } else {
                console.error('unknown gender');
                console.error(l);
                process.exit(-1);
            }
            characters.push({
                name: c.replace(/[?♂♀]/, '')
                , gender: gender
            });
        }

        const genderRate = [];
        for (let i = 0; i <= unknown; i++) {
            genderRate.push((male+unknown-i)+':'+(female+i));
        }
        return {
            title: l[0]
            , scenarioUrl: l[1]
            , agreementUrl: l[2]
            , agreementScroll: parseInt(l[3])
            , characters: characters
            , genderRate: genderRate
            , startText: l[5]
            , endText: l[6]
            , createdAt: admin.firestore.FieldValue.serverTimestamp()
            , updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
    }

    // 作成用関数
    public importTsv = async (path: string) => {
        const lines = FileUtil.readFile(path);

        const batch = [];
        for (const line of lines) {
            const scenario = this.parseLine(line);
            batch.push({id: null, data: scenario})
        }
        await this.asyncBatch(C.BatchType.Create, batch);
    }

    public getRandom = async (male: number, female: number): Promise<ArenaScenario> => {
        return this.firestore.collection('ArenaScenario')
            .where('genderRate', 'array-contains', male+':'+female)
            .limit(1000)
            .get().then((snapshot) => {
                const scenarios = snapshot.docs.map(v => v.data());
                return ArrayUtil.shuffle(scenarios)[0];
            })
            ;
    }
}

export default new ArenaScenarioModel();