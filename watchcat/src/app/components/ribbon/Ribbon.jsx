import React from 'react';

import './styles/ribbon.scss';

/**
 *
 * @param {*} param0
 * @returns
 */
function RibbonMenu(
    {
        label,
        onClick,
        setFocus,
        hasFocus,
        content,
        onClose,
        ...props
    }
) {
    if (content)
        return (
            <>
                <li
                    className='menu-item'
                >
                    <button
                        className='btn menu-btn'
                        onClick={setFocus}
                    >
                        {label}
                    </button>

                    {
                        hasFocus &&
                        <ul
                            className='menu'
                        >
                            {
                                content.map((c, i) =>
                                    <RibbonMenu
                                        key={i}
                                        {...c}
                                        onClose={onClose}
                                    />
                                )
                            }
                        </ul>
                    }
                </li>
            </>
        );

    return (
        <li
            className='menu-item'
        >
            <button
                {...props}
                className='btn menu-btn'
                onClick={
                    () => {
                        onClick();
                        onClose();
                    }
                }
            >
                {label}
            </button>
        </li>
    );
}

export default class Ribbon extends React.Component {
    render() {
        return (
            <ul
                className='ribbon'
            >
                {
                    this.content().map((c, i) =>
                        <RibbonMenu
                            key={i}
                            {...c}
                            setFocus={
                                () => this.state.focus === i
                                    ? this.setState({ focus: null })
                                    : this.setState({ focus: i })
                            }
                            hasFocus={this.state.focus === i}
                            onClose={
                                () => this.setState({ focus: null })
                            }
                        />
                    )
                }
            </ul>
        );
    }

    constructor(props) {
        super(props);

        this.content = props.content;

        this.state = {
            focus: null,
        };
    }
}