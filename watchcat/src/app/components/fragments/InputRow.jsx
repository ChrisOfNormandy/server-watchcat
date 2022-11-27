import React from 'react';
import ReactTooltip from 'react-tooltip';

/**
 *
 * @param {*} param0
 * @returns
 */
function Input({ value, readOnly, name, defaultIndex = 0, ...props }) {
    if (Array.isArray(value)) {
        if (readOnly)
            return <input
                type='text'
                name={name}
                id={'field_' + name}
                className='input'
                value={value[defaultIndex]}
                readOnly
                {...props}
            />;

        return <select
            name={name}
            id={'field_' + name}
            className='input'
            defaultValue={value[defaultIndex]}
            {...props}
        >
            {
                value.map((v, i) =>
                    <option
                        key={i}
                        value={v}
                    >
                        {v}
                    </option>
                )
            }
        </select>;
    }

    if (typeof value === 'boolean' || value === 'true' || value === 'false')
        return (
            <>
                <input
                    type='checkbox'
                    name={`%IGNORE=${name}%`}
                    className='input'
                    defaultChecked={value === 'true' || value === true}
                    readOnly={readOnly}
                    onChange={
                        (e) => {
                            document.getElementById('field_' + name).value = e.target.checked;
                        }
                    }
                    {...props}
                />
                <input
                    type='hidden'
                    name={name}
                    id={'field_' + name}
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
                name={name}
                id={'field_' + name}
                className='input'
                defaultValue={value}
                readOnly={readOnly}
                {...props}
            />
        );

    if (/^(#|(\/\/))\s*(.*)$/.test(value))
        return null;

    if (typeof value === 'string') {
        const str = value.split(';');

        if (str.length > 1 && !readOnly)
            return (
                <select
                    name={name}
                    id={'field_' + name}
                    className='input'
                    defaultValue={str[defaultIndex]}
                    {...props}
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
    }

    return (
        <input
            type='text'
            name={name}
            id={'field_' + name}
            className='input'
            defaultValue={value}
            readOnly={readOnly}
            {...props}
        />
    );
}

/**
 *
 * @param {*} param0
 * @returns
 */
export default function InputRow(
    {
        label,
        name,
        value,
        readOnly,
        defaultIndex,
        hint,
        ...props
    }
) {
    if (!label && !value)
        return null;

    const input_name = (name || label).replace(/\s/g, '_');

    return (
        <div
            className='input-row'
        >
            <label
                className='input-label'
            >
                {label}
            </label>

            {
                hint
                    ? <i
                        className='icon bi bi-info-circle'
                        data-for={input_name + '_tip'}
                        data-tip={hint}
                    />
                    : null
            }

            <Input
                value={value}
                readOnly={readOnly}
                label={label}
                name={input_name}
                defaultIndex={defaultIndex}
                {...props}
            />

            <ReactTooltip
                id={input_name + '_tip'}
                delayShow={500}
            />
        </div>
    );
}