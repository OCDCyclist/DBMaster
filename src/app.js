'use strict';

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: true,
    optionsSuccessStatus: 204
};

app.use( cors(corsOptions));
app.use( bodyParser.urlencoded({extended: false}) );
app.use( express.json());

app.get('/', (req, res) => {
    res.status(200).send(`Hello from the the DB ${props.role}!  You have truely made an excellent connection.`);
});

app.get('/start', async (req, res) => {
    res.status(200).send( await app.database.Start());
});

app.get('/stop', (req, res) => {
    res.status(200).send(app.database.Stop());
});

app.get('/state', (req, res) => {
    res.status(200).send(app.database.getState());
});

app.post('/add', (req, res) => {
    res.status(200).send( app.database.Commit(req.body));
});

app.get('/report', (req, res) => {
    res.status(200).send(app.database.Report());
});

app.get('/errorlog', (req, res) => {
    res.status(200).send( app.database.ErrorLog());
});

app.get('/pingReplicas', async (req, res) => {
    const {role} = app.database.getState();
    if( role === 'Leader'){
        const obj = {
            Leader: app.database.Report()
        }
        const replicas = await app.database.PingReplicas();
        res.status(200).send(Object.assign( {}, obj, { Replicas: replicas}));
    }
    else{
        res.status(200).send('This database is a replica.  Ping replicas from the leader.');
    }
});

app.get('/replicas/:replicaList', (req, res) => {
    const {role} = app.database.getState();
    if( role === 'Leader'){
        res.status(200).send( app.database.setReplicas(req.params.replicaList));
    }
    else{
        res.status(200).send( 'Set replicas on the Leader.');
    }
});

app.get('/replicationErrorLog', (req, res) => {
    const {role} = app.database.getState();
    if( role === 'Leader'){
        res.status(200).send( app.database.ReplicationErrorLog());
    }
    else{
        res.status(200).send( 'See replication errors on the Leader.');
    }
});

module.exports = app;