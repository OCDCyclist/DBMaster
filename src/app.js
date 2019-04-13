'use strict';

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const {Database} = require('./Database');

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

const role = 'Leader';
const database = new Database(role);

app.get('/', (req, res) => {
    res.status(200).send(`Hello from the the DB ${role}!  You have truely made an excellent connection.`);
});

app.get('/start', (req, res) => {
    res.status(200).send( database.Start());
});

app.get('/stop', (req, res) => {
    res.status(200).send(database.Stop());
});

app.get('/state', (req, res) => {
    res.status(200).send(database.getState());
});

app.get('/report', (req, res) => {
    res.status(200).send(database.Report());
});

app.post('/add', (req, res) => {
    res.status(200).send(database.Commit(req.body));
});

module.exports = app;