/* eslint-disable react/prop-types */

import React from 'react';
import { get, post } from '../../helpers/net-handler';
import toasts from '../../helpers/toasts';

import './styles/control-panel.css';

/**
 *
 * @param {*} param0
 * @returns
 */
export default function ControlPanel({ connect }) {

    const start = (e) => {
        e.preventDefault();

        const jvmArgs = Object.fromEntries(new FormData(e.target));

        console.debug('Using JVM:', jvmArgs);

        post('/start', jvmArgs)
            .then((response) => response.text())
            .then(() => setTimeout(connect, 1000))
            .catch((err) => console.error(err));
    };

    const install = (e) => {
        e.preventDefault();

        const installArgs = Object.fromEntries(new FormData(e.target));

        if (!installArgs.version_minecraft || !installArgs.version_forge)
            return toasts.error('Missing install arguments.');

        installArgs.install = true;

        console.debug('Using install args:', installArgs);

        post('/start', installArgs)
            .then((response) => response.text())
            .then(() => setTimeout(connect, 1000))
            .catch((err) => console.error(err));
    };

    const stop = (e) => {
        e.preventDefault();

        post('/stop')
            .then((response) => response.text())
            .then((data) => console.log(data))
            .catch((err) => console.error(err));
    };

    const restart = (e) => {
        e.preventDefault();
    };

    const send = (e) => {
        e.preventDefault();

        post('/send', { message: 'Test' })
            .then((response) => response.text())
            .then((data) => console.log(data))
            .catch((err) => console.error(err));
    };

    const reconnect = (e) => {
        e.preventDefault();
        connect();
    };

    const backup = (e) => {
        e.preventDefault();

        post('/backup')
            .then((response) => response.text())
            .then((data) => console.log(data))
            .catch((err) => console.error(err));
    };

    const status = (e) => {
        e.preventDefault();

        get('/status')
            .then((response) => response.text())
            .then((data) => console.log(data))
            .catch((err) => console.error(err));
    };

    const terminate = (e) => {
        e.preventDefault();

        post('/reset')
            .then((response) => response.text())
            .then((data) => console.log(data))
            .catch((err) => console.error(err));
    };

    return (
        <div>
            <form
                id='control_panel'
                className='control-panel-container container'
                onSubmit={start}
            >
                <div
                    className='control-list'
                >
                    <button
                        type='button'
                        className='btn primary'
                        onClick={status}
                    >
                        Status
                    </button>

                    <button
                        type='submit'
                        className='btn primary'
                    >
                        Start
                    </button>

                    <button
                        className='btn primary'
                        onClick={stop}
                    >
                        Stop
                    </button>

                    <button
                        className='btn primary'
                        onClick={restart}
                    >
                        Restart
                    </button>

                    <button
                        className='btn primary'
                        onClick={send}
                    >
                        Ping
                    </button>

                    <button
                        className='btn primary'
                        onClick={reconnect}
                    >
                        Reconnect
                    </button>

                    <button
                        className='btn primary'
                        onClick={backup}
                    >
                        Create Backup
                    </button>

                    <button
                        className='btn primary'
                        onClick={terminate}
                    >
                        Terminate
                    </button>
                </div>

                <div
                    className='jvm-argument-container'
                >
                    <span>
                        JVM Arguments
                    </span>

                    <ul
                        className='jvm-argument-list'
                    >
                        <li
                            className='input-row'
                        >
                            <label
                                className='input-label'
                            >
                                Memory (G)
                            </label>
                            <input
                                type='number'
                                name='jvm_memory'
                                className='input'
                                min={0}
                                max={8}
                                defaultValue={6}
                                required
                            />
                        </li>
                    </ul>
                </div>
            </form>

            <form
                id='control_panel_install'
                className='control-panel-container container'
                onSubmit={install}
            >
                <div
                    className='jvm-argument-container'
                >
                    <span>
                        Version Settings
                    </span>

                    <ul
                        className='jvm-argument-list'
                    >
                        <li
                            className='input-row'
                        >
                            <label
                                className='input-label'
                            >
                                Minecraft Version
                            </label>
                            <input
                                type='text'
                                name='version_minecraft'
                                className='input'
                                placeholder='ex: 1.16.5'
                                required
                            />
                        </li>

                        <li
                            className='input-row'
                        >
                            <label
                                className='input-label'
                            >
                                Forge Version
                            </label>
                            <input
                                type='text'
                                name='version_forge'
                                className='input'
                                placeholder='ex: 36.2.34'
                                required
                            />
                        </li>
                    </ul>

                    <button
                        type='submit'
                    >
                        Install
                    </button>
                </div>
            </form>
        </div>
    );
}