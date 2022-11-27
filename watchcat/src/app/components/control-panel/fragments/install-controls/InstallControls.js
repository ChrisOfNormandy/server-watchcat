import React from 'react';
import JVMSetup from './JVMSetup';
import ForgeSelect from './ForgeSelect';
import ProfileSetup from './ProfileSetup';
import modalManager from '../../../../views/ModalManager';

import { post } from '../../../../helpers/net-handler';

import * as adapter from '../../adapter';

import './styles/install-controls.scss';
import ReactTooltip from 'react-tooltip';

const server = adapter.default.features;

/**
 * @typedef Props
 * @property {function()} connect
 * @property {Object.<string, *>} profiles
 * @property {function()} refresh
 *
 * @param {Props} param0
 * @returns
 */
export default function InstallControls({ connect, profiles, refresh }) {
    const install = (e) => {
        e.preventDefault();
        server.install(Object.fromEntries(new FormData(e.target)), connect);
    };

    const createProfile = (e) => {
        e.preventDefault();

        post('/profiles/create', JSON.stringify(Object.fromEntries(new FormData(e.target))))
            .then((response) => response.json())
            .then((profile) => {
                console.log(profile);
                refresh();
            })
            .catch(console.error);
    };

    const deleteServerProfile = () => {
        const profile = document.getElementById('profile_select').value;

        if (profile) {
            post('/profiles/delete', JSON.stringify({ profile }))
                .then((response) => response.json())
                .then((profile) => {
                    console.log(profile);
                    refresh();
                })
                .catch(console.error);
        }
    };

    const createServerProfile = () => {
        const modal = <form
            onSubmit={createProfile}
        >
            <ProfileSetup />

            <ForgeSelect />

            <JVMSetup />

            <button
                type='submit'
                className='btn primary'
            >
                Create
            </button>
        </form>;

        modalManager
            .create('create_server_profile', modal)
            .canBeDragged()
            .build();
    };

    return (
        <>
            <form
                id='install_controls'
                className='install-controls-container container'
                onSubmit={install}
            >
                <div
                    className='input-row profile-select'
                >
                    {
                        profiles.list.length
                            ? <select
                                name='profile'
                                id='profile_select'
                                className='input select'
                            >
                                {
                                    profiles.list.map((profile, i) =>
                                        <option
                                            key={i}
                                            value={profile}
                                        >
                                            {profile}
                                        </option>
                                    )
                                }
                            </select>
                            : <input
                                className='input'
                                value='Click "Create New Profile" to begin'
                                readOnly
                            />
                    }
                </div>

                <div
                    className='input-row'
                >
                    <button
                        type='button'
                        className='btn primary'
                        onClick={createServerProfile}
                        data-tip='Create New Profile'
                        data-for='tooltip__install_controls'
                    >
                        <i
                            className='icon bi bi-plus-lg'
                        />
                    </button>

                    <button
                        type='button'
                        className='btn primary'
                        onClick={deleteServerProfile}
                        disabled={!profiles.list.length}
                        data-tip='Delete Profile'
                        data-for='tooltip__install_controls'
                    >
                        <i
                            className='icon bi bi-trash3'
                        />
                    </button>
                </div>

                <div
                    className='input-row'
                >
                    <button
                        type='submit'
                        className='btn primary'
                    >
                        Install
                    </button>
                </div>
            </form>;

            <ReactTooltip
                id='tooltip__install_controls'
            />
        </>
    );
}