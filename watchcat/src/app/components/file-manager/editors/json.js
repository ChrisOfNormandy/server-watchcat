import React from 'react';
import ReactTooltip from 'react-tooltip';
import InputRow from '../../fragments/InputRow';

/**
 *
 * @param {*} obj
 * @returns
 */
function buildSection(obj, path = '') {
    const sections = [];

    for (let k in obj) {
        if (typeof obj[k] === 'object') {
            const p = path
                ? path + ';.;' + k
                : k;

            sections.push(
                {
                    key: k,
                    path: p,
                    sections: buildSection(obj[k], p)
                }
            );
        }
        else {
            sections.push(
                {
                    key: k,
                    path: path
                        ? path + ';.;' + k
                        : k,
                    value: obj[k]
                }
            );
        }
    }

    return <div
        className='json-section'
    >
        {
            sections.map((sect, i) =>
                sect.sections === undefined
                    ? <InputRow
                        key={i}
                        label={sect.key}
                        name={sect.path}
                        value={sect.value}
                    />
                    : <div
                        key={i}
                    >
                        <h3>
                            {sect.key}
                        </h3>
                        {sect.sections}
                    </div>
            )
        }
    </div>;
}

/**
 *
 * @param {*} data
 * @returns
 */
export default function jsonEditor(data, onSave) {
    const json = JSON.parse(data);

    const sections = buildSection(json);

    return (
        <form
            className='editor-container'
            onSubmit={
                (e) => {
                    e.preventDefault();

                    const fields = Object.fromEntries(new FormData(e.target));
                    console.log(fields);

                    let json = {};

                    for (let f in fields) {
                        if (/%(.+)%/.test(f))
                            continue;

                        let path = f.split(';.;');

                        let pointer = json;
                        while (path.length > 1) {
                            let p = path.shift();

                            if (pointer[p] === undefined)
                                pointer[p] = {};

                            pointer = pointer[p];
                        }

                        pointer[path[0]] = fields[f];
                    }

                    console.log(json);

                    onSave(JSON.stringify(json, null, 4));
                }
            }
        >
            {sections}

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