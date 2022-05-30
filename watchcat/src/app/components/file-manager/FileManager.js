import React from 'react';
import FileObj from './FileObject';
import FolderObj from './FolderObject';
import ReactTooltip from 'react-tooltip';
import toasts from '../../helpers/toasts';

import { get, post, sendForm } from '../../helpers/net-handler';

import './styles/shared.css';
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
        const path = this.getCurrentPath();
        console.debug('Updating and moving to:', path);
        this.getFiles();
    }

    deleteFile(path) {
        console.debug('Deleting file:', path);

        post(`/files/delete/${path}`)
            .then((response) => response.text())
            .then(() => {
                toasts.success(`Deleted ${path}.`);
                this.update();
            })
            .catch((err) => console.error(err));
    }

    deleteFolder(path) {
        console.debug('Deleting folder:', path);

        post(`/files/delete-dir/${path}`)
            .then((response) => response.text())
            .then(() => {
                toasts.success(`Deleted ${path}.`);
                this.update();
            })
            .catch((err) => console.error(err));
    }

    createFolder(path) {
        console.debug('Creating folder:', path);

        post(`/files/create-dir/${path}`)
            .then((response) => response.text())
            .then(() => {
                toasts.success(`Created folder ${path}.`);
                this.update();
            })
            .catch((err) => console.error(err));
    }

    renameFile(path, body) {
        console.debug('Renaming file:', path);

        post(`/files/rename/${path}`, body)
            .then((response) => response.text())
            .then(() => {
                toasts.success(`Renamed ${path}.`);
                this.update();
            })
            .catch((err) => console.error(err));
    }

    renameFolder(path, body) {
        console.debug('Renaming folder:', path);

        post(`/files/rename-dir/${path}`, body)
            .then((response) => response.text())
            .then(() => {
                toasts.success(`Renamed ${path}.`);
                this.update();
            })
            .catch((err) => console.error(err));
    }

    getFile(path) {
        console.debug('Getting file:', path);

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

    // Run on clicking "Refresh"
    getFiles(path = '') {
        console.debug('Getting files:', path);

        const curPath = this.getCurrentPath().replace(/\//g, '*');

        let p = '';

        if (path === '' && curPath) {
            p = curPath;
        }
        else if (path === '') {
            p = 'home';
        }
        else {
            p = curPath
                ? `${curPath}*${path}`
                : path;
        }

        console.debug('Getting -->', p);

        get(`/files/${p} `)
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

            const len = e.dataTransfer.files.length;
            let i = 0;

            const updateNotif = (file) => {
                toasts.success(`Uploaded: ${file.name}.`);
            };

            const onUpload = (file) => {
                updateNotif(file);
            };

            // Upload files to server
            while (i < len) {
                const file = e.dataTransfer.files[i];

                sendForm(`/upload/${path}`, file)
                    .then(() => onUpload(file))
                    .catch((err) => {
                        console.error(err);
                        toasts.error(`Failed to upload ${file.name}.`);
                    });

                i++;
            }
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
                                                renameFile={this.renameFile}
                                                openModal={this.openModal}
                                                closeModal={this.closeModal}
                                            />
                                            : <FileObj
                                                file={file}
                                                path={this.getCurrentPath()}
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
                            <span>
                                Empty
                            </span>
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

        const newFolder = () => {
            let name = prompt('Folder name');

            if (name) {
                const p = this.getCurrentPath().replace(/\//g, '*');
                let path = p
                    ? p + '*' + name
                    : name;

                console.debug('Creating folder:', path);

                this.createFolder(path);
            }
        };

        const NewFolderBtn = () => {
            return (
                <button
                    className='btn primary'
                    onClick={newFolder}
                >
                    <i
                        className='icon bi bi-folder-plus'
                    />
                </button>
            );
        };

        const Breadcrumb = () => {
            const navArr = this.getCurrentPath().split('*');
            const cur = navArr.slice(-1);
            const breadcrumb = navArr.slice(0, -1).join('/');

            const onDragOver = (e) => {
                e.preventDefault();
            };

            const drop = (e) => {
                e.preventDefault();

                const fileData = JSON.parse(e.dataTransfer.getData('text/plain'));

                const body = {
                    filename: this.getCurrentPath().split('*').slice(0, -1).join('/') + '/' + fileData.file.split('/').slice(-1)
                };

                this.renameFile(fileData.file.replace(/\//g, '*'), body);

                return false;
            };

            return list.parent !== null
                ? <div
                    className='file-manager-breadcrumb'
                    onDragOver={onDragOver}
                    onDrop={drop}
                >
                    <button
                        className='btn primary'
                        data-tip={`Up to "${breadcrumb || 'home'}"`}
                        data-for='breadcrumb_tooltip'
                        onClick={
                            () => {
                                let state = this.state;
                                state.currentDir = list.parent;

                                if (list.parent)
                                    state.parentDir = this.state.files.get(list.parent).parent;

                                this.setState(state, this.getFiles);
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

                    <ReactTooltip
                        id='breadcrumb_tooltip'
                        delayShow={500}
                        place='left'
                    />
                </div>
                : <span>
                    Home
                </span>;
        };

        const dragOver = (e) => {
            e.preventDefault();

            return false;
        };

        const drop = (e) => {
            e.preventDefault();

            const fileData = JSON.parse(e.dataTransfer.getData('text/plain'));
            console.log(fileData);

            console.log(e.target);

            if (fileData.dir)
                this.deleteFolder(fileData.file.replace(/\//g, '*'));
            else
                this.deleteFile(fileData.file.replace(/\//g, '*'));

            document.getElementById('ftp_trash').classList.add('hidden');

            return false;
        };

        return this.state.files.has(this.state.currentDir)
            ? <div
                className='container'
            >
                <div
                    className='file-manager-header'
                >
                    <Breadcrumb />
                </div>

                {this.listDir(list)}

                <div
                    className='file-manager-footer'
                >
                    <NewFolderBtn />

                    <div
                        id='ftp_trash'
                        className='ftp-trash hidden'
                        onDragOver={dragOver}
                        onDrop={drop}
                    >
                        <i
                            className='icon bi bi-trash'
                        />
                    </div>

                    <button
                        id='refresh_file_list'
                        className='btn primary'
                        onClick={() => this.getFiles()}
                    >
                        Refresh
                    </button>
                </div>
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