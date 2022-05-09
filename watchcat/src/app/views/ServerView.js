import React from 'react';
import toasts from '../helpers/toasts';
import ControlPanel from '../components/control-panel/ControlPanel';
import FileManger from '../components/control-panel/file-manager/FileManager';

import { io } from 'socket.io-client';
import { domain, get, post } from '../helpers/net-handler';

import './styles/view.css';
import './styles/terminal.css';

/**
 * @typedef Props
 * @property {*[]} logs
 *
 * @param {Props} param0
 * @returns
 */
function Terminal({ logs }) {
    return (
        <div
            className='terminal-container'
        >
            {
                logs.map((log, i) =>
                    <div
                        key={i}
                    >
                        {log}
                    </div>
                )
            }
        </div>
    );
}

export default class ServerView extends React.Component {
    connect() {
        console.debug('Connecting to server.');

        let state = this.state;

        const getHistory = () => {
            console.debug('Getting log history...');

            get('/history')
                .then((response) => response.text())
                .then((json) => {
                    console.debug('Got history!');

                    let state = this.state;

                    const arr = JSON.parse(json);

                    state.logs.push(
                        ...arr.map((b) => {
                            const enc = new TextDecoder('utf-8');

                            return enc.decode(new Uint8Array(b.data));
                        })
                    );
                    this.setState(state);
                })
                .catch((err) => console.error(err));
        };

        if (!state.socket) {
            console.debug('Socket not established. Creating.');

            state.socket = io(domain);

            state.socket.on('connect', () => {
                console.debug('connected.', this.state.socket.id);
                toasts.info('Established and ready!', 'Connection');
            });

            [
                ['srvdebug', console.debug, null],
                ['srvinfo', console.info, toasts.info],
                ['srvwarn', console.warn, toasts.warning],
                ['srverr', console.error, toasts.error],
                ['srvsuccess', console.debug, toasts.success]
            ].forEach((logging) => {
                state.socket.on(logging[0], (data) => {
                    logging[1](data);
                    if (logging[2])
                        logging[2](data);
                });
            });

            state.socket.on('lsdata', (data) => {
                let state = this.state;

                if (data instanceof ArrayBuffer) {
                    const enc = new TextDecoder('utf-8');
                    state.logs.push(enc.decode(data));
                    this.setState(state);
                }
                else {
                    console.debug('Data not instance of ArrayBuffer', data);
                }
            });

            state.socket.on('disconnect', (reason) => {
                console.debug('Socket disconnected:', reason);
                toasts.info(`Disconnected: ${reason || 'unknown reason'}`, 'Connection');
                state.socket.connect();
            });

            getHistory();
        }
        else {
            console.debug('Socket already exists. Reconnecting.');

            state.socket.connect();

            getHistory();
        }
    }

    getSocket() {
        return this.state.socket;
    }

    clearLogs() {
        let state = this.state;
        state.logs = [];
        this.setState(state);
    }

    openModal(id, modal) {
        const state = this.state;
        state.modals.set(id, modal);
        this.setState(state);
    }

    closeModal(id) {
        console.debug('Closing:', id);

        const state = this.state;
        state.modals.delete(id);
        this.setState(state);
    }

    componentDidMount() {
        this.connect();
    }

    render() {
        const dragOver = (e) => {
            e.preventDefault();

            return false;
        };

        const drop = (e) => {
            const offset = e.dataTransfer.getData('text/plain').split(',');

            const dm = document.getElementById(offset[2]);

            dm.style.left = e.clientX + parseInt(offset[0], 10) + 'px';
            dm.style.top = e.clientY + parseInt(offset[1], 10) + 'px';

            e.preventDefault();

            return false;
        };

        return (
            <div
                className='view'
                onDragOver={dragOver}
                onDrop={drop}
            >
                <ControlPanel
                    connect={this.connect}
                    getSocket={this.getSocket}
                />

                <div
                    className='console-container'
                >
                    <Terminal
                        logs={this.state.logs}
                    />

                    <div
                        className='terminal-controls'
                    >
                        <button
                            className='btn primary'
                            onClick={this.clearLogs}
                        >
                            Clear Logs
                        </button>

                        <form
                            className='terminal-input-row'
                            onSubmit={
                                (e) => {
                                    e.preventDefault();

                                    const fields = Object.fromEntries(new FormData(e.target));

                                    post('/send', JSON.stringify({ message: fields.cmd }))
                                        .then((response) => response.text())
                                        .then(() => {
                                            const elem = document.getElementById('terminal_input');
                                            if (elem)
                                                elem.value = null;
                                        })
                                        .catch((err) => console.error(err));
                                }
                            }
                        >
                            <input
                                type='text'
                                name='cmd'
                                id='terminal_input'
                                className='terminal-input'
                                placeholder='>_'
                            />
                            <button
                                type='submit'
                                className='terminal-input-btn btn primary'
                            >
                                Send
                            </button>
                        </form>
                    </div>
                </div>

                <FileManger
                    openModal={this.openModal}
                    closeModal={this.closeModal}
                />

                {Array.from(this.state.modals.values()).map((modal, i) => <div key={i}>{modal}</div>)}
            </div>
        );
    }

    constructor(props) {
        super(props);

        this.state = {
            /**
             * @type {import('socket.io').Socket}
             */
            socket: null,
            logs: [],
            modals: new Map()
        };

        this.connect = this.connect.bind(this);
        this.getSocket = this.getSocket.bind(this);
        this.clearLogs = this.clearLogs.bind(this);
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);
    }
}