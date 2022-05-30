import React from 'react';
import toasts from '../helpers/toasts';
import modalManager from './ModalManager';
import FileManger from '../components/file-manager/FileManager';
import ControlPanel from '../components/control-panel/ControlPanel';

import { io } from 'socket.io-client';
import { domain, get, getData, post } from '../helpers/net-handler';

import './styles/view.css';
import './styles/terminal.css';

const timestamp = /(\[(\d+:\d+:\d+)\])\s*/;
const warn = /(\[([\w\s-]+\/WARN)\])\s*/;
const javaWarn = /WARNING/;
const javaError = /ERROR/;
const info = /(\[([\w\s-]+\/INFO)\])\s*/;
const error = /(\[(([\w\s-]+\/ERROR)|(STDERR\/))\])\s*/;

/**
 *
 * @param {string} line
 */
function FormattedTerminalLine(line, i) {
    const parts = line.split(': ');

    let out = parts.shift();
    let end = ' ' + parts.join(': ');
    const arr = [];

    const classes = [
        'terminal-line'
    ];

    /**
     *
     * @param {string} content
     * @param  {...string} classes
     */
    const addPart = (content, ...classes) => {
        return {
            content,
            classes
        };
    };

    let match = out.match(timestamp);

    if (match !== null) {
        out = out.replace(match[1], '');

        arr.push(
            addPart('[', 'bracket'),
            addPart(match[2], 'timestamp'),
            addPart('] ', 'bracket')
        );
    }

    match = out.match(warn);

    if (match !== null) {
        out = out.replace(match[1], '');

        classes.push('warn-bg');

        arr.push(
            addPart('[', 'bracket'),
            addPart(match[2], 'warn'),
            addPart('] ', 'bracket')
        );
    }

    match = out.match(javaWarn);

    if (match !== null) {
        out = out.replace(match[0], '');

        classes.push('warn-bg');

        arr.push(addPart('WARNING', 'warn'));
    }

    match = out.match(javaError);

    if (match !== null) {
        out = out.replace(match[0], '');

        classes.push('error-bg');

        arr.push(addPart('ERROR', 'error'));
    }

    match = out.match(info);

    if (match !== null) {
        out = out.replace(match[1], '');

        arr.push(
            addPart('[', 'bracket'),
            addPart(match[2], 'info'),
            addPart('] ', 'bracket')
        );
    }

    match = out.match(error);

    if (match !== null) {
        out = out.replace(match[1], '');

        classes.push('error-bg');

        arr.push(
            addPart('[', 'bracket'),
            addPart(match[2], 'error'),
            addPart('] ', 'bracket')
        );
    }

    arr.push(addPart(out, ''));

    return <div
        key={i}
        className={classes.join(' ')}
    >
        {
            arr.map((v, i) =>
                <span
                    key={i}
                    className={v.classes.join(' ')}
                >
                    {v.content}
                </span>
            )
        }
        {
            <span>
                {end}
            </span>
        }
    </div>;
}

/**
 *
 * @param {*} param0
 * @returns
 */
function TerminalLine({ log }) {
    const lines = log.split('\n');

    return <>
        {
            lines.map(FormattedTerminalLine)
        }
    </>;
}

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
            id='terminal'
            className='terminal-container'
        >
            {
                logs.map((log, i) =>
                    <TerminalLine
                        key={i}
                        log={log}
                    />
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

            state.socket.on('ftpupdate', () => {
                document.getElementById('refresh_file_list').click();
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

    refresh() {
        getData('/profiles/list')
            .then((list) => {
                let state = this.state;
                state.profileList = list;
                this.setState(state);
            })
            .catch(console.error);
    }

    componentDidMount() {
        this.connect();

        getData('/feature-flags.json')
            .then((featureFlags) => {
                let state = this.state;
                state.featureFlags = featureFlags;
                this.setState(state, () => {
                    this.refresh();
                });
            })
            .catch(console.error);
    }

    render() {
        const sendCommand = (e) => {
            e.preventDefault();

            const fields = Object.fromEntries(new FormData(e.target));

            post('/send', JSON.stringify({ message: fields.cmd }))
                .then((response) => response.text())
                .then(() => {
                    const elem = document.getElementById('terminal_input');
                    if (elem)
                        elem.value = null;

                    setTimeout(scrollToBottom, 500);
                })
                .catch((err) => {
                    console.error(err);
                    toasts.error(err.message);
                });
        };

        const scrollToTop = () => {
            const elem = document.getElementById('terminal');
            elem.scrollTop = 0;
        };

        const scrollToBottom = () => {
            const elem = document.getElementById('terminal');
            elem.scrollTop = elem.scrollHeight;
        };

        const ConsoleContainer = () => <div
            className='container'
        >
            <div
                className='terminal-controls'
            >
                <button
                    type='button'
                    className='btn primary'
                    onClick={scrollToTop}
                >
                    Top
                </button>

                <button
                    type='button'
                    className='btn primary'
                    onClick={scrollToBottom}
                >
                    Bottom
                </button>
            </div>

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
                    onSubmit={sendCommand}
                >
                    <div
                        className='input-row'
                    >
                        <input
                            type='text'
                            name='cmd'
                            id='terminal_input'
                            className='input left'
                            placeholder='>_'
                        />

                        <button
                            type='submit'
                            className='btn primary'
                        >
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div >;

        const profiles = {
            list: this.state.profileList
        };

        return (
            <div
                className='view'
            >
                <div
                    className='view-part'
                >
                    <ControlPanel
                        openModal={this.openModal}
                        closeModal={this.closeModal}
                        connect={this.connect}
                        featureFlags={this.state.featureFlags}
                        profiles={profiles}
                        refresh={this.refresh}
                    />
                </div>

                <div
                    className='view-part'
                >
                    <ConsoleContainer />
                </div>

                <div
                    className='view-part'
                >
                    <FileManger
                        openModal={this.openModal}
                        closeModal={this.closeModal}
                    />
                </div>

                {
                    Array.from(this.state.modals.keys())
                        .map((key, i) =>
                            <div
                                key={i}
                                id={`modal_${key}`}
                            >
                                {this.state.modals.get(key)}
                            </div>
                        )
                }
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
            modals: new Map(),

            /**
             * @type {Object.<string, *>}
             */
            featureFlags: null,
            /**
             * @type {string[]}
             */
            profileList: [],
            scrollPos: 0
        };

        this.refresh = this.refresh.bind(this);
        this.connect = this.connect.bind(this);
        this.getSocket = this.getSocket.bind(this);
        this.clearLogs = this.clearLogs.bind(this);
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);

        modalManager.init(this.openModal, this.closeModal);
    }
}