'use strict';

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const app = require('./src/app');
const {Database} = require('./src/Database');
const { getIntegerArrayForCSVList } = require("./src/utils");

process.argv.forEach( arg =>{
    if( process.argv.length <= 2 || arg.toString().includes('?')){
        console.log( '== Help for DB Master ==');
        console.log( 'Start like this:');
        console.log( '');
        console.log( 'node server.js {portToListen: integer} {role: Leader || Replica} {listOfReplicaPorts: comma delimited integer list}  ' );
        console.log( '');
        console.log( 'listOfReplicaPorts can be provide later with api command: /replicaPorts/:replicaList');
        process.exit();
    }
});

const which = 0 || process.argv.length > 2 ? Number(process.argv[2]) : 4000;
let portArg           = Number.isSafeInteger(which) ? which : 4000;
let role              = process.argv.length > 3 ? process.argv[3] : 'Leader';
const replicas    = process.argv.length > 4 ? getIntegerArrayForCSVList(process.argv[4]) : [];

const validRoles = ['Leader', 'Replica'];
if( false === validRoles.includes( role ) ){
    console.log( 'Invalid DB role. The role argument is second and should be Leader or Replica.');
    process.exit();
};

if( replicas.includes( portArg ) ){
    console.log( 'The target port for this server cannot also be on either the replica or leader list.');
    process.exit();
};

const props = {
    name: String(portArg),
    role: role,
    logFolder: process.env.LOGDBPATH.replace("xxPORTxx", portArg),
    logFolderArchive: process.env.LOGARCHIVEDBPATH.replace( 'xxPORTxx', portArg),
    dbPath: process.env.DBPATH.replace("xxPORTxx", portArg),
    replicas: replicas
};
app.database = new Database(props);

const server = app.listen( portArg, () => {
    const host  = server.address().address;
    const port  = server.address().port;
    console.log(`DB ${role} listening at http://${host}:${port}`);
});
