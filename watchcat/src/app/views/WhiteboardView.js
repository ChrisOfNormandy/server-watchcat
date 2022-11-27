/* eslint-disable no-unused-vars */
import React from 'react';
import ReactTooltip from 'react-tooltip';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { v4 } from 'uuid';

import { getData } from '../helpers/net-handler';
import socketHandler from '../helpers/socketHandler';

import './styles/whiteboard-view.scss';

/**
 *
 * @param {string} id
 * @param {*} data
 * @param {boolean} remove
 */
function emit(id, data, remove = false) {
    const emitData = {
        id,
        origin: socketHandler.socket.id,
        remove,
        data
    };

    socketHandler.emit('whiteboard', JSON.stringify(emitData));
}

const distance = (v1, v2) => {
    return Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) + (v1.y - v2.y) * (v1.y - v2.y));
};

const onLine = (v1, v2, point) => {
    return distance(v1, point) + distance(v2, point) <= distance(v1, v2) + 0.01;
};

const getMaterial = (options) => {
    const mat = new THREE.LineBasicMaterial(options);

    return mat;
};

export default class WhiteboardView extends React.Component {
    animate() {
        requestAnimationFrame(this.animate);
        this.update();
    }

    update() {
        this.renderer.render(this.scene, this.camera);

        if (this.cursor)
            this.cursor.position.set(this.mouse.x, this.mouse.y, 0);

        if (this.mouse.pressed) {
            if (!this.materials.has(this.material.color))
                this.materials.set(this.material.color, getMaterial(this.material));

            this.scene.remove(this.inProgress);

            this.controls[this.drawMode].draw(this.materials.get(this.material.color));

            if (this.inProgress)
                this.scene.add(this.inProgress);
        }
        else if (this.inProgress !== null) {
            this.scene.remove(this.inProgress);

            const points = this.controls[this.drawMode].complete();
            if (Array.isArray(points) && (points.length > 2 || points.length === 2 && distance(points[0], points[1]) > 0.2)) {
                const drawData = this.addToStage(this.materials.get(this.material.color), points);

                emit(drawData.id, drawData.data);
            }

            this.inProgress = null;
            this.inProgressPoints = null;
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    getMousePos(event) {
        const vec = new THREE.Vector3();
        const pos = new THREE.Vector3();

        vec.set(
            event.clientX / window.innerWidth * 2 - 1,
            - (event.clientY / window.innerHeight) * 2 + 1,
            0.5
        );

        vec.unproject(this.camera);

        vec.sub(this.camera.position).normalize();

        const distance = - this.camera.position.z / vec.z;

        pos.copy(this.camera.position).add(vec.multiplyScalar(distance));

        return pos;
    }

    getLabelPos(sprite) {
        let pos = new THREE.Vector3();
        pos = pos.setFromMatrixPosition(sprite.matrixWorld);
        pos.project(this.camera);

        let widthHalf = this.canvas.width / 2;
        let heightHalf = this.canvas.height / 2;

        pos.x = pos.x * widthHalf + widthHalf + 1;
        pos.y = - (pos.y * heightHalf) + heightHalf - 1;
        pos.z = 0;

        return pos;
    }

    /**
     *
     * @param {THREE.LineBasicMaterial} material
     * @param {THREE.Vector3[]} points
     * @param {string} uuid
     * @returns
     */
    addToStage(material, points, uuid = null) {
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const cacheId = uuid || v4();

        const line = new THREE.Line(geometry, material);
        line._cacheId = cacheId;
        this.drawings.set(cacheId, { line, material });
        this.scene.add(line);

        return {
            id: cacheId,
            data: {
                points: points.map((vec) => ({ x: vec.x, y: vec.y, z: vec.z })),
                material: material.toJSON()
            }
        };
    }

    addElementFromStream(data) {
        const json = JSON.parse(data);

        if (!this.drawings.has(json.id)) {
            if (!this.materials.has(json.data.material.color))
                this.materials.set(json.data.material.color, getMaterial(json.data.material));

            this.addToStage(this.materials.get(json.data.material.color), json.data.points.map((point) => new Vector3(point.x, point.y, point.z)), json.id);
        }
        else if (json.remove)
            this.scene.remove(this.drawings.get(json.id));
    }

    trackUsers(data) {
        const json = JSON.parse(data);

        json.users.forEach((user) => {
            if (user.id === socketHandler.socket.id)
                return;

            let tracked = this.tracking.get(user.id);

            if (tracked === undefined || tracked.mode !== user.cursor) {
                if (tracked) {
                    document.getElementById('whiteboard').removeChild(tracked.label);
                    this.scene.add(tracked.cursor);
                }

                const cursorMaterial = new THREE.SpriteMaterial({ map: this.cursors[user.cursor], color: 0xffffff });
                const userCursor = new THREE.Sprite(cursorMaterial);

                userCursor.scale.set(this.cursorScaling, this.cursorScaling, 1);

                this.scene.add(userCursor);

                const label = document.createElement('div');
                label.innerText = user.user;
                label.id = 'whiteboard_label_' + user.id;
                label.classList.add('whiteboard-label');
                label.style.position = 'absolute';

                tracked = {
                    cursor: userCursor,
                    mode: user.cursor,
                    label
                };

                this.tracking.set(user.id, tracked);
                document.getElementById('whiteboard').appendChild(label);
            }

            tracked.cursor.position.set(user.position.x, user.position.y, user.position.z);

            const pagePos = this.getLabelPos(tracked.cursor);

            tracked.label.style.left = pagePos.x + 'px';
            tracked.label.style.top = pagePos.y + 'px';
        });
    }

    updateMousePosition(e) {
        const pos = this.getMousePos(e);

        this.mouse.x = pos.x;
        this.mouse.y = pos.y;

        this.mouse.raw.x = e.clientX;
        this.mouse.raw.y = e.clientY;

        const tracking = {
            id: socketHandler.socket.id,
            user: socketHandler.user,
            position: { x: pos.x, y: pos.y, z: pos.z },
            rawPosition: this.mouse.raw,
            cursor: this.drawMode
        };

        socketHandler.emit('whiteboard_tracking_update', JSON.stringify(tracking));
    }

    setCursor(texture) {
        if (this.scene.children.includes(this.cursor))
            this.scene.remove(this.cursor);

        const cursorMaterial = new THREE.SpriteMaterial({ map: this.cursors[texture], color: 0xffffff });

        this.cursor = new THREE.Sprite(cursorMaterial);
        this.cursor.scale.set(this.cursorScaling, this.cursorScaling, 1);
        this.scene.add(this.cursor);
    }

    componentDidMount() {
        const container = document.getElementById('whiteboard');

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
        this.camera.position.set(0, 0, 100);
        this.camera.lookAt(0, 0, 0);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xcccccc);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.canvas = this.renderer.domElement;

        container.appendChild(this.canvas);

        window.addEventListener('resize', this.onWindowResize);

        this.animate();

        socketHandler.addListener('whiteboard_update', this.addElementFromStream);
        socketHandler.addListener('whiteboard_tracking', this.trackUsers);

        const cursorNames = [
            ['circle', 'circle'],
            ['marker', 'comment'],
            ['eraser', 'eraser'],
            ['grid', 'grid'],
            ['line_arc', 'lineArc'],
            ['line_arrow', 'lineArrow'],
            ['line_curve', 'lineCurve'],
            ['line_poly', 'linePoly'],
            ['line', 'line'],
            ['marker', 'marker'],
            ['square', 'square']
        ];

        this.cursors = {};

        Promise.all(
            cursorNames
                .map((c) => fetch(`/textures/cursor_${c[0]}.png`))
        )
            .then((responses) => {
                Promise.all(responses.map((response) => response.blob()))
                    .then((blobs) => {
                        blobs.forEach((blob, i) => {
                            this.cursors[cursorNames[i][1]] = new THREE.TextureLoader().load(URL.createObjectURL(blob));
                        });

                        getData('/whiteboard/get')
                            .then((json) => {
                                for (let uuid in json)
                                    this.addToStage(getMaterial(json[uuid].material), json[uuid].points.map((point) => new Vector3(point.x, point.y, point.z)), uuid);

                                this.setCursor(this.drawMode);
                            })
                            .catch(console.error);
                    })
                    .catch(console.error);
            })
            .catch(console.error);
    }

    render() {
        return <div
            id='whiteboard'
            className='whiteboard'
            onMouseMove={this.updateMousePosition}
            onMouseDown={
                (e) => {
                    this.mouse.pressed = true;

                    const pos = this.getMousePos(e);
                    this.mouse.start.x = pos.x;
                    this.mouse.start.y = pos.y;
                    this.mouse.end.x = null;
                    this.mouse.end.y = null;
                }
            }
            onMouseUp={
                (e) => {
                    this.mouse.pressed = false;

                    const pos = this.getMousePos(e);
                    this.mouse.end.x = pos.x;
                    this.mouse.end.y = pos.y;
                }
            }
            onContextMenu={(e) => e.preventDefault()}
        >
            <ul
                className='whiteboard-brush-controls'
            >
                {
                    Object.values(this.controls).map((ctl, i) =>
                        <li
                            key={i}
                            className='whiteboard-control'
                        >
                            <button
                                className='btn primary'
                                onClick={ctl.onClick}
                                data-tip={ctl.tooltip}
                                data-for='whiteboard_controls_tooltip'
                            >
                                <i
                                    className={`icon bi bi-${ctl.name}`}
                                />
                            </button>
                        </li>
                    )
                }
            </ul>

            <div
                className='whiteboard-color-controls'
            >
                <input
                    type='color'
                    onChange={
                        (e) => {
                            this.material.color = new THREE.Color(e.target.value);
                        }
                    }
                />
            </div>

            <ReactTooltip
                id='whiteboard_controls_tooltip'
                place='left'
            />
        </div>;
    }

    constructor(props) {
        super(props);

        this.canvas = null;

        this.mouse = {
            x: 0,
            y: 0,
            pressed: false,
            raw: {
                x: 0,
                y: 0
            },
            start: {
                x: null,
                y: null
            },
            end: {
                x: null,
                y: null
            },
            distance() {
                return Math.sqrt((this.x - this.start.x) * (this.x - this.start.x) + (this.y - this.start.y) * (this.y - this.start.y));
            }
        };

        /**
         * @type {THREE.Sprite}
         */
        this.cursor = null;
        this.drawMode = 'marker';
        this.cursorScaling = 6;
        this.material = { color: 0 };

        /**
         * @type {Map<number, THREE.Line>}
         */
        this.drawings = new Map();
        this.materials = new Map();
        this.inProgress = null;
        this.inProgressPoints = null;

        /**
         * @type {Map<string, {cursor: THREE.Sprite, label: HTMLDivElement}>}
         */
        this.tracking = new Map();

        this.drawLoop = null;

        this.cursors = {};

        this.controls = {
            eraser: {
                name: 'eraser',
                tooltip: 'Eraser',
                onClick: () => {
                    this.drawMode = 'eraser';
                    this.setCursor('eraser');
                },
                draw: () => {
                    this.drawings.forEach((drawing, id) => {
                        const posAtr = drawing.line.geometry.getAttribute('position');

                        const v1 = new THREE.Vector3();
                        const v2 = new THREE.Vector3();

                        for (let i = 1; i < posAtr.count; i++) {
                            if (onLine(v1.fromBufferAttribute(posAtr, i - 1), v2.fromBufferAttribute(posAtr, i), this.mouse)) {
                                this.scene.remove(drawing.line);
                                this.drawings.delete(id);

                                emit(drawing.line._cacheId, [], true);

                                break;
                            }
                        }
                    });

                    return null;
                },
                complete: () => {
                    return null;
                }
            },
            lineArc: {
                name: 'bezier',
                tooltip: 'Line (Arc)',
                onClick: () => {
                    this.drawMode = 'lineArc';
                    this.setCursor('lineArc');
                },
                draw: (material) => {

                },
                complete: () => {

                }
            },
            lineCurve: {
                name: 'bezier2',
                tooltip: 'Line (Curve)',
                onClick: () => {
                    this.drawMode = 'lineCurve';
                    this.setCursor('lineCurve');
                },
                draw: (material) => {

                },
                complete: () => {

                }
            },
            linePoly: {
                name: 'bounding-box-circles',
                tooltip: 'Polygon',
                onClick: () => {
                    this.drawMode = 'linePoly';
                    this.setCursor('linePoly');
                },
                draw: (material) => {

                },
                complete: () => {

                }
            },
            grid: {
                name: 'border-all',
                tooltip: 'Grid',
                onClick: () => {
                    this.drawMode = 'grid';
                    this.setCursor('grid');
                },
                draw: (material) => {

                },
                complete: () => {

                }
            },
            marker: {
                name: 'pen',
                tooltip: 'Marker',
                onClick: () => {
                    this.drawMode = 'marker';
                    this.setCursor('marker');
                },
                draw: (material) => {
                    if (this.inProgressPoints === null)
                        this.inProgressPoints = [new THREE.Vector3(this.mouse.start.x, this.mouse.start.y, 0)];
                    else
                        this.inProgressPoints.push(new THREE.Vector3(this.mouse.x, this.mouse.y, 0));

                    const geometry = new THREE.BufferGeometry().setFromPoints(this.inProgressPoints);

                    this.inProgress = new THREE.Line(geometry, material);
                },
                complete: () => {
                    if (
                        this.inProgressPoints === null ||
                        this.inProgressPoints.length === 0 ||
                        this.mouse.end.x === null ||
                        this.mouse.end.y === null
                    )
                        return;

                    this.inProgressPoints.push(new THREE.Vector3(this.mouse.end.x, this.mouse.end.y, 0));

                    return this.inProgressPoints;
                }
            },
            comment: {
                name: 'chat-right',
                tooltip: 'Comment',
                onClick: () => {
                    this.drawMode = 'comment';
                    this.setCursor('comment');
                },
                draw: (material) => {

                },
                complete: () => {

                }
            },
            circle: {
                name: 'circle',
                tooltip: 'Circle',
                onClick: () => {
                    this.drawMode = 'circle';
                    this.setCursor('circle');
                },
                draw: (material) => {
                    let dist = this.mouse.distance();

                    const curve = new THREE.EllipseCurve(
                        this.mouse.start.x, this.mouse.start.y,
                        dist, dist,
                        0, 2 * Math.PI,
                        false
                    );

                    const points = curve.getSpacedPoints(20 + Math.floor(dist));

                    const geometry = new THREE.BufferGeometry().setFromPoints(points);

                    this.inProgress = new THREE.Line(geometry, material);
                },
                complete: () => {
                    if (
                        this.mouse.start.x === null ||
                        this.mouse.start.y === null
                    )
                        return;

                    let dist = this.mouse.distance();

                    const curve = new THREE.EllipseCurve(
                        this.mouse.start.x, this.mouse.start.y,
                        dist, dist,
                        0, 2 * Math.PI,
                        false
                    );

                    const points = curve.getSpacedPoints(20 + Math.floor(dist));

                    return points;
                }
            },
            line: {
                name: 'dash-lg',
                tooltip: 'Line',
                onClick: () => {
                    this.drawMode = 'line';
                    this.setCursor('line');
                },
                draw: (material) => {
                    const points = [];
                    points.push(new THREE.Vector3(this.mouse.start.x, this.mouse.start.y, 0));
                    points.push(new THREE.Vector3(this.mouse.x, this.mouse.y, 0));

                    const geometry = new THREE.BufferGeometry().setFromPoints(points);

                    this.inProgress = new THREE.Line(geometry, material);
                },
                complete: () => {
                    if (
                        this.mouse.start.x === null ||
                        this.mouse.start.y === null ||
                        this.mouse.end.x === null ||
                        this.mouse.end.y === null
                    )
                        return;

                    const points = [];
                    points.push(new THREE.Vector3(this.mouse.start.x, this.mouse.start.y, 0));
                    points.push(new THREE.Vector3(this.mouse.end.x, this.mouse.end.y, 0));

                    return points;
                }
            },
            square: {
                name: 'square',
                tooltip: 'Square',
                onClick: () => {
                    this.drawMode = 'square';
                    this.setCursor('square');
                },
                draw: (material) => {
                    let dist = this.mouse.distance() / 2;

                    const points = [];
                    points.push(new THREE.Vector3(this.mouse.start.x - dist, this.mouse.start.y - dist, 0));
                    points.push(new THREE.Vector3(this.mouse.start.x + dist, this.mouse.start.y - dist, 0));
                    points.push(new THREE.Vector3(this.mouse.start.x + dist, this.mouse.start.y + dist, 0));
                    points.push(new THREE.Vector3(this.mouse.start.x - dist, this.mouse.start.y + dist, 0));
                    points.push(new THREE.Vector3(this.mouse.start.x - dist, this.mouse.start.y - dist, 0));

                    const geometry = new THREE.BufferGeometry().setFromPoints(points);

                    this.inProgress = new THREE.Line(geometry, material);
                },
                complete: () => {
                    if (
                        this.mouse.start.x === null ||
                        this.mouse.start.y === null ||
                        this.mouse.end.x === null ||
                        this.mouse.end.y === null
                    )
                        return;

                    let dist = this.mouse.distance() / 2;

                    const points = [];
                    points.push(new THREE.Vector3(this.mouse.start.x - dist, this.mouse.start.y - dist, 0));
                    points.push(new THREE.Vector3(this.mouse.start.x + dist, this.mouse.start.y - dist, 0));
                    points.push(new THREE.Vector3(this.mouse.start.x + dist, this.mouse.start.y + dist, 0));
                    points.push(new THREE.Vector3(this.mouse.start.x - dist, this.mouse.start.y + dist, 0));
                    points.push(new THREE.Vector3(this.mouse.start.x - dist, this.mouse.start.y - dist, 0));

                    return points;
                }
            }
        };

        this.animate = this.animate.bind(this);
        this.trackUsers = this.trackUsers.bind(this);
        this.getMousePos = this.getMousePos.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.updateMousePosition = this.updateMousePosition.bind(this);
        this.addElementFromStream = this.addElementFromStream.bind(this);
    }
}