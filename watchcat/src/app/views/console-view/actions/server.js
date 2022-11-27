import React from 'react';
import * as adapter from '../../../components/control-panel/adapter';
import toasts from '../../../helpers/toasts';
import modalManager from '../../ModalManager';

const server = adapter.default.features;

/**
 *
 * @param {*} e
 */
export function status(e) {
    e.preventDefault();
    server.status();
}

/**
 *
 * @param {*} e
 */
export function start(e) {
    e.preventDefault();

    const elem = document.getElementById('profile_select');
    if (!elem)
        toasts.info('You must create a profile before starting a server.');
    else {
        const fields = { profile: elem.value };

        server.start(fields);
    }
}

/**
 *
 * @param {*} e
 */
export function stop(e) {
    e.preventDefault();

    const elem = document.getElementById('profile_select');

    if (!elem)
        toasts.info('You must create a profile before stopping a server.');
    else
        server.stop();
}

/**
 *
 * @param {*} e
 */
export function restart(e) {
    e.preventDefault();

    const elem = document.getElementById('profile_select');
    if (!elem)
        toasts.info('You must create a profile before starting a server.');
    else {
        const fields = { profile: elem.value };

        server.restart(fields);
    }
}

/**
 *
 * @param {*} e
 */
export function ping(e) {
    e.preventDefault();
    server.sendCommand('Test');
}

/**
 *
 * @param {*} e
 */
export function terminate(e) {
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
}