import React from 'react';
import Modal from '../../modals/Modal';
import ReactTooltip from 'react-tooltip';
import toasts from '../../../helpers/toasts';
import InputRow from '../../fragments/InputRow';

import { get, post, sendForm } from '../../../helpers/net-handler';

import './styles/file-manager.css';

const cannotEdit = /(\.dat)/;

/**
 *
 * @param {*} blob
 * @returns
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(blob);
    });
}

/**
 *
 * @param {*} file
 */
function downloadFile(file) {
    const a = document.createElement('a');
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 *
 * @param {*} data
 * @returns
 */
function propertiesEditor(data) {
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

                        if (/%(\w+)%/.test(f))
                            continue;

                        str += `${f}=${line}\n`;
                    }

                    console.log(str);
                }
            }
        >
            <button
                type='submit'
            >
                Save
            </button>
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
                        ?
                        <div
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

            <ReactTooltip />
        </form>
    );
}

/**
 *
 * @param {*} data
 * @returns
 */
function tomlEditor(data) {
    const lines = data.split(/\n/g);

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

                        if (/%(\w+)%/.test(f))
                            continue;

                        str += `${f}=${line}\n`;
                    }

                    console.log(str);
                }
            }
        >
            <button
                type='submit'
            >
                Save
            </button>
            {
                lines.map((line, i) => {
                    const v = line.split('=');

                    if (v.length > 1)
                        return (
                            <InputRow
                                key={i}
                                label={v[0]}
                                value={v[1]}
                                hint={line}
                            />
                        );

                    const m = line.match(/\[(.+)\]/);
                    if (m)
                        return (
                            <h3
                                key={i}
                            >
                                {m[1]}
                            </h3>
                        );

                    return line
                        ?
                        <div
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

            <ReactTooltip />
        </form>
    );
}

/**
 *
 * @param {*} param0
 * @returns
 */
function FileObj(
    {
        file,
        path,
        ext,
        getFile,
        deleteFile,
        renameFile,
        openModal,
        closeModal }
) {
    const id = `${file}_modal`;

    const getModal = (fileData) => {
        let modalBody = null;

        if (fileData !== null) {
            if (fileData.text !== undefined) {
                modalBody = <form
                    onSubmit={
                        (e) => {
                            e.preventDefault();

                            const fields = Object.fromEntries(new FormData(e.target));

                            sendForm(`/upload/${path}`, new File([fields.content], file, { type: fileData.file.type }))
                                .then((response) => response.text())
                                .then(() => {
                                    toasts.success(`Uploaded ${file}.`);
                                })
                                .catch((err) => console.error(err));
                        }
                    }
                >
                    <textarea
                        name='content'
                        defaultValue={fileData.text}
                    />
                    <button
                        type='submit'
                    >
                        Save
                    </button>
                </form>;
            }
            else if (fileData.src !== undefined) {
                modalBody =
                    <img src={fileData.src} />
                    ;
            }
            else if (fileData.rawText !== undefined) {
                const ext = fileData.editor;

                switch (ext) {
                    case '.properties': {
                        modalBody = propertiesEditor(fileData.rawText);
                        break;
                    }
                    case '.toml': {
                        modalBody = tomlEditor(fileData.rawText);
                        break;
                    }
                    default: {
                        modalBody =
                            <div>{ext}</div>
                            ;
                        break;
                    }
                }
            }
        }

        const modal = <Modal
            id={id}
            title={file}
            onClose={closeModal}
        >
            <div>
                <form
                    onSubmit={
                        (e) => {
                            e.preventDefault();
                            const fields = Object.fromEntries(new FormData(e.target));
                            renameFile(file, fields);
                        }
                    }
                >
                    <input
                        name='filename'
                        type='text'
                        defaultValue={file}
                    />
                    <button
                        type='submit'
                    >
                        Rename
                    </button>
                </form>

                <button
                    onClick={
                        (e) => {
                            e.preventDefault();
                            downloadFile(new File([fileData.file], fileData.name));
                        }
                    }
                >
                    Download
                </button>

                <button
                    type='button'
                    className='btn primary'
                    onClick={
                        () => {
                            deleteFile(file);
                            closeModal(id);
                        }
                    }
                >
                    <i
                        className='icon bi bi-trash'
                    />
                </button>

                <div>
                    {modalBody}
                </div>
            </div>
        </Modal>;

        openModal(file + '_modal', modal);
    };

    return (
        <>
            <span
                className='file-name file'
                data-tip={`Click to view as ${ext}`}
                data-for={`${id}_tooltip`}
                onClick={
                    () => {
                        getFile(file)
                            .then((fileData) => getModal(fileData))
                            .catch((err) => console.error(err));
                    }
                }
            >
                {file}
            </span>

            <ReactTooltip
                id={`${id}_tooltip`}
                delayShow={500}
                place='left'
            />
        </>
    );
}

/**
 *
 * @param {*} param0
 * @returns
 */
function FolderObj(
    {
        file,
        path,
        getFiles,
        updateParentDir,
        deleteFolder,
        renameFolder,
        openModal,
        closeModal
    }
) {
    const id = `${file}_modal`;

    const downloadAsZip = () => {
        console.log('Download:', path, file);

        const dirPath = path === ''
            ? file
            : path + '*' + file;

        post(`/files/zip/${dirPath}`)
            .then((response) => response.blob())
            .then((blob) => downloadFile(new File([blob], file + '.zip')))
            .catch((err) => console.error(err));
    };

    const modal = <Modal
        id={id}
        title={file}
        onClose={() => closeModal(id)}
    >
        <div>
            <form
                onSubmit={
                    (e) => {
                        e.preventDefault();
                        const fields = Object.fromEntries(new FormData(e.target));
                        renameFolder(file, fields);
                    }
                }
            >
                <input
                    name='filename'
                    type='text'
                    defaultValue={file}
                />

                <button
                    type='submit'
                >
                    Rename
                </button>

                <button
                    type='button'
                    onClick={downloadAsZip}
                >
                    Download as Zip
                </button>

                <button
                    type='button'
                    className='btn primary'
                    onClick={
                        () => {
                            deleteFolder(file);
                            closeModal(id);
                        }
                    }
                >
                    <i
                        className='icon bi bi-trash'
                    />
                </button>
            </form>
        </div>
    </Modal>;

    return (
        <>
            <span
                className='file-name folder'
                data-tip='Click to expand'
                data-for={`${id}_tooltip`}
                onClick={
                    () => {
                        updateParentDir();
                        getFiles(file);
                    }
                }
            >
                {file}
            </span>

            <span
                className='file-row-controls'
            >
                <button
                    className='btn primary'
                    onClick={() => openModal(id, modal)}
                    data-tip='Options'
                    data-for={`${id}_tooltip`}
                >
                    <i className='icon bi bi-three-dots' />
                </button>
            </span>

            <ReactTooltip
                id={`${id}_tooltip`}
                delayShow={500}
                place='left'
            />
        </>
    );
}

const editorFileTypes = [
    '.properties'
];

/**
 *
 * @param {*} file
 * @returns
 */
function getExtention(file) {
    const m = file.match(/(\.\w+)/g);

    return m === null
        ? null
        : m[m.length - 1];
}

export default class FileManger extends React.Component {
    updateParentDir() {
        let state = this.state;
        state.parentDir = state.currentDir;
        this.setState(state);
    }

    update() {
        const path = this.getCurrentPath().slice('*').slice(-1);
        this.getFiles(path);
    }

    deleteFile(path) {
        post(`/files/delete/${path}`)
            .then((response) => response.text())
            .then(() => {
                toasts.success(`Deleted ${path}.`);
                this.update();
            })
            .catch((err) => console.error(err));
    }

    deleteFolder(path) {
        post(`/files/delete-dir/${path}`)
            .then((response) => response.text())
            .then(() => {
                toasts.success(`Deleted ${path}.`);
                this.update();
            })
            .catch((err) => console.error(err));
    }

    createFolder(path) {
        post(`/files/create-dir/${path}`)
            .then((response) => response.text())
            .then(() => {
                toasts.success(`Created folder ${path}.`);
                this.update();
            })
            .catch((err) => console.error(err));
    }

    renameFile(path, body) {
        post(`/files/rename/${path}`, body)
            .then((response) => response.text())
            .then(() => {
                toasts.success(`Renamed ${path}.`);
                this.update();
            })
            .catch((err) => console.error(err));
    }

    renameFolder(path, body) {
        post(`/files/rename-dir/${path}`, body)
            .then((response) => response.text())
            .then(() => {
                toasts.success(`Renamed ${path}.`);
                this.update();
            })
            .catch((err) => console.error(err));
    }

    getFile(path) {
        const curPath = this.getCurrentPath().replace(/\//g, '*');

        const p = curPath
            ? `${curPath}*${path}`
            : path;

        return new Promise((resolve, reject) => {
            post(`/files/get/${p || 'home'}`)
                .then((response) => response.blob())
                .then((file) => {
                    let state = this.state;
                    const arr = p.split('*');
                    let data = { file, name: arr[arr.length - 1] };
                    const ext = getExtention(p);

                    if (file.type.match(/image\/\w+/)) {
                        blobToBase64(file)
                            .then((src) => {
                                data.src = src;
                                state.fileData = data;
                                this.setState(state);

                                resolve(data);
                            })
                            .catch((err) => reject(err));
                    }
                    else if (file.type.match(/application\/\w+/) && !cannotEdit.test(ext)) {
                        file.text()
                            .then((text) => {
                                data.rawText = text;
                                data.editor = ext;
                                state.fileData = data;
                                this.setState(state);

                                resolve(data);
                            })
                            .catch((err) => reject(err));
                    }
                    else if (file.type.match(/text\/\w+/) && !cannotEdit.test(ext)) {
                        file.text()
                            .then((text) => {
                                data.text = text;
                                state.fileData = data;
                                this.setState(state);

                                resolve(data);
                            })
                            .catch((err) => reject(err));
                    }
                    else if (editorFileTypes.includes(ext)) {
                        file.text()
                            .then((text) => {
                                data.rawText = text;
                                data.editor = ext;
                                state.fileData = data;
                                this.setState(state);

                                resolve(data);
                            })
                            .catch((err) => reject(err));
                    }
                    else {
                        state.fileData = data;
                        this.setState(state);

                        resolve(data);
                    }
                })
                .catch((err) => reject(err));
        });
    }

    getFiles(path) {
        const curPath = this.getCurrentPath().replace(/\//g, '*');

        const p = curPath
            ? `${curPath}*${path}`
            : path;

        get(`/files/${p || 'home'}`)
            .then((response) => response.json())
            .then((list) => {
                const folders = [],
                    files = [];

                if (Array.isArray(list)) {
                    list.forEach((file) => {
                        if (file.match(/(\.\w+)/g))
                            files.push(file);
                        else
                            folders.push(file);
                    });
                }

                let state = this.state;

                state.files.set(p, { path: p, files: [].concat(folders).concat(files), parent: state.parentDir });
                state.currentDir = p;

                this.setState(state);
            })
            .catch((err) => console.error(err));
    }

    getCurrentPath() {
        if (this.state.currentDir === null || this.state.currentDir === 'home')
            return '';

        return this.state.files.get(this.state.currentDir).path;
    }

    listDir(list) {
        const onDrop = (e) => {
            e.preventDefault();

            let path = this.getCurrentPath();
            if (!path)
                path = 'home';

            const file = e.dataTransfer.files[0];

            sendForm(`/upload/${path}`, file)
                .then((response) => response.text())
                .then(() => {
                    toasts.success(`Uploaded ${file.name}.`);
                    this.update();
                })
                .catch((err) => console.error(err));
        };

        const onDragOver = (e) => {
            e.preventDefault();
        };

        let path = this.getCurrentPath();
        if (!path)
            path = 'home';

        return (
            <ul
                className='file-list'
                onDrop={onDrop}
                onDragOver={onDragOver}
            >
                {
                    list.files.length
                        ? list.files.map((file, f) => {
                            const ext = getExtention(file);

                            return (
                                <li
                                    key={f}
                                    className='file-row'
                                >
                                    {
                                        ext === null
                                            ? <FolderObj
                                                file={file}
                                                path={this.getCurrentPath()}
                                                getFiles={this.getFiles}
                                                updateParentDir={this.updateParentDir}
                                                deleteFolder={this.deleteFolder}
                                                renameFolder={this.renameFolder}
                                                openModal={this.openModal}
                                                closeModal={this.closeModal}
                                            />
                                            : <FileObj
                                                file={file}
                                                path={path}
                                                ext={ext}
                                                getFile={this.getFile}
                                                deleteFile={this.deleteFile}
                                                renameFile={this.renameFile}
                                                openModal={this.openModal}
                                                closeModal={this.closeModal}
                                            />
                                    }
                                </li>
                            );
                        })
                        : <div
                            className='empty-file-list'
                        >
                            <div>
                                Empty
                            </div>
                        </div>
                }
            </ul>
        );
    }

    componentDidMount() {
        this.getFiles('home');
    }

    render() {
        if (this.state.currentDir === null) {
            console.debug('No current dir.');

            return null;
        }

        const list = this.state.files.get(this.state.currentDir);

        const NewFolderBtn = () => {
            return (
                <button
                    className='btn primary'
                    onClick={
                        () => {
                            let name = prompt('Folder name');

                            if (name) {
                                const p = this.getCurrentPath();
                                let path = p
                                    ? p + '/' + name
                                    : name;

                                this.createFolder(path);
                            }
                        }
                    }
                >
                    <i className='icon bi bi-folder-plus' />
                </button>
            );
        };

        const Breadcrumb = () => {
            const navArr = this.getCurrentPath().split('*');
            const cur = navArr.shift();
            const breadcrumb = navArr.join('/');

            return list.parent !== null
                ? <div
                    className='file-manager-breadcrumb'
                >
                    <button
                        className='btn primary'
                        onClick={
                            () => {
                                let state = this.state;
                                state.currentDir = list.parent;

                                if (list.parent)
                                    state.parentDir = this.state.files.get(list.parent).parent;

                                this.setState(state);
                            }
                        }
                    >
                        ../{breadcrumb}
                    </button>

                    <span
                        className='breadcrumb'
                    >
                        <span>Currently browsing: </span>
                        <b>{cur}</b>
                    </span>
                </div>
                : <span>
                    Home
                </span>;
        };

        return this.state.files.has(this.state.currentDir)
            ? <div
                className='file-manager-container'
            >
                <div
                    className='file-manager-header'
                >
                    <Breadcrumb />
                    <NewFolderBtn />

                    <button
                        onClick={
                            () => {
                                this.getFiles('home');
                            }
                        }
                    >
                        Refresh
                    </button>
                </div>

                {this.listDir(list)}
            </div>
            : null;
    }

    constructor(props) {
        super(props);

        this.openModal = props.openModal;
        this.closeModal = props.closeModal;

        this.state = {
            parentDir: null,
            currentDir: null,
            files: new Map(),
            fileData: null
        };

        this.update = this.update.bind(this);
        this.getFile = this.getFile.bind(this);
        this.getFiles = this.getFiles.bind(this);
        this.deleteFile = this.deleteFile.bind(this);
        this.deleteFolder = this.deleteFolder.bind(this);
        this.updateParentDir = this.updateParentDir.bind(this);

        this.renameFile = this.renameFile.bind(this);
        this.renameFolder = this.renameFolder.bind(this);
    }
}