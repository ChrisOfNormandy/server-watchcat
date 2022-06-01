import App from './App';
import React from 'react';

import { createRoot } from 'react-dom/client';

import './styles/export';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);