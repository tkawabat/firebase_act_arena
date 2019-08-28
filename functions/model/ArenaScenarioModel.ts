import * as admin from 'firebase-admin';
import * as fs from 'fs-extra';
import { DocumentData } from '@google-cloud/firestore';

import * as ArrayUtil from '../lib/Array';
import ModelBase from './ModelBase';

interface Charactors extends DocumentData {
    name: string
    gender: number
}
interface ArenaScenario extends DocumentData {
    title: string
    url: string
    agreement_url: string
    agreement_scroll: number
    characters: Array<Charactors>
    gender_rate: Array<string>
    start: string
    end: string
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
            , url: l[1]
            , agreement_url: l[2]
            , agreement_scroll: parseInt(l[3])
            , characters: characters
            , gender_rate: genderRate
            , start: l[5]
            , end: l[6]
            , createdAt: admin.firestore.FieldValue.serverTimestamp()
            , updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
    }

    // 作成用関数
    public importTsv = async (path: string) => {

        let lines: Array<String> = [];
        try {
            const text = fs.readFileSync(path, 'utf-8');
            lines = text.split('\r\n');
        } catch (error) {
            console.log(`failed to read ${error}`)
        }
        lines.shift();

        let batch = this.firestore.batch();
        let i = 0;
        for (const line of lines) {
            const scenario = this.parseLine(line);
            batch.create(this.ref.doc(), scenario);
            i++;
            if (i >= this.batchSize) {
                await this.commit(batch);
                i = 0;
                batch = this.firestore.batch();
            }
        }
        await this.commit(batch);
    }

    public getRandom = async (male: number, female: number): Promise<ArenaScenario> => {
        return this.firestore.collection('ArenaScenario')
            .where('gender_rate', 'array-contains', male+':'+female)
            .limit(1000)
            .get().then((snapshot) => {
                const scenarios = snapshot.docs.map(v => v.data());
                return ArrayUtil.shuffle(scenarios)[0];
            })
            ;
    }
}

export default new ArenaScenarioModel();