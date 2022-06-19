import React from 'react';
import FileManger from '../components/file-manager/FileManager';
import socketHandler from './socketHandler';

import './styles/ftp-view.css';

/**
 *
 * @returns
 */
export default function FTPView() {
    const onFTPUpdate = () => {
        document.getElementById('refresh_file_list').click();
    };

    socketHandler.addListener('ftpupdate', onFTPUpdate);

    return <div
        className='ftp-view'
    >
        <FileManger />
    </div>;
}