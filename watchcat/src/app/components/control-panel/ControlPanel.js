import React from 'react';
import InstallControls from './fragments/install-controls/InstallControls';
import ServerControls from './fragments/ServerControls';

import './styles/control-panel.css';

/**
 * @typedef Props
 * @property {function()} openModal
 * @property {function()} closeModal
 * @property {function()} connect
 * @property {Object.<string, *>} featureFlags
 * @property {Object.<string, *>} profiles
 * @property {function()} refresh
 *
 * @param {Props} param0
 * @returns
 */
export default function ControlPanel({ openModal, closeModal, connect, featureFlags, profiles, refresh }) {
    if (featureFlags === null) {
        console.error('Failed to fetch feature flags.');

        return null;
    }

    return (
        <div
            id='control_panel'
            className='control-panel container'
        >
            <ServerControls
                featureFlags={featureFlags}
                connect={connect}
            />

            <InstallControls
                connect={connect}
                profiles={profiles}
                openModal={openModal}
                closeModal={closeModal}
                refresh={refresh}
            />
        </div>
    );
}