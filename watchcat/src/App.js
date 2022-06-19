import React from 'react';
import ServerView from './app/views/ServerView';

import { ToastContainer } from 'react-toastify';
import { getData } from './app/helpers/net-handler';

import 'bootstrap-icons/font/bootstrap-icons.css';
import 'react-toastify/dist/ReactToastify.css';

/**
 *
 * @returns
 */
export default class App extends React.Component {

    componentDidMount() {
        getData('/feature-flags.json')
            .then((featureFlags) => {
                let state = this.state;
                state.featureFlags = featureFlags;
                this.setState(state);
            })
            .catch(console.error);
    }

    render() {
        if (window.location.pathname !== '/')
            window.location.href = window.location.origin;

        return (
            <div className='App'>
                <ServerView
                    featureFlags={this.state.featureFlags}
                />
                <ToastContainer />
            </div>
        );
    }

    constructor(props) {
        super(props);

        this.state = {
            featureFlags: null
        };
    }
}