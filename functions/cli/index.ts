import * as admin from 'firebase-admin'
import * as program from 'commander'

// user.ts を import する前に Admin SDK を初期化する
admin.initializeApp()
admin.firestore().settings({ timestampsInSnapshots: true })

import { createUsers, deleteUsers } from './user';
import ActScenario from './ActScenario';

program.version('1.0.0', '-v, --version');
program
    .command('user')
    .option('-d, --delete', 'delete only the created documents')
    .option('-n, --number <n>', 'A number of test documents', parseInt, 0)
    .description('create test user documents')
    .action(cmd => {
        if (cmd.number > 10000) {
            console.error('The number must be 10000 or less');
            return;
        }
        const promise = cmd.delete ? deleteUsers() : createUsers(cmd.number)
        promise.then(() => console.log('Command has completed')).catch(console.error)
    });
program
    .command('scenario')
    .option('-d, --delete', 'delete only the created documents')
    .option('-f, --file <file>', 'import tsv file')
    .action(cmd => {
        const promise = cmd.delete ? ActScenario.delete() : ActScenario.importTsv(cmd.file);
        promise.then(() => console.log('Command has completed')).catch(console.error);
    });
program.parse(process.argv);

console.log('Firestore Mocking CLI');