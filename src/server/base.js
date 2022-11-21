const logging = require('../logging/logging');
const start = require('./start');

class Connection {
    send(data) {
        this.socket.emit('lsdata', data);
    }

    /**
     *
     * @param {import('socket.io').Socket} socket
     */
    constructor(socket) {
        this.socket = socket;

        this.whiteboard = {
            position: {
                x: 0,
                y: 0,
                z: 0
            }
        };
    }
}

class MinecraftServer {
    getStatus() {
        return this.server
            ? !this.server.killed
            : false;
    }

    pushHistory(data) {
        this.history.push(data);

        while (this.history.length > 1000)
            this.history.shift();

        return this.history;
    }

    start(profile) {
        return new Promise((resolve, reject) => {
            start(this, profile)
                .then((serverProcess) => {
                    if (serverProcess !== null) {
                        this.server = serverProcess;

                        logging.info('Server is starting.', this.getStatus());

                        const listener = (data) => {
                            this.pushHistory(data);
                            this.connections.forEach((con) => con.send(data));
                        };

                        if (this.server.stdout) {
                            this.server.stdout.on('data', listener);
                            this.server.stderr.on('data', listener);
                        }
                        else
                            logging.info('No server STDOUT. Did the server close?\n', this.server);

                        resolve(this.server);
                    }
                    else {
                        resolve(null);
                    }
                })
                .catch((err) => reject(err));
        });
    }

    send(msg) {
        if (this.getStatus()) {
            try {
                this.server.stdin.write(`${msg}\n`);

                return true;
            }
            catch (err) {
                logging.error(err);

                return err;
            }
        }

        return false;
    }

    kill() {
        if (this.getStatus) {
            logging.info('Stopping server...');

            return new Promise((resolve, reject) => {
                try {
                    if (!this.server)
                        resolve(this.getStatus());
                    else {
                        this.send('stop\n');

                        setTimeout(() => {
                            // In case the server dies before we kill it.
                            if (!this.server)
                                resolve(false);
                            else {
                                if (this.server.stdin)
                                    this.server.stdin.pause();

                                this.server.kill();

                                logging.info('Server stopped.');

                                this.server = null;

                                resolve(this.getStatus());
                            }
                        }, 5000);
                    }
                }
                catch (err) {
                    reject(err);
                }
            });
        }

        return Promise.resolve(false);
    }

    addConnection(socket) {
        const con = new Connection(socket);

        if (this.getStatus()) {
            logging.info('User connected');
            socket.emit('lsdata', 'Server exists.');
        }
        else {
            logging.info('User connected, but no server');
            socket.emit('lsdata', 'No server.');
        }

        socket.on('disconnect', () => {
            logging.info('User disconnected.', socket.id);
            this.connections.delete(socket.id);
        });

        this.connections.set(socket.id, con);

        return con;
    }

    pushEmit(channel, data) {
        this.connections.forEach((con) => con.socket.emit(channel, data));
    }

    constructor() {
        this.server = null;
        this.history = [];

        /**
         * @type {Map<string, Connection>}
         */
        this.connections = new Map();
    }
}

module.exports = {
    MinecraftServer
};