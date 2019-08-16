import * as admin from 'firebase-admin';
import * as faker from 'faker';
import * as fs from 'fs-extra';
import { DocumentData } from '@google-cloud/firestore';


class ActScenario {
    private db:FirebaseFirestore.Firestore;
    private batchSize = 500;
    private ref:FirebaseFirestore.CollectionReference;

    constructor() {
        this.db = admin.firestore();
        this.ref = this.db.collection('ActScenario');
    }

    private parseLine = (line: String): DocumentData => {
        const l = line.split('\t');
        const charactors = [];
        for (const c of l[4].split(',')) {
            let gender: number = 0;
            if (c.indexOf('♂') !== -1) {
                gender = 1;
            } else if (c.indexOf('♀') !== -1) {
                gender = 2;
            } else if (c.indexOf('?') !== -1) {
                gender = 0;
            } else {
                console.error('unknown gender');
                console.error(l);
                process.exit(-1);
            }
            charactors.push({
                name: c.replace(/[?♂♀]/, '')
                , gender: gender
            });
        }
        return {
            title: l[0]
            , url: l[1]
            , agreement_url: l[2]
            , agreement_scroll: parseInt(l[3])
            , charactors: charactors
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

        let batch = this.db.batch();
        let i = 0;
        for (const line of lines) {
            const scenario = this.parseLine(line);
            batch.create(this.ref.doc(), scenario);
            i++;
            if (i >= this.batchSize) {
                const results = await batch.commit();
                console.log(results);
                i = 0;
                batch = this.db.batch();
            }
        }
        const results = await batch.commit();
        console.log(results);
    }

    // 削除用関数
    public delete = async () => {
        // モックデータのみを500件ずつ取得
        const query = await this.ref
            .limit(this.batchSize)
            ;

        // 再帰関数
        const executeBatch = async () => {
            const snapshot = await query.get();
            if (snapshot.size === 0) {
                return;
            }
            const batch = this.db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref)
            })
            await batch.commit();
            await executeBatch();
        }
        await executeBatch();
    }
}

export default new ActScenario();