/* eslint-disable react/prop-types */

import React from 'react';

/**
 *
 * @param {*} param0
 * @returns
 */
export default function InputRow({ label, value, readOnly, defaultIndex, hint }) {

    if (!label && !value)
        return null;

    const Input = () => {
        if (typeof value === 'boolean' || value === 'true' || value === 'false')
            return (
                <>
                    <input
                        type='checkbox'
                        name='%IGNORE%'
                        className='input'
                        defaultChecked={value === 'true' || value === true}
                        readOnly={readOnly}
                        onChange={
                            (e) => {
                                document.getElementById('field_' + label).value = e.checked;
                            }
                        }
                    />
                    <input
                        type='hidden'
                        name={label}
                        id={'field_' + label}
                        value={
                            value === 'true' || typeof value === 'boolean' && value
                                ? 'true'
                                : 'false'
                        }
                    />
                </>
            );

        if (typeof value === 'number' || !isNaN(value) && value !== '')
            return (
                <input
                    type='number'
                    name={label}
                    className='input'
                    defaultValue={value}
                    readOnly={readOnly}
                />
            );

        if (/^(#|(\/\/))\s*(.*)$/.test(value))
            return null;

        const str = value.split(';');
        if (str.length > 1 && !readOnly)
            return (
                <select
                    name={label}
                    className='input'
                    defaultValue={str[defaultIndex]}
                >
                    {
                        str.map((s, i) =>
                            <option
                                key={i}
                                value={s}
                            >
                                {s}
                            </option>
                        )
                    }
                </select>
            );

        return (
            <input
                type='text'
                name={label}
                className='input'
                defaultValue={value}
                readOnly={readOnly}
            />
        );
    };

    return (
        <div
            className='input-row'
        >
            <label
                className='input-label'
            >
                {label}
            </label>

            <Input />

            {
                hint
                    ?
                    <i
                        className='icon bi bi-info-circle'
                        data-tip={hint}
                    />

                    : null
            }
        </div>
    );
}