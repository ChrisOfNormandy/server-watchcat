import React from 'react';
import ServerView from './app/views/ServerView';

import { ToastContainer } from 'react-toastify';

import 'bootstrap-icons/font/bootstrap-icons.css';
import 'react-toastify/dist/ReactToastify.css';

/**
 *
 * @returns
 */
function App() {
    if (window.location.pathname !== '/')
        window.location.href = window.location.origin;

    return (
        <div className='App'>
            <ServerView />
            <ToastContainer />
        </div>
    );
}

export default App;
