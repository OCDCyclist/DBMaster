'use strict';

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const app = require('./src/app');
const {Database} = require('./src/Database');

const which = 0 || process.argv.length > 2 ? Number(process.argv[2]) : 4000;
const portArg = Number.isSafeInteger(which) ? which : 4000;
const role = process.argv.length > 3 ? process.argv[3] : 'Leader';

const props = {
    role: role,
    logFolder: process.env.LOGDBPATH.replace("xxPORTxx", portArg),
    logFolderArchive: process.env.LOGARCHIVEDBPATH.replace( 'xxPORTxx', portArg),
    dbPath: process.env.DBPATH.replace("xxPORTxx", portArg)
};
app.database = new Database(props);

const server = app.listen( portArg, () => {
    const host  = server.address().address;
    const port  = server.address().portArg;
    console.log(`DB ${role} listening at http://${host}:${portArg}`);
});