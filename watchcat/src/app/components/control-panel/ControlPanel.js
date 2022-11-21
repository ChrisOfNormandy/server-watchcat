import React from 'react';
import InstallControls from './fragments/install-controls/InstallControls';
import ServerControls from './fragments/ServerControls';

import './styles/control-panel.css';

/**
 * @typedef Props
 * @property {Object.<string, *>} profiles
 * @property {function()} refresh
 *
 * @param {Props} param0
 * @returns
 */
export default function ControlPanel({ profiles, refresh }) {
    return (
        <div
            id='control_panel'
            className='control-panel container'
        >
            <ServerControls />

            <InstallControls
                profiles={profiles}
                refresh={refresh}
            />
        </div>
    );
}