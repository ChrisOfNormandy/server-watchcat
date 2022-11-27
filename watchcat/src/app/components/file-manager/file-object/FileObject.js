import React from 'react';
import ReactTooltip from 'react-tooltip';
import { sendForm } from '../../../helpers/net-handler';
import toasts from '../../../helpers/toasts';
import modalManager from '../../../views/ModalManager';
import jsonEditor from '../editors/json';
import propertiesEditor from '../editors/properties';
import tomlEditor from '../editors/toml';
import { downloadFile } from '../helpers';

import './styles/file-object.scss';

/**
 *
 * @param {string} name
 * @returns
 */
function extname(name) {
    return name.split(/\./g).slice(-1).toString().toLowerCase();
}

const downloadAsText = new RegExp(
    [
        'json',
        'txt',
        'toml',
        'conf',
        'cfg',
        'properties',
        'log',
        'png',
        'jpg',
        'jpeg'
    ]
        .map((ext) => `(${ext})`)
        .join('|')
);

/**
 *
 * @param {*} param0
 * @returns
 */
export default function FileObject(
    {
        file,
        path,
        ext,
        getFile,
        deleteFile,
        renameFile,
        setFileView
    }
) {
    const id = `${file.name}_modal`;

    const filePath = path === ''
        ? file.name
        : path + '*' + file.name;

    const getBody = (fileData) => {
        if (fileData !== null) {
            if (fileData.text !== undefined) {
                const submit = (e) => {
                    e.preventDefault();

                    const fields = Object.fromEntries(new FormData(e.target));

                    const uploadPath = path === ''
                        ? 'home'
                        : path;

                    sendForm(`/upload/${uploadPath}`, new File([fields.content], file.name, { type: fileData.file.type }))
                        .then((response) => response.text())
                        .then(() => {
                            toasts.success(`Uploaded ${file.name}.`);
                        })
                        .catch((err) => console.error(err));
                };

                return <form
                    className='file-editor'
                    onSubmit={submit}
                >
                    <textarea
                        name='content'
                        defaultValue={fileData.text}
                    />

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
                </form>;
            }
            else if (fileData.src !== undefined) {
                return <div
                    className='img-preview-wrapper'
                >
                    <img
                        src={fileData.src}
                        className='img-preview'
                        draggable={false}
                    />
                </div>;
            }
            else if (fileData.rawText !== undefined) {
                const ext = fileData.editor;

                const onSave = (data) => {
                    const uploadPath = path === ''
                        ? 'home'
                        : path;

                    sendForm(`/upload/${uploadPath}`, new File([data], file.name, { type: fileData.file.type }))
                        .then((response) => response.text())
                        .then(() => {
                            toasts.success(`Uploaded ${file.name}.`);
                        })
                        .catch((err) => console.error(err));
                };

                switch (ext) {
                    case '.properties': return propertiesEditor(fileData.rawText, onSave);
                    case '.toml': return tomlEditor(fileData.rawText, onSave);
                    case '.json': return jsonEditor(fileData.rawText, onSave);
                    default: return null;
                }
            }
        }

        return null;
    };

    const getModal = (fileData) => {
        const rename = (e) => {
            e.preventDefault();
            const fields = Object.fromEntries(new FormData(e.target));

            const body = {
                filename: path.replace(/\*/, '/') + '/' + fields.filename
            };

            renameFile(path + '*' + file.name, body);
        };

        const download = (e) => {
            e.preventDefault();

            if (fileData.file)
                downloadFile(new File([fileData.file], fileData.name));
            else {
                getFile(file.name)
                    .then((fd) => downloadFile(new File([fd.file], fd.name)))
                    .catch((err) => {
                        console.error(err);
                    });
            }
        };

        const renameSect = <form
            onSubmit={rename}
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

        const footer = <div
            className='file-viewer-footer'
        >
            <button
                className='btn primary'
                onClick={download}
            >
                Download
            </button>

            <button
                type='button'
                className='btn primary'
                onClick={
                    () => {
                        deleteFile(filePath);
                        modalManager.close(file.name + '_modal');
                    }
                }
            >
                <i
                    className='icon bi bi-trash'
                />
            </button>
        </div>;

        const body = <>
            {renameSect}
            {getBody(fileData)}
            {footer}
        </>;

        setFileView(body);

        // modalManager.create(file + '_modal', null)
        //     .setTitle(file)
        //     .addSection(
        //         renameSect,
        //         getBody(fileData)
        //     )
        //     .setFooter(footer)
        //     .build();
    };

    const drag = (e) => {
        document.getElementById('ftp_trash').classList.remove('hidden');
        e.dataTransfer.setData('text', JSON.stringify({ file: path.replace(/\*/g, '/') + '/' + file.name }));
    };

    const dragEnd = () => {
        document.getElementById('ftp_trash').classList.add('hidden');
    };

    const openFile = () => {
        if (downloadAsText.test(extname(file.name)) && file.size < 10 * 1024 * 1024)
            getFile(file.name)
                .then((fileData) => getModal(fileData))
                .catch((err) => console.error(err));
        else
            getModal({ name: file.name });
    };

    const getSize = () => {
        const sizes = ['b', 'kb', 'mb', 'gb', 'tb'];

        let v = file.size;
        let i = 0;
        while (v > 1024 && i < sizes.length) {
            v /= 1024;
            i++;
        }

        return i > 0
            ? `${v.toFixed(2)} ${sizes[i]}`
            : `${v} ${sizes[i]}`;
    };

    return <>
        <div
            className='file'
            data-tip={`Click to view as ${ext}`}
            data-for={`${id}_tooltip`}
            onClick={openFile}
            draggable
            onDragStart={drag}
            onDragEnd={dragEnd}
        >
            <span
                className='file-name'
            >
                {file.name}
            </span>

            <span
                className='file-desc'
            >
                {getSize()}
            </span>
        </div>

        <ReactTooltip
            id={`${id}_tooltip`}
            delayShow={500}
            place='left'
        />
    </>;
}