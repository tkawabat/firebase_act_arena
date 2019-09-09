import * as admin from 'firebase-admin'
import * as program from 'commander'

// user.ts を import する前に Admin SDK を初期化する
admin.initializeApp()
admin.firestore().settings({ timestampsInSnapshots: true })

import ConfigModel from '../model/ConfigModel';
import UserModel from '../model/UserModel';
import ArenaModel from '../model/ArenaModel';
import ArenaScenarioModel from '../model/ArenaScenarioModel';

program.version('1.0.0', '-v, --version');
program
    .command('config')
    .description('create config documents')
    .action(cmd => {
        const promise = ConfigModel.create()
        promise.then(() => console.log('Command has completed')).catch(console.error)
    });
program
    .command('user')
    .option('-d, --delete', 'delete only the created documents')
    .option('-n, --number <n>', 'A number of test documents', parseInt, 0)
    .description('create test user documents')
    .action(cmd => {
        if (cmd.number > 10000) {
            console.error('The number must be 10000 or less');
            process.exit(-1);
        }
        const promise = cmd.delete ? UserModel.delete() : UserModel.createRondom(cmd.number)
        promise.then(() => console.log('Command has completed')).catch(console.error)
    });
program
    .command('arena')
    .option('-d, --delete', 'delete all ')
    .option('-n, --number <n>', 'A number of test documents', parseInt, 0)
    .action(cmd => {
        if (cmd.number > 100) {
            console.error('The number must be 100 or less');
            process.exit(-1);
        }
        const promise = cmd.delete ? ArenaModel.delete() : ArenaModel.createBatch(cmd.number);
        promise.then(() => console.log('Command has completed')).catch(console.error);
    });
program
    .command('arenaScenario')
    .option('-d, --delete', 'delete al')
    .option('-f, --file <file>', 'import tsv file')
    .action(cmd => {
        const promise = cmd.delete ? ArenaScenarioModel.delete() : ArenaScenarioModel.importTsv(cmd.file);
        promise.then(() => console.log('Command has completed')).catch(console.error);
    });
program
    .action(async cmd => {
        console.log(await ArenaScenarioModel.getRandom(1,1));
    })
program.parse(process.argv);

console.log('Firestore Mocking CLI');