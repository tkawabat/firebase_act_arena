import * as admin from 'firebase-admin'
import * as faker from 'faker'

// 共通化するために Admin SDK の初期化は index.ts で行う
const db = admin.firestore();
const batchSize = 500;

// 作成用関数
export const createUsers = async (n: number) => {
    const ref = await db.collection('ActScenario')

    // 再帰関数
    const excuteBatch = async (size: number) => {
        console.log(size);
        if (size === 0) {
            return
        }
        // 500件を超えないようにする
        const length = Math.min(size, batchSize)
        console.log(length);
        const batch = db.batch()
        for (let i = 0; i < length; i = i + 1) {
            const scenario = {
                name: faker.name.firstName(),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                isMock: true // 削除時のクエリ用フィールド
            }
            batch.create(ref.doc(), scenario)
        }
        const results = await batch.commit()
        console.log(results);
        // 書き込みが成功した分を引いた残りの件数を代入
        //await excuteBatch(size - results.length)
    }
    await excuteBatch(n)
}

// 削除用関数
export const deleteUsers = async () => {
    // モックデータのみを500件ずつ取得
    const query = await db
        .collection('ActScenario')
        .where('isMock', '==', true)
        .limit(batchSize)

    // 再帰関数
    const executeBatch = async () => {
        const snapshot = await query.get()
        if (snapshot.size === 0) {
            return
        }
        const batch = db.batch()
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref)
        })
        await batch.commit()
        await executeBatch()
    }
    await executeBatch()
}