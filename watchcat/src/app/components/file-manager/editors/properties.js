import React from 'react';
import ReactTooltip from 'react-tooltip';
import InputRow from '../../fragments/InputRow';

/**
 *
 * @param {*} data
 * @returns
 */
export default function propertiesEditor(data, onSave) {
    const lines = data.split(/\n/g);

    const presets = {
        difficulty: 'easy;normal;hard',
        gamemode: 'survival;creative'
    };

    return (
        <form
            className='editor-container'
            onSubmit={
                (e) => {
                    e.preventDefault();

                    const fields = Object.fromEntries(new FormData(e.target));
                    console.log(fields);

                    let str = '';
                    for (let f in fields) {
                        const line = fields[f];
                        if (!isNaN(f) && f !== '') {
                            str += `${line}\n`;
                            continue;
                        }

                        if (/%(.+)%/.test(f))
                            continue;

                        str += `${f}=${line}\n`;
                    }

                    onSave(str);
                }
            }
        >
            {
                lines.map((line, i) => {
                    const v = line.split('=');

                    if (v.length > 1)
                        return (
                            <InputRow
                                key={i}
                                label={v[0]}
                                value={presets[v[0]] || v[1]}
                                hint={line}
                            />
                        );

                    return line
                        ? <div
                            key={i}
                            className='input-row'
                        >
                            <input
                                name={i}
                                className='input'
                                value={line}
                                readOnly
                            />
                        </div>
                        : null;
                })
            }

            <div
                className='input-row'
            >
                <button
                    type='submit'
                    className='btn primary'
                >
                    Save
                </button>
            </div>

            <ReactTooltip />
        </form>
    );
}