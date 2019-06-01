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
    res.status(200).send(`Hello from the the DB ${app.database.state.role}!  You have truely made an excellent connection.`);
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
    const dbState = app.database.getState();
    if( dbState.status === 'stopped'){
        res.status(401).send( `DB is not running.` );
    }
    else{
        res.status(200).send( app.database.Commit(req.body));
    }
});

app.get('/bumpArchive', (req, res) => {
    res.status(200).send(app.database.BumpArchive());
});

app.get('/report', (req, res) => {
    res.status(200).send(app.database.Report());
});

app.get('/errorlog', (req, res) => {
    res.status(200).send( app.database.ErrorLog());
});

app.get('/pingReplicas', async (req, res) => {
    const replicas = await app.database.PingReplicas();
    res.status(200).send(replicas);
});

app.get('/startReplicas', async (req, res) => {
    const replicas = await app.database.StartReplicas();
    res.status(200).send(replicas);
});

app.get('/stopReplicas', async (req, res) => {
    const replicas = await app.database.StopReplicas();
    res.status(200).send(replicas);
});

app.get('/setReplicas/:replicaList', (req, res) => {
    res.status(200).send( app.database.SetReplicas(req.params.replicaList.trim()));
});

app.get('/checkReplicaStatus/', async (req, res) => {
    const result = await app.database.CheckReplicaStatus();
    res.status(200).send( result );
});

app.get('/catchupReplica/:replica', async (req, res) => {
    const result = await app.database.CatchupReplica(req.params.replica);
    res.status(200).send( result );
});

app.get('/showHoldingPattern', (req, res) => {
    res.status(200).send( app.database.ShowHoldingPattern());
});

app.get('/replicationErrorLog', (req, res) => {
    res.status(200).send( app.database.ReplicationErrorLog());
});

module.exports = app;