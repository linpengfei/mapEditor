/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';
import {
    WebGLRenderer,
    PerspectiveCamera,
    Vector3,
    Scene,
    Color,
    AxesHelper,
    GridHelper,
    BoxGeometry,
    MeshBasicMaterial,
    Mesh,
    Line3,
    DoubleSide,
    ImageBitmapLoader,
    CanvasTexture,
    PlaneGeometry,
    Line,
    Shape,
    OrthographicCamera,
    LineBasicMaterial,
    Geometry,
    BufferGeometry,
    Path,
    ShapeBufferGeometry,
    ExtrudeBufferGeometry,
    ShapePath,
    Vector2,
    Math as _Math,
    CameraHelper, ExtrudeGeometry, Points, PointsMaterial, Group, Raycaster
} from 'three';
import WEBGL from './WebGL';
import { sendActionSignal, getActionSignal } from "./SignalService";
import { sendDrawSignal, getDrawSignal } from "./actionPlane/DrawSinglServer";
import { sendInfoData, getValueSet } from "./infoPlane/InfoCommunicateServer";
import { TransformControls } from './TransformControls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MapControls } from 'three/examples/jsm/controls/MapControls';
import BgImg from './assets/img/zoneFloor.png';
import {Subscription, fromEvent, partition} from "rxjs";
import { map, filter, distinct } from 'rxjs/operators';
import { transformCoordinateSys } from './utils';
type Props = {};
type State = {};
const extrudeSettings = {
    steps: 1,
    depth: 100,
    bevelEnabled: true,
};
export default class Sketchpad extends Component<Props, State> {
    static defaultProps = {};
    containerRef: Object;
    canvasRef: Object;
    cameraControls: Object;
    scene: Object;
    sceneHelpers: Object;
    camera: Object;
    DEFAULT_CAMERA: Object;
    object: Object;
    geometries: Object;
    materials: Object;
    textures: Object;
    animations: Object;
    selected: Object;
    helpers: Object;


    // 绘制参数
    drawPath: Array;
    drawShape: string;
    draw: boolean;
    drawObj: Object;
    lineBasicMaterial: Object;
    meshBasicMaterial: Object;

    group3D: Object;
    group3DMap: Map;
    group2D: Object;

    raycaster: Object; // 光线处理
    renderer: Object;
    orbitControls: Object;
    actionSignalSub: Subscription;
    drawSignalSub: Subscription;
    eventSub: Subscription;
    constructor(props) {
        super(props);
        this.DEFAULT_CAMERA = new PerspectiveCamera( 50, 1, 0.01, 1000 );
        this.DEFAULT_CAMERA.name = 'Camera';
        this.DEFAULT_CAMERA.position.set( 0, 0, 30 );
        this.DEFAULT_CAMERA.lookAt( new Vector3() );

        this.object = {};
        this.geometries = {};
        this.materials = {};
        this.textures = {};
        this.scripts = {};

        this.animations = {};
        this.selected = null;
        this.helpers = {};



        this.state = {};
        this.containerRef = React.createRef();
        this.canvasRef = React.createRef();
        this.scene = new Scene();
        this.scene.name = 'Scene';
        this.scene.background = new Color( 0xaaaaaa );
        // 不同视图对象分组，默认处于3d模式，绘制时切换至2d
        this.group2D = new Group();
        this.group3D = new Group();
        this.group3DMap = new Map<string, string>();
        // this.scene.add(this.group2D);
        this.scene.add(this.group3D);
        this.sceneHelpers = new Scene();

    //    基础材质准备
        this.lineBasicMaterial = new LineBasicMaterial({ color: 0x0000ff, linewidth: 2 });
        this.meshBasicMaterial = new MeshBasicMaterial({ color: 0x0000ff });
    }
    componentDidMount() {
        const canvas = this.canvasRef.current;
        // this.camera = this.DEFAULT_CAMERA.clone();Vec
        if (canvas) {
            const { clientHeight, clientWidth } = canvas;
            const perspective = 800;
            const fov = 180 * ( 2 * Math.atan( clientHeight / 2 / perspective ) ) / Math.PI;
            // this.camera = new PerspectiveCamera(100, clientWidth / clientHeight, 1, 1000);
            // this.camera = new PerspectiveCamera( fov, clientWidth / clientHeight, 1, 10000 );
            this.camera = new OrthographicCamera(-clientWidth/2 , clientWidth/2, clientHeight/2, -clientHeight / 2, 0.01, 100000);
            this.camera.name = 'Camera';
            this.camera.position.set( 0, 0, perspective );
            this.camera.lookAt( new Vector3() );
            this.raycaster = new Raycaster();
            if (WEBGL.isWebGL2Available()) {
                console.log('webgl2');
                const context = canvas.getContext('webgl2');
                this.renderer = new WebGLRenderer({ canvas, antialias: true, context });
            } else {
                this.renderer = new WebGLRenderer({ canvas, antialias: true });
            }
            this.renderer.setClearColor(0x000000);
            this.renderer.setPixelRatio(window.devicePixelRatio);

            const loader = new ImageBitmapLoader();
            loader.load(BgImg, imageBitMap => {
                const texture = new CanvasTexture( imageBitMap );
                const material = new MeshBasicMaterial( { map: texture } );
                const planeGeometry = new PlaneGeometry( imageBitMap.width, imageBitMap.height, 1, 1);
                const plane = new Mesh( planeGeometry, material );
                plane.translateZ(0);
                this.scene.add( plane );
            });
            // this.scene.rotateX(Math.PI / 2);
            this.scene.add(new AxesHelper(Math.max(clientHeight, clientWidth)));
            // 增加网格辅助线
            const gridHelper = new GridHelper( Math.max(clientHeight, clientWidth), 100, 0x444444, 0x888888 );
            gridHelper.rotateX(Math.PI / 2);
            this.scene.add(gridHelper);
            this.orbitControls = new OrbitControls(this.camera, this.containerRef.current);
            // this.orbitControls = new MapControls(this.camera, this.containerRef.current);
            this.orbitControls.addEventListener('change', () => {
                // console.log('aaa');
                console.log(this.camera.zoom);
            });
            // this.orbitControls.enableRotate = false;
            this.resetControlsRotateAngle(this.orbitControls);
            this.renderer.setSize(clientWidth, clientHeight);
            this.renderer.setClearColor(new Color(0xEEEEEE));
            this.renderer.render(this.scene, this.camera);
            this.animate();
            this.subscribeSingle();
            // TODO 是否取整需要继续确认
            const [selectObserver, drawObserver] = partition(fromEvent(this.canvasRef.current, 'click'), () => this.draw);
            this.eventSub = selectObserver.pipe(
                filter(() => !this.isComplete()),
                distinct(event => event.clientX + ':' + event.clientY, getDrawSignal()),
                map(event => {
                    const { x, y, positionX, positionY } = transformCoordinateSys(event, this.canvasRef.current);
                    const vector = new Vector3(x, y, 0);
                    vector.unproject(this.camera);
                    vector.setZ(0);
                    vector.positionX = positionX;
                    vector.positionY = positionY;
                    return vector;
                }),
            ).subscribe(this.handleDrawClick);
            this.eventSub.add(drawObserver.pipe(
                map(event => {
                    const { x, y } = transformCoordinateSys(event, this.canvasRef.current);
                    return new Vector3(x, y, 0.5);
                }),
            ).subscribe(this.getSelectObject));
            this.eventSub.add(fromEvent(this.canvasRef.current, 'dblclick').pipe(
                filter(() => this.draw),
            ).subscribe(this.handleDrawDblclick));
            this.eventSub.add(fromEvent(this.canvasRef.current, 'mousemove').pipe(
                filter(() => this.draw && this.drawPath.length),
                map(event => {
                    const { x, y, positionX, positionY } = transformCoordinateSys(event, this.canvasRef.current);
                    const vector = new Vector3(x, y, 0);
                    vector.unproject(this.camera);
                    vector.setZ(0);
                    vector.positionX = positionX;
                    vector.positionY = positionY;
                    return vector;
                }),
            ).subscribe(this.handleDrawMouseMove));
            this.eventSub.add(getValueSet().subscribe(this.changeObject));
        }
    }
    changeObject = data => {
        console.log(data);
        const { uuid, type, points } = data;
        const path = this.generatePath(type, points);
        const item = this.group3D.getObjectByProperty('uuid', uuid);
        console.log(item);
        this.group3D.remove(item);
        item.dispose();
        item.geometry.dispose();
        // item.geometry = new ExtrudeBufferGeometry(path, extrudeSettings);
        const object = this.drawGraph(type, points);
        object.object3d.userData.uuid = uuid;
        this.group3D.add(object.object3d);
        this.group3DMap.set(uuid, object.object3d.uuid);
    };
    getSelectObject = point => {
        this.raycaster.setFromCamera(point, this.camera);
        const intersects = this.raycaster.intersectObjects(this.group3D.children);
        if (intersects.length) {
            const [select] = intersects;
            console.log(select);
            for (const x of this.group3D.children) {
                console.log(x.material === this.meshBasicMaterial);
                if (x.material !== this.meshBasicMaterial) {
                    x.material.dispose();
                    x.material = this.meshBasicMaterial;
                }
                console.log(this.renderer.info);
            }
            select.object.material = this.meshBasicMaterial.clone();
            select.object.material.color = new Color(0xff0000);
            sendInfoData(select.object.userData);
        }
        console.log(intersects);
    };
    isComplete = (dblClick = false) => {
        switch (this.drawShape) {
            case 'line':
            case 'rect':
            case 'circle':
                return this.drawPath.length >= 2;
            case 'polygon':
                return dblClick ? this.drawPath.length >= 3 : this.drawPath.length >= 20;
            default:
                return false;
        }
    };
    drawGraph = (drawShape, drawPath) => {
        let object2d = null, object3d = null;
        const path = this.generatePath(drawShape, drawPath);
        switch (drawShape) {
            case 'line':
                // 2d
                object2d = new Line(new BufferGeometry(), this.lineBasicMaterial);
                drawPath[0].z = 0;
                drawPath[1] && (drawPath[1].z = 0);
                object2d.geometry.setFromPoints(drawPath);
                object2d.geometry.verticesNeedUpdate = true;
                // 3d
                // const pathLine = new Shape();
                // pathLine.moveTo(drawPath[0].x, drawPath[0].y, 0);
                // pathLine.lineTo(drawPath[1].x, drawPath[1].y, 0);
                // object3d = new Mesh(new ExtrudeGeometry(pathLine,  extrudeSettings), this.meshBasicMaterial.clone());
                // object3d.userData = { type: 'line', points: this.drawPath.slice(0, 2), uuid: object3d.uuid };
                break;
            case 'rect':
                // const pathRect = new Shape();
                // pathRect.moveTo(drawPath[0].x, drawPath[0].y, 0);
                // pathRect.lineTo(drawPath[1].x, drawPath[0].y, 0);
                // pathRect.lineTo(drawPath[1].x, drawPath[1].y, 0);
                // pathRect.lineTo(drawPath[0].x, drawPath[1].y, 0);
                // pathRect.lineTo(drawPath[0].x, drawPath[0].y, 0);
                object2d = new Mesh(new ShapeBufferGeometry(path, 1), this.meshBasicMaterial);
                // object3d = new Mesh(new ExtrudeGeometry(pathRect, extrudeSettings), this.meshBasicMaterial.clone());
                // object3d.userData = { type: 'rect', points: this.drawPath.slice(0, 2), uuid: object3d.uuid };
                console.log(object3d);
                break;
            case 'polygon':
                // const pathPolygon = new Shape();
                // pathPolygon.moveTo(drawPath[0].x, drawPath[0].y,0);
                // for (let i = 1; i< drawPath.length && i < 19; i++) {
                //     pathPolygon.lineTo(drawPath[i].x, drawPath[i].y,0);
                // }
                // pathPolygon.lineTo(drawPath[0].x, drawPath[0].y,0);
                object2d = new Mesh(new ShapeBufferGeometry(path), this.meshBasicMaterial);
                // object3d= new Mesh(new ExtrudeGeometry(pathPolygon, extrudeSettings), this.meshBasicMaterial.clone());
                // object3d.userData = { type: 'polygon', points: this.drawPath.slice(), uuid: object3d.uuid };
                break;
            case 'circle':
                // const pathCircle = new Shape();
                // pathCircle.moveTo(drawPath[0].x, drawPath[0].y,0);
                // const a = new Vector2(drawPath[0].positionX, drawPath[0].positionY);
                // const b = new Vector2(drawPath[1].positionX, drawPath[1].positionY);
                // pathCircle.absarc(drawPath[0].x, drawPath[0].y, a.distanceTo(b) / this.camera.zoom, 0, 2* Math.PI);
                object2d = new Mesh(new ShapeBufferGeometry(path, 100), this.meshBasicMaterial);
                // object3d = new Mesh(new ExtrudeGeometry(pathCircle, extrudeSettings), this.meshBasicMaterial.clone());
                // object3d.userData = { type: 'circle', points: this.drawPath.slice(0, 2), uuid: object3d.uuid };
                break;
            default:
                break;
        }
        object3d = new Mesh(new ExtrudeBufferGeometry(path, extrudeSettings), this.meshBasicMaterial);
        object3d.userData = { type: drawShape, points: this.drawPath.slice() };
        return { object2d, object3d };
    };

    generatePath = (drawShape, drawPath) => {
        const path = new Shape();
        switch (drawShape) {
            case 'line':
                // 3d
                path.moveTo(drawPath[0].x, drawPath[0].y, 0);
                path.lineTo(drawPath[1].x, drawPath[1].y, 0);
                // object3d = new Mesh(new ExtrudeGeometry(pathLine,  extrudeSettings), this.meshBasicMaterial.clone());
                // object3d.userData = { type: 'line', points: this.drawPath.slice(0, 2), uuid: object3d.uuid };
                break;
            case 'rect':
                path.moveTo(drawPath[0].x, drawPath[0].y, 0);
                path.lineTo(drawPath[1].x, drawPath[0].y, 0);
                path.lineTo(drawPath[1].x, drawPath[1].y, 0);
                path.lineTo(drawPath[0].x, drawPath[1].y, 0);
                path.lineTo(drawPath[0].x, drawPath[0].y, 0);
                // object2d = new Mesh(new ShapeBufferGeometry(pathRect, 1), this.meshBasicMaterial.clone());
                // object3d = new Mesh(new ExtrudeGeometry(pathRect, extrudeSettings), this.meshBasicMaterial.clone());
                // object3d.userData = { type: 'rect', points: this.drawPath.slice(0, 2), uuid: object3d.uuid };
                break;
            case 'polygon':
                path.moveTo(drawPath[0].x, drawPath[0].y,0);
                for (let i = 1; i< drawPath.length && i < 19; i++) {
                    path.lineTo(drawPath[i].x, drawPath[i].y,0);
                }
                path.lineTo(drawPath[0].x, drawPath[0].y,0);
                // object2d = new Mesh(new ShapeBufferGeometry(pathPolygon), this.meshBasicMaterial.clone());
                // object3d= new Mesh(new ExtrudeGeometry(pathPolygon, extrudeSettings), this.meshBasicMaterial.clone());
                // object3d.userData = { type: 'polygon', points: this.drawPath.slice(), uuid: object3d.uuid };
                break;
            case 'circle':
                path.moveTo(drawPath[0].x, drawPath[0].y,0);
                const a = new Vector2(drawPath[0].positionX, drawPath[0].positionY);
                const b = new Vector2(drawPath[1].positionX, drawPath[1].positionY);
                path.absarc(drawPath[0].x, drawPath[0].y, a.distanceTo(b) / this.camera.zoom, 0, 2* Math.PI);
                // object2d = new Mesh(new ShapeBufferGeometry(pathCircle, 100), this.meshBasicMaterial.clone());
                // object3d = new Mesh(new ExtrudeGeometry(pathCircle, extrudeSettings), this.meshBasicMaterial.clone());
                // object3d.userData = { type: 'circle', points: this.drawPath.slice(0, 2), uuid: object3d.uuid };
                break;
            default:
                break;
        }
        return path;
    };

    handleDrawClick = point => {
        this.drawPath.push(point);
        // if (this.isComplete()) {
        //     const object = this.drawGraph(this.drawShape, this.drawPath);
        //     this.group2D.add(object.object2d);
        //     const uuid = _Math.generateUUID();
        //     object.object3d.userData.uuid = uuid;
        //     this.group3D.add(object.object3d);
        //     this.group3DMap.set(uuid, object.object3d.uuid);
        //     this.drawPath = [];
        // }
        this.completeDraw();
        // switch (this.drawShape) {
        //     case 'line':
        //         // if (!this.drawObj) {
        //         //     this.drawObj = new Line(new BufferGeometry(), this.lineBasicMaterial.clone());
        //         // }
        //         // this.drawPath[0].z = 0;
        //         // this.drawPath[1] && (this.drawPath[1].z = 0);
        //         // this.drawObj.geometry.setFromPoints(this.drawPath);
        //         // this.drawObj.geometry.verticesNeedUpdate = true;
        //         // this.scene.add(this.drawObj);
        //
        //         if (this.drawObj) {
        //             this.scene.remove(this.drawObj);
        //         }
        //         if (this.drawPath.length >= 2) {
        //             const path = new Shape();
        //             path.moveTo(this.drawPath[0].x, this.drawPath[0].y, 0);
        //             path.lineTo(this.drawPath[1].x, this.drawPath[1].y, 0);
        //             // this.drawObj = new Mesh(new ShapeBufferGeometry(path, 1), this.meshBasicMaterial.clone());
        //             this.drawObj = new Mesh(new ExtrudeGeometry(path,  extrudeSettings), this.meshBasicMaterial.clone());
        //             // this.drawObj.add(new Points(path), this.meshBasicMaterial.clone());
        //             var dotGeometry = new Geometry();
        //             dotGeometry.vertices.push(this.drawPath[0]);
        //             dotGeometry.vertices.push(this.drawPath[1]);
        //             console.log(dotGeometry);
        //             var dotMaterial = new PointsMaterial( { size: 10, sizeAttenuation: false, color:0x0000ff } );
        //             var dot = new Points( dotGeometry, dotMaterial );
        //             // this.drawObj.add( dot );
        //             this.scene.add(dot);
        //             this.scene.add(this.drawObj);
        //             console.log(this.drawObj);
        //             this.draw = false;
        //         }
        //         break;
        //     case 'rect':
        //         if (this.drawObj) {
        //             this.scene.remove(this.drawObj);
        //         }
        //         if (this.drawPath.length >= 2) {
        //             const path = new Shape();
        //             path.moveTo(this.drawPath[0].x, this.drawPath[0].y, 0);
        //             path.lineTo(this.drawPath[1].x, this.drawPath[0].y, 0);
        //             path.lineTo(this.drawPath[1].x, this.drawPath[1].y, 0);
        //             path.lineTo(this.drawPath[0].x, this.drawPath[1].y, 0);
        //             path.lineTo(this.drawPath[0].x, this.drawPath[0].y, 0);
        //             // this.drawObj = new Mesh(new ShapeBufferGeometry(path, 1), this.meshBasicMaterial.clone());
        //             this.drawObj = new Mesh(new ExtrudeGeometry(path, extrudeSettings), this.meshBasicMaterial.clone());
        //             this.scene.add(this.drawObj);
        //             this.draw = false;
        //         }
        //         break;
        //     case 'polygon':
        //         if (this.drawObj) {
        //             this.scene.remove(this.drawObj);
        //         }
        //         if (this.drawPath.length >= 3) {
        //             const path = new Shape();
        //             path.moveTo(this.drawPath[0].x, this.drawPath[0].y,0);
        //             for (let i = 1; i< this.drawPath.length && i < 19; i++) {
        //                 path.lineTo(this.drawPath[i].x, this.drawPath[i].y,0);
        //             }
        //             path.lineTo(this.drawPath[0].x, this.drawPath[0].y,0);
        //             // this.drawObj = new Mesh(new ShapeBufferGeometry(path), this.meshBasicMaterial.clone());
        //             this.drawObj = new Mesh(new ExtrudeGeometry(path, extrudeSettings), this.meshBasicMaterial.clone());
        //             this.scene.add(this.drawObj);
        //         }
        //         break;
        //     case 'circle':
        //         if (this.drawObj) {
        //             this.scene.remove(this.drawObj);
        //         }
        //         if (this.drawPath.length >= 2) {
        //             const path = new Shape();
        //             path.moveTo(this.drawPath[0].x, this.drawPath[0].y);
        //             const a = new Vector2(this.drawPath[0].positionX, this.drawPath[0].positionY);
        //             const b = new Vector2(this.drawPath[1].positionX, this.drawPath[1].positionY);
        //             path.absarc(this.drawPath[0].x, this.drawPath[0].y, a.distanceTo(b) / this.camera.zoom, 0, 2* Math.PI);
        //             // this.drawObj = new Mesh(new ShapeBufferGeometry(path, 100), this.meshBasicMaterial.clone());
        //             // this.drawObj.translateZ(this.drawPath[0].z);
        //             this.drawObj = new Mesh(new ExtrudeGeometry(path, extrudeSettings), this.meshBasicMaterial.clone());
        //             this.scene.add(this.drawObj);
        //         }
        //         break;
        //     default:
        //         break;
        // }
    };
    handleDrawMouseMove = point => {
        if (!this.drawPath.length) {
            return;
        }
        const tempPath = this.drawPath.slice();
        tempPath.push(point);
        if (this.drawObj) {
            this.scene.remove(this.drawObj);
            // this.drawObj.dispose();
            // this.drawObj.geometry.dispose();
            // this.drawObj.material.dispose();
        }
        this.drawObj = this.drawGraph(this.drawShape, tempPath).object2d;
        this.scene.add(this.drawObj);
    };
    completeDraw = (mask = false)=> {
        if (this.isComplete(mask)) {
            const object = this.drawGraph(this.drawShape, this.drawPath);
            this.group2D.add(object.object2d);
            const uuid = _Math.generateUUID();
            object.object3d.userData.uuid = uuid;
            this.group3D.add(object.object3d);
            this.group3DMap.set(uuid, object.object3d.uuid);
            this.drawPath = [];
        }
    };
    handleDrawDblclick = () => {
        this.completeDraw(true);
    };
    resetControlsRotateAngle(controls) {
        controls.maxPolarAngle = Math.PI;
        controls.minAzimuthAngle = -Math.PI / 2;
        controls.maxAzimuthAngle = Math.PI / 2;
    }
    subscribeSingle = () => {
        this.actionSignalSub = getActionSignal().subscribe(this.actionHandle);
        this.drawSignalSub = getDrawSignal().subscribe(this.drawSignalHandle)
    };
    drawSignalHandle = action => {
        const { type, data } = action;
        if (type === 'draw') {
            this.draw = true;
            // this.group2D.visible = true;
            // this.group3D.visible = false;
            this.scene.add(this.group2D);
            this.scene.remove(this.group3D);
            this.orbitControls.enableRotate = false;
            // this.orbitControls.enabled = false;
            this.orbitControls.maxPolarAngle = this.orbitControls.minPolarAngle = Math.PI / 2;
            this.orbitControls.maxAzimuthAngle = this.orbitControls.minAzimuthAngle = 0;
        } else if (type === 'undraw') {
            console.log('undraw');
            if (this.drawObj) {
                this.scene.remove(this.drawObj);
            }
            this.scene.remove(this.group2D);
            this.scene.add(this.group3D);
            this.orbitControls.enableRotate = true;
            this.orbitControls.maxPolarAngle =Math.PI;
                this.orbitControls.minPolarAngle = 0;
            this.orbitControls.maxAzimuthAngle = Infinity;
                this.orbitControls.minAzimuthAngle = -Infinity;
            this.draw = false;
        }
        sendInfoData({});
        this.drawPath = [];
        this.drawShape = data.drawShape;
        this.scene.remove(this.drawObj);
        this.drawObj = null;
    };
    actionHandle = action => {
        console.log(action);
        const { type, data } = action;
        switch (type) {
            case 'add':
                this.scene.add(data);
                break;
            default:
                 break;
        }
    };
    componentWillUnmount() {
        this.actionSignalSub.unsubscribe();
        this.eventSub.unsubscribe();
    }
    animate = () => {
        requestAnimationFrame(this.animate);
        // 需要更新
        this.orbitControls.update();
        this.renderer.render(this.scene, this.camera);
    };
    render() {
        return <div ref={this.containerRef} className="sketchpadContainers">
            <canvas ref={this.canvasRef} className="canvasContent">
                Please use browser support canvas!
            </canvas>
        </div>;
    }
}
