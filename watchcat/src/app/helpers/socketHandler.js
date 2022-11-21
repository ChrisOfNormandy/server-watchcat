import toasts from './toasts';

import { io } from 'socket.io-client';
import { domain } from './net-handler';

const socketHandler = {
    /**
     * @type {import('socket.io-client').Socket}
     */
    socket: null,

    user: null,

    addListener(channel, fn) {
        if (!this.socket)
            return console.error('Socket not connected.');

        if (!this.socket.hasListeners(channel))
            this.socket.on(channel, fn);
        else
            console.debug('Socket already contains listener for channel:', channel);

        return this.socket;
    },

    emit(channel, data) {
        this.socket.emit(channel, data);

        return this.socket;
    },

    connect() {
        console.debug('Connecting to server.');

        if (!this.socket) {
            console.debug('Socket not established. Creating.');

            this.socket = io(domain);
        }
        else {
            console.debug('Socket already exists. Reconnecting.');

            this.socket.connect();
        }

        const onConnect = () => {
            console.debug('connected.', this.socket.id);
            toasts.info('Established and ready!', 'Connection');
        };

        const onDisconnect = (reason) => {
            console.debug('Socket disconnected:', reason);
            toasts.info(`Disconnected: ${reason || 'unknown reason'}`, 'Connection');
            this.socket.connect();
        };

        this.addListener('connect', onConnect);
        this.addListener('disconnect', onDisconnect);

        [
            ['srvdebug', console.debug, null],
            ['srvinfo', console.info, toasts.info],
            ['srvwarn', console.warn, toasts.warning],
            ['srverr', console.error, toasts.error],
            ['srvsuccess', console.debug, toasts.success]
        ].forEach((logging) => {
            const onLog = (data) => {
                logging[1](data);
                if (logging[2])
                    logging[2](data);
            };

            this.addListener(logging[0], onLog);
        });

        return this.socket;
    }
};

export default socketHandler;