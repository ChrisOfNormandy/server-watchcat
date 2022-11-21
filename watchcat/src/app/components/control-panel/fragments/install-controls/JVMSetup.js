import React from 'react';
import InputRow from '../../../fragments/InputRow';

/**
 *
 * @returns
 */
export default function JVMSetup() {
    return <details>
        <summary
            className='modal-section-title'
        >
            {'Java Settings'}
        </summary>

        <InputRow
            label='Memory'
            name='server_profile_jvm_memory'
            value={6}
            hint={'Value in gigabytes (G)'}
            min={1}
            required
        />
    </details>;
}