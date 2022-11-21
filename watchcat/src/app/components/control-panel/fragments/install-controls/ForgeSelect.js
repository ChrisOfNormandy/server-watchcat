import React from 'react';
import InputRow from '../../../fragments/InputRow';

/*
    Index in array + 1 = game version
    Item in subarray = minor game version

    null = "no value"

    ex: Index 0, item 0 = 1.1
        Index 17, item 2 = 1.18.2
*/

const mcVersionList = [
    [null],
    [3, 4, 5],
    [2],
    [0, 1, 2, 3, 4, 5, 6, 7],
    [null, 1, 2],
    [1, 2, 3, 4],
    [2, 10, '10_pre4'],
    [null, 8, 9],
    [null, 4],
    [null, 2],
    [null, 2],
    [null, 1, 2],
    [2],
    [2, 3, 4],
    [null, 1, 2],
    [1, 2, 3, 4, 5],
    [1],
    [null, 1, 2]
];

/**
 *
 * @returns
 *
 */
export default function ForgeSelect() {
    const list = [];

    mcVersionList.forEach((l, i) => {
        const version = `1.${i + 1}`;
        l.forEach((v) => {
            if (v !== null)
                list.push(version + `.${v}`);
            else
                list.push(version);
        });
    });

    return <div>
        <h4>
            Version Settings
        </h4>

        <InputRow
            label='Minecraft Version'
            name='version_minecraft'
            value={list.reverse()}
            required
        />

        <InputRow
            label='Forge Version'
            name='version_forge'
            placeholder='ex: 40.1.0'
            required
        />

        <a
            href='https://files.minecraftforge.net/net/minecraftforge/forge/'
        >
            Forge
        </a>
    </div>;
}