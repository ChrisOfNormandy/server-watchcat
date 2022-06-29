#!/usr/bin/env node

const env = require('./env');
const cors = require('cors');
const express = require('express');
const logging = require('./src/logging/logging');

const { Server } = require('socket.io');
const { createServer } = require('http');
const { mcServer } = require('./src/server');
const { init } = require('./src/handlers/auth');

const endpoints = require('./src/endpoints');
const profiles = require('./src/handlers/profiles');
const cli = require('./src/server/cli');

/**
 *
 */
function startHttpServer() {
    init();
    profiles.init();

    const app = express();
    const httpServer = createServer(app);
    const io = new Server(httpServer, { cors: true });

    io.on('connection', (socket) => {
        mcServer.addConnection(socket);

        endpoints.sockets.forEach((v) => socket.on(v.channel, v.fn));
    });

    app.use(express.json({ limit: '200mb' }));
    app.use(express.urlencoded({ extended: true, limit: '200mb' }));

    app.use(cors());
    app.options('*', cors());

    app.use(express.static(env.webPath(), { index: false }));

    endpoints.get.forEach((endpoint) => app.get(endpoint.path, endpoint.fn));

    endpoints.post.forEach((endpoint) => {
        if (endpoint.options)
            app.post(endpoint.path, endpoint.options, endpoint.fn);
        else
            app.post(endpoint.path, endpoint.fn);
    });

    httpServer.listen(env.port, () => {
        logging.info('Server started on:', env.port);
        logging.debug(env.webPath(), env.twoFA);

        cli();
    });
}

startHttpServer();