import React from 'react';
import InputRow from '../../../fragments/InputRow';

/**
 *
 * @returns
 */
export default function ProfileSetup() {
    return <div>
        <h4>
            Profile Settings
        </h4>

        <InputRow
            label='Profile Name'
            name='server_profile_name'
            value='Forge 1.18.2'
            required
        />

        <InputRow
            label='Jar File Name'
            name='server_profile_jar_name'
            value='forge.jar'
            required
        />
    </div>;
}