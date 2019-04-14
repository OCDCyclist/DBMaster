'use strict';

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const app = require('./src/app');

const port = process.env.PORT || 4000;
const server = app.listen( port, () => {
    const host  = server.address().address;
    const port  = server.address().port;
    console.log(`DB listening at http://${host}:${port}`);
});