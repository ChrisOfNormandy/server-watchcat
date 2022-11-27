import React from 'react';
import ReactTooltip from 'react-tooltip';
import { post } from '../../../helpers/net-handler';
import modalManager from '../../../views/ModalManager';
import { downloadFile } from '../helpers';

import './styles/folder-object.scss';

/**
 *
 * @param {*} param0
 * @returns
 */
export default function FolderObject(
    {
        file,
        path,
        getFiles,
        updateParentDir,
        deleteFolder,
        renameFile,
        renameFolder,
        setFileView
    }
) {
    const id = `${file.name}_modal`;

    const dirPath = path === ''
        ? file.name
        : path + '*' + file.name;

    const downloadAsZip = () => {
        console.log('Download:', path, file.name);

        post(`/files/zip/${dirPath}`)
            .then((response) => response.blob())
            .then((blob) => downloadFile(new File([blob], file.name + '.zip')))
            .catch((err) => console.error(err));
    };

    const getModal = () => {
        const submit = (e) => {
            e.preventDefault();

            const fields = Object.fromEntries(new FormData(e.target));

            const body = {
                filename: path.replace(/\*/, '/') + '/' + fields.filename
            };

            renameFolder(path + '*' + file.name, body);
        };

        const renameSect = <form
            onSubmit={submit}
        >
            <div
                className='input-row'
            >
                <input
                    name='filename'
                    type='text'
                    className='input'
                    defaultValue={file.name}
                />

                <button
                    type='submit'
                    className='btn primary'
                >
                    Rename
                </button>
            </div>
        </form>;

        const footer = <>
            <button
                type='button'
                className='btn primary'
                onClick={downloadAsZip}
            >
                Download as Zip
            </button>

            <button
                type='button'
                className='btn primary'
                onClick={
                    () => {
                        deleteFolder(file.name);
                        modalManager.close(file.name + '_modal');
                    }
                }
            >
                <i
                    className='icon bi bi-trash'
                />
            </button>
        </>;

        const body = <>
            {renameSect}
            {footer}
        </>;

        setFileView(body);

        // modalManager.create(file + '_modal', null)
        //     .setTitle(file)
        //     .addSection(
        //         renameSect
        //     )
        //     .setFooter(footer)
        //     .build();
    };

    const drag = (e) => {
        document.getElementById('ftp_trash').classList.remove('hidden');
        e.dataTransfer.setData('text', JSON.stringify({ file: path.replace(/\*/g, '/') + '/' + file.name, dir: true }));
    };

    const dragEnd = () => {
        document.getElementById('ftp_trash').classList.add('hidden');
    };

    const dragOver = (e) => {
        e.preventDefault();

        return false;
    };

    const drop = (e) => {
        e.preventDefault();

        const fileData = JSON.parse(e.dataTransfer.getData('text/plain'));

        const body = {
            filename: path.replace(/\*/g, '/') + '/' + file.name + '/' + fileData.file.split('/').slice(-1)
        };

        console.log(path + '*' + fileData.file, body);

        renameFile(fileData.file.replace(/\//g, '*'), body);

        document.getElementById('ftp_trash').classList.add('hidden');

        return false;
    };

    const openFolder = () => {
        updateParentDir();
        getFiles(file.name);
    };

    const editFolder = () => {
        getModal();
    };

    return <>
        <div
            className='folder'
            data-tip='Click to expand'
            data-for={`${id}_tooltip`}
            draggable
            onDragStart={drag}
            onDragEnd={dragEnd}
            onDragOver={dragOver}
            onDrop={drop}
            onClick={openFolder}
        >
            <span
                className='folder-name'
            >
                {file.name}
            </span>

            <span
                className='folder-row-controls'
            >
                <button
                    className='btn primary'
                    onClick={editFolder}
                    data-tip='Options'
                    data-for={`${id}_tooltip`}
                >
                    <i className='icon bi bi-three-dots' />
                </button>
            </span>
        </div>

        <ReactTooltip
            id={`${id}_tooltip`}
            delayShow={500}
            place='left'
        />
    </>;
}