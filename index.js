#!/usr/bin/env node

const env = require('./env');
const cors = require('cors');
const express = require('express');
const upload = require('multer')();
const ftp = require('./src/handlers/ftp');
const auth = require('./src/handlers/auth');
const server = require('./src/handlers/server');
const logging = require('./src/logging/logging');
const routing = require('./src/handlers/routing');

const { Server } = require('socket.io');
const { createServer } = require('http');
const { exec } = require('child_process');
const { mcServer } = require('./src/server');
const { init } = require('./src/handlers/auth');
const { readFile } = require('fs');

/**
 *
 * @param {string} file
 * @returns
 */
function getDocumentation(file) {
    return __dirname + '/documentation/' + file;
}

/**
 *
 */
function startHttpServer() {
    init();

    const app = express();
    const httpServer = createServer(app);
    const io = new Server(httpServer, { cors: true });

    io.on('connection', (socket) => {
        mcServer.addConnection(socket);
    });

    app.use(express.json({ limit: '200mb' }));
    app.use(express.urlencoded({ extended: true, limit: '200mb' }));

    app.use(cors());
    app.options('*', cors());

    app.use(express.static(env.web, { index: false }));

    app.post('/auth/register', auth.register);

    app.post('/auth/generate', auth.generate);

    app.post('/auth/validate', auth.validate);

    app.post('/start', (req, res) => server.start(req, res, mcServer));

    app.post('/stop', (req, res) => server.stop(req, res, mcServer));

    app.get('/status', (req, res) => {
        logging.infoEmit(mcServer, 'Running:', mcServer.getStatus());
        res.send(mcServer.getStatus());
    });

    app.get('/history', (req, res) => res.send(mcServer.history));

    app.post('/backup', (req, res) => {
        if (mcServer.getStatus())
            res.send(mcServer.send('backup start'));
        else
            res.send(false);
    });

    app.post('/send', (req, res) => {
        if (mcServer.getStatus())
            res.send(mcServer.send(`${req.body.message}`));
        else
            res.send(false);
    });

    app.post('/upload/:dir', upload.single('file'), ftp.upload.file);

    app.post('/files/:action/:dir', ftp.run);

    app.get('/files/:dir', ftp.fetch);

    app.post('/login', auth.login);

    app.get('/wall-of-text', (req, res) => {
        readFile(getDocumentation('wall-of-text.txt'), (err, data) => {
            if (err) {
                logging.error(err);
                res.send('');
            }
            else
                res.send(data);
        });
    });

    app.get('/status', (req, res) => res.send(mcServer.getStatus()));

    app.post('/reset', (req, res) => {
        exec('pkill java', (err, stdout) => {
            if (err)
                logging.error(err);
            else {
                logging.info(stdout);
            }

            res.send(null);
        });
    });

    app.get('/', routing.index);

    httpServer.listen(env.port, () => {
        logging.info('Server started on:', env.port);
        logging.debug(env.web, env.twoFA);
    });
}

startHttpServer();