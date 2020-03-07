import * as admin from 'firebase-admin';


export default class ModelBase {
    protected firestore:FirebaseFirestore.Firestore;
    protected batchSize = 500;
    protected ref:FirebaseFirestore.CollectionReference;

    constructor(collection:string) {
        this.firestore = admin.firestore();
        this.ref = this.firestore.collection(collection);
    }

    protected commit = async (batch:FirebaseFirestore.WriteBatch) => {
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
            const batch = this.firestore.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref)
            })
            await batch.commit();
            await executeBatch();
        }
        await executeBatch();
    }
}