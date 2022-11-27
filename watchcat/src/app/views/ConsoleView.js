import React from 'react';
import toasts from '../helpers/toasts';
import socketHandler from '../helpers/socketHandler';

import { get, getData, post } from '../helpers/net-handler';

import './styles/console-view.scss';
import Ribbon from '../components/ribbon/Ribbon';
import InstallControls from '../components/control-panel/fragments/install-controls/InstallControls';

import actions from './console-view/actions';

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
    if (!line)
        return null; // The console spits newline chars, so this fixes that.

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

        classes.push('bg', 'warn');

        arr.push(
            addPart('[', 'bracket'),
            addPart(match[2], 'warn'),
            addPart('] ', 'bracket')
        );
    }

    match = out.match(javaWarn);

    if (match !== null) {
        out = out.replace(match[0], '');

        classes.push('bg', 'warn');

        arr.push(addPart('WARNING', 'warn'));
    }

    match = out.match(javaError);

    if (match !== null) {
        out = out.replace(match[0], '');

        classes.push('bg', 'error');

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

        classes.push('bg', 'error');

        arr.push(
            addPart('[', 'bracket'),
            addPart(match[2], 'error'),
            addPart('] ', 'bracket')
        );
    }

    arr.push(addPart(out, ''));

    return <li
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

        <span>
            {end}
        </span>
    </li>;
}

/**
 *
 * @param {*} param0
 * @returns
 */
function TerminalLine({ log }) {
    const lines = log.split('\n');

    return lines.map(FormattedTerminalLine);
}

class Terminal extends React.Component {
    getHistory() {
        console.debug('Getting log history...');

        return new Promise((resolve, reject) => {
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

                    this.setState(state, resolve);
                })
                .catch(reject);
        });
    }

    clearLogs() {
        let state = this.state;
        state.logs = [];
        this.setState(state);
    }

    /**
     *
     * @param {*} e
     */
    sendCommand(e) {
        e.preventDefault();

        const fields = Object.fromEntries(new FormData(e.target));

        post('/send', JSON.stringify({ message: fields.cmd }))
            .then((response) => response.text())
            .then(() => {
                const elem = document.getElementById('terminal_input');
                if (elem)
                    elem.value = null;

                let state = this.state;
                state.commandHistory.push(fields.cmd);
                this.setState(state);
            })
            .catch((err) => {
                console.error(err);
                toasts.error(err.message);
            });
    }

    /**
     *
     * @param {*} value
     */
    updateScrollPos(value) {
        let state = this.state;
        state.scrollPos = value;
        this.setState(state);
    }

    scrollToTop() {
        const elem = document.getElementById('terminal');
        if (elem) {
            elem.scrollTop = 0;

            this.updateScrollPos(0);
        }
    }

    scrollToBottom() {
        const elem = document.getElementById('terminal');
        if (elem) {
            elem.scrollTop = elem.scrollHeight;

            this.updateScrollPos(elem.scrollHeight);
        }
    }

    /**
     *
     * @param {*} data
     */
    pushLogToTerminal(data) {
        console.log('Data:', data);

        const elem = document.getElementById('terminal');
        let bottom = false;

        if (elem)
            bottom = Math.abs(elem.scrollHeight - elem.scrollTop - elem.clientHeight) <= 3.0;

        let state = this.state;

        if (data instanceof ArrayBuffer) {
            const enc = new TextDecoder('utf-8');
            state.logs.push(enc.decode(data));

            this.setState(state, () => {
                if (bottom)
                    this.scrollToBottom();
            });
        }
        else
            console.debug('Data not instance of ArrayBuffer', data);
    }

    componentDidMount() {
        this.getHistory()
            .then(() => {
                this.scrollToBottom();
            })
            .catch(console.error);
    }

    render() {
        return <div
            className='terminal-wrapper'
        >
            <ul
                id='terminal'
                className='terminal-container'
            >
                {
                    this.state.logs.map((log, i) =>
                        <TerminalLine
                            key={i}
                            log={log}
                        />
                    )
                }
            </ul>

            <div
                className='terminal-controls'
            >
                <button
                    className='btn primary'
                    onClick={this.getHistory}
                >
                    <i
                        className='icon bi bi-arrow-repeat'
                    />
                </button>

                <button
                    className='btn primary'
                    onClick={this.clearLogs}
                >
                    Clear Logs
                </button>

                <form
                    className='terminal-input-row'
                    onSubmit={this.sendCommand}
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
        </div>;
    }

    constructor(props) {
        super(props);

        this.state = {
            logs: [],
            commandHistory: [],
            scrollPos: 0
        };

        this.clearLogs = this.clearLogs.bind(this);
        this.sendCommand = this.sendCommand.bind(this);
        this.scrollToTop = this.scrollToTop.bind(this);
        this.scrollToBottom = this.scrollToBottom.bind(this);
        this.pushLogToTerminal = this.pushLogToTerminal.bind(this);

        socketHandler.addListener('lsdata', this.pushLogToTerminal);
    }
}

/**
 *
 * @returns
 */
function ConsoleContainer() {
    return <div
        className='console-container container'
    >
        <Terminal />
    </div>;
}

export default class ConsoleView extends React.Component {
    refresh() {
        getData('/profiles/list')
            .then((list) => this.setState({ profileList: list }))
            .catch(console.error);
    }

    getProfiles() {
        return {
            list: this.state.profileList
        };
    }

    componentDidMount() {
        this.refresh();
    }

    render() {
        return <div
            className='view console-view'
        >
            <div
                className='console-header'
            >
                <Ribbon
                    content={
                        () => [
                            {
                                label: 'Server',
                                content: [
                                    {
                                        label: 'Status',
                                        onClick: actions.server.status
                                    },
                                    {
                                        label: 'Start',
                                        onClick: actions.server.start
                                    },
                                    {
                                        label: 'Stop',
                                        onClick: actions.server.stop
                                    },
                                    {
                                        label: 'Restart',
                                        onClick: actions.server.restart
                                    },
                                    {
                                        label: 'Ping',
                                        onClick: actions.server.ping
                                    },
                                    {
                                        label: 'Terminate',
                                        onClick: actions.server.terminate,
                                        style: {
                                            color: 'red'
                                        }
                                    }
                                ]
                            },
                            {
                                label: 'Console',
                                content: [
                                    {
                                        label: 'Reconnect',
                                        onClick: actions.console.reconnect
                                    },
                                    {
                                        label: 'Refresh',
                                        onClick: console.debug
                                    }
                                ]
                            },
                            {
                                label: 'World',
                                content: [
                                    {
                                        label: 'Create Backup',
                                        onClick: actions.world.backup
                                    }
                                ]
                            }
                        ]
                    }
                />

                <InstallControls
                    profiles={this.getProfiles()}
                    refresh={this.refresh}
                />
            </div>

            <ConsoleContainer />
        </div>;
    }

    constructor(props) {
        super(props);

        const { featureFlags } = props;

        this.featureFlags = featureFlags;

        this.state = {
            profileList: []
        };

        this.refresh = this.refresh.bind(this);
    }
}