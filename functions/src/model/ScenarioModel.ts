import * as admin from 'firebase-admin';
import { DocumentData } from '@google-cloud/firestore';

import * as C from '../lib/Const';
import * as ArrayUtil from '../lib/ArrayUtil';
import * as FileUtil from '../lib/FileUtil';
import ModelBase from './ModelBase';

export interface ScenarioCharacter extends DocumentData {
    name: string
    gender: number
}
export interface Scenario extends DocumentData {
    title: string
    author: string
    scenarioUrl: string
    agreementUrl: string
    agreementScroll: number
    characters: Array<ScenarioCharacter>
    genderRate: Array<string>
    minutes: number
    createdAt: admin.firestore.FieldValue
    updatedAt: admin.firestore.FieldValue
}

class ScenarioModel extends ModelBase {
    constructor() {
        super('Scenario');
    }

    private parseLine = (line: String): Scenario|undefined => {
        const l = line.split('\t');
        const characters = [];

        if (l.length < 7) {
            console.log('skip line:', line);
            return;
        }

        let male: number = 0;
        let female: number = 0;
        let unknown: number = 0;
        for (const c of l[5].split(',')) {
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
            , author: l[1]
            , scenarioUrl: l[2]
            , agreementUrl: l[3]
            , agreementScroll: parseInt(l[4])
            , characters: characters
            , genderRate: genderRate
            , minutes: parseInt(l[6])
            , createdAt: admin.firestore.FieldValue.serverTimestamp()
            , updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
    }

    // 作成用関数
    public importTsv = async (path: string) => {
        const lines = FileUtil.readFile(path, true);

        const batch = [];
        for (const line of lines) {
            const scenario = this.parseLine(line);
            if (!scenario) continue;
            batch.push({id: null, data: scenario})
        }
        await this.asyncBatch(C.BatchType.Create, batch);
    }

    public getRandom = async (male: number, female: number): Promise<Scenario> => {
        return this.ref.where('genderRate', 'array-contains', male+':'+female)
            .limit(1000)
            .get().then((snapshot) => {
                const scenarios = snapshot.docs.map(v => v.data());
                return ArrayUtil.shuffle(scenarios)[0];
            })
            ;
    }

}

export default new ScenarioModel();