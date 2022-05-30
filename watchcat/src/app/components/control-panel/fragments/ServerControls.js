import React from 'react';

import * as adapter from '../adapter';

const server = adapter.default.features;

/**
 * @typedef Props
 * @property {function()} connect
 *
 * @param {Props} param0
 * @returns
 */
export default function ServerControls({ connect }) {
    const start = (e) => {
        e.preventDefault();

        const fields = { profile: document.getElementById('profile_select').value };

        server.start(fields, connect);
    };

    const stop = (e) => {
        e.preventDefault();
        server.stop();
    };

    const restart = (e) => {
        e.preventDefault();
        server.restart(Object.fromEntries(new FormData(e.target)), connect);
    };

    const send = (e) => {
        e.preventDefault();
        server.sendCommand('Test');
    };

    const reconnect = (e) => {
        e.preventDefault();
        connect();
    };

    const backup = (e) => {
        e.preventDefault();
        server.backup();
    };

    const status = (e) => {
        e.preventDefault();
        server.status();
    };

    const terminate = (e) => {
        e.preventDefault();
        server.terminate();
    };

    const fields = [
        {
            text: 'Status',
            onClick: status
        },
        {
            text: 'Start',
            onClick: start
        },
        {
            text: 'Stop',
            onClick: stop
        },
        {
            text: 'Restart',
            onClick: restart
        },
        {
            text: 'Ping',
            onClick: send
        },
        {
            text: 'Reconnect',
            onClick: reconnect
        },
        {
            text: 'Create Backup',
            onClick: backup
        },
        {
            text: 'Terminate',
            onClick: terminate
        }
    ];

    return <form
        id='server_control_panel'
        className='control-panel-container container'
    >
        <div
            className='control-list'
        >
            {
                fields.map((field, i) =>
                    <button
                        key={i}
                        type='button'
                        className='btn primary'
                        onClick={field.onClick}
                    >
                        {field.text}
                    </button>
                )
            }
        </div>
    </form>;
}