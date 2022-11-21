import React from 'react';
import toasts from '../../../helpers/toasts';
import modalManager from '../../../views/ModalManager';
import socketHandler from '../../../helpers/socketHandler';

import * as adapter from '../adapter';

const server = adapter.default.features;

/**
 *
 * @returns
 */
export default function ServerControls() {
    const start = (e) => {
        e.preventDefault();

        const elem = document.getElementById('profile_select');
        if (!elem)
            toasts.info('You must create a profile before starting a server.');
        else {
            const fields = { profile: elem.value };

            server.start(fields);
        }
    };

    const stop = (e) => {
        e.preventDefault();

        const elem = document.getElementById('profile_select');

        if (!elem)
            toasts.info('You must create a profile before stopping a server.');
        else
            server.stop();
    };

    const restart = (e) => {
        e.preventDefault();

        const elem = document.getElementById('profile_select');
        if (!elem)
            toasts.info('You must create a profile before starting a server.');
        else {
            const fields = { profile: elem.value };

            server.restart(fields);
        }
    };

    const send = (e) => {
        e.preventDefault();
        server.sendCommand('Test');
    };

    const reconnect = (e) => {
        e.preventDefault();
        socketHandler.connect();
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

        const modal = <form
            onSubmit={
                (e) => {
                    e.preventDefault();

                    const fields = Object.fromEntries(new FormData(e.target));

                    if (!fields.confirm)
                        return false;

                    server.terminate();

                    modalManager.close('terminate_java');
                }
            }
        >
            <div>
                Clicking confirm will kill all Java processes on the server. Are you sure you want to continue?
            </div>

            <label>Confirm</label>
            <input
                type='checkbox'
                name='confirm'
            />

            <button>
                Kill Java
            </button>
        </form>;

        modalManager.create('terminate_java', modal).build();
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