import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as fft from 'firebase-functions-test';

const firebaseConfig = {
    authDomain: "act-arena-unittest.firebaseapp.com",
    databaseURL: "https://act-arena-unittest.firebaseio.com",
    projectId: "act-arena-unittest",
    storageBucket: "act-arena-unittest.appspot.com",
};
const ft = fft(firebaseConfig, './act-arena-unittest-firebase-adminsdk-bn051-92aaff22a8.json');
admin.initializeApp(functions.config().firebase);