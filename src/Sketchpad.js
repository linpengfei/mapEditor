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
    CameraHelper
} from 'three';
import WEBGL from './WebGL';
import { sendActionSignal, getActionSignal } from "./SignalService";
import { sendDrawSignal, getDrawSignal } from "./actionPlane/DrawSinglServer";
import { TransformControls } from './TransformControls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MapControls } from 'three/examples/jsm/controls/MapControls';
import BgImg from './assets/img/zoneFloor.png';
import {Subscription, fromEvent} from "rxjs";
import { map, filter, distinct } from 'rxjs/operators';
import { transformCoordinateSys } from './utils';
type Props = {};
type State = {};
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

    renderer: Object;
    orbitControls: Object;
    actionSignalSub: Subscription;
    drawSignalSub: Subscription;
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

        this.sceneHelpers = new Scene();

    //    基础材质准备
        this.lineBasicMaterial = new LineBasicMaterial({ color: 0x0000ff });
        this.meshBasicMaterial = new MeshBasicMaterial({ color: 0x0000ff });
    }


    addMaterial = ( material ) => {
    this.materials[ material.uuid ] = material;
    }

    select = ( object ) => {

    if ( this.selected === object ) return;

    let uuid = null;

    if ( object !== null ) {

    uuid = object.uuid;
}
this.selected = object;
}
    deselect = () => {

    this.select( null );

}
    componentDidMount() {
        const canvas = this.canvasRef.current;
        // this.camera = this.DEFAULT_CAMERA.clone();Vec
        if (canvas) {
            const { clientHeight, clientWidth } = canvas;
            const perspective = 800;
            const fov = 180 * ( 2 * Math.atan( clientHeight / 2 / perspective ) ) / Math.PI;
            // this.camera = new PerspectiveCamera(100, clientWidth / clientHeight, 1, 1000);
            this.camera = new PerspectiveCamera( fov, clientWidth / clientHeight, 1, 10000 );
            // this.camera = new OrthographicCamera(- 1000 , 1000, 1000, -1000, 0.01, 100000)
            this.camera.name = 'Camera';
            this.camera.position.set( 0, 0, perspective );
            this.camera.lookAt( new Vector3() );
            if (WEBGL.isWebGL2Available()) {
                console.log('webgl2');
                const context = canvas.getContext('webgl2');
                this.renderer = new WebGLRenderer({ canvas, antialias: true, context });
            } else {
                this.renderer = new WebGLRenderer({ canvas, antialias: true });
            }
            this.renderer.setClearColor(0x000000);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            var geometry = new BoxGeometry( 100, 100, 100 );
            var material = new MeshBasicMaterial( { color: 0x00ff00, side: DoubleSide } );
            // material.side = THREE.DoubleSide;
            var cube = new Mesh( geometry, material );
            this.scene.add(cube);
            console.log(cube);
            // const cameraHelper = new CameraHelper(this.camera);
            // this.scene.add(cameraHelper);
            // var planeGeometry = new PlaneGeometry( 20, 20, 1, 1);
            // var planeMaterial = new MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} );
            // var plane = new THREE.Mesh( planeGeometry, planeMaterial );
            // plane.rotateX(Math.PI / 2);
            // this.scene.add( plane );
            const loader = new ImageBitmapLoader();
            loader.load(BgImg, imageBitMap => {
                console.log(imageBitMap);
                var texture = new CanvasTexture( imageBitMap );
                var material = new MeshBasicMaterial( { map: texture } );
                var planeGeometry = new PlaneGeometry( imageBitMap.width, imageBitMap.height, 1, 1);
                var plane = new Mesh( planeGeometry, material );
                this.scene.add( plane );
            });
            // this.scene.rotateX(Math.PI / 2);
            this.scene.add(new AxesHelper(Math.max(clientHeight, clientWidth)));
            // 增加网格辅助线
            const gridHelper = new GridHelper( 10, 10, 0x444444, 0x888888 );
            gridHelper.rotateX(Math.PI / 2);
            this.scene.add(gridHelper);
            this.orbitControls = new OrbitControls(this.camera, this.containerRef.current);
            // this.orbitControls = new MapControls(this.camera, this.containerRef.current);
            this.orbitControls.addEventListener('change', () => {
                console.log('aaa');
            });
            // this.orbitControls.enableRotate = false;
            this.resetControlsRotateAngle(this.orbitControls);
            this.renderer.setSize(clientWidth, clientHeight);
            this.renderer.setClearColor(new Color(0xEEEEEE));
            this.renderer.render(this.scene, this.camera);
            this.animate();
            this.subscribeSingle();
            // 需要移除订阅，每次绘制需要单独切换
            const ob = getDrawSignal();
            fromEvent(this.canvasRef.current, 'click').pipe(
                filter(() => this.draw),
                distinct(event => event.clientX + ':' + event.clientY, getDrawSignal()),
                map(event => {
                    const { x, y } = transformCoordinateSys(event, this.canvasRef.current);
                    const vector = new Vector3(x, y, 0);
                    // console.log(vector);
                    vector.unproject(this.camera);
                    // console.log(this.camera.projectionMatrixInverse)
                    // console.log(this.camera.matrixWorld)
                    return vector;
                }),
            ).subscribe(this.handleDraw);
            console.log(this.camera);
        }
    }
    handleDraw = point => {
        this.drawPath.push(point);
        console.log(this.drawPath);
        switch (this.drawShape) {
            case 'line':
                if (!this.drawObj) {
                    this.drawObj = new Line(new BufferGeometry(), this.lineBasicMaterial.clone());
                }
                this.drawObj.geometry.setFromPoints(this.drawPath);
                this.drawObj.geometry.verticesNeedUpdate = true;
                this.scene.add(this.drawObj);
                break;
            case 'rect':
                if (this.drawObj) {
                    this.scene.remove(this.drawObj);
                }
                if (this.drawPath.length >= 2) {
                    const line = new Line3(this.drawPath[0], this.drawPath[1]);
                    console.log(line.distance());
                    const path = new Shape();
                    path.moveTo(this.drawPath[0].x, this.drawPath[0].y, this.drawPath[0].z);
                    path.lineTo(this.drawPath[1].x, this.drawPath[0].y, this.drawPath[0].z);
                    path.lineTo(this.drawPath[1].x, this.drawPath[1].y, this.drawPath[0].z);
                    path.lineTo(this.drawPath[0].x, this.drawPath[1].y, this.drawPath[0].z);
                    path.lineTo(this.drawPath[0].x, this.drawPath[0].y, this.drawPath[0].z);
                    this.drawObj = new Mesh(new ShapeBufferGeometry(path, 1), this.meshBasicMaterial.clone());
                    this.drawObj.translateZ(this.drawPath[0].z);
                    this.scene.add(this.drawObj);
                    // const rectObj = new ExtrudeBufferGeometry(path, { 	steps: 2,
                    //     depth: 16,
                    //     bevelEnabled: true,
                    //     bevelThickness: 1,
                    //     bevelSize: 1,
                    //     bevelSegments: 1 });
                    // // rectObj.center();
                    // this.drawObj = new Mesh(rectObj, this.meshBasicMaterial.clone());
                    // // this.drawObj.translateZ(this.drawPath[0].z);
                    // // console.log('x:', (this.drawPath[0].x + this.drawPath[1].x) / 2);
                    // const x = new Vector3((this.drawPath[0].x + this.drawPath[1].x) / 2, (this.drawPath[0].y + this.drawPath[1].y) / 2, 0);
                    // // // x.sub(this.camera.position).normalize();
                    // x.unproject(this.camera);
                    // // // const distance = -this.camera.position.z / x.z;
                    // // // const pos = this.camera.position.clone().add(x.multiplyScalar(distance));
                    // console.log(x.unproject(this.camera));
                    // this.drawObj.position.x = 0;
                    // this.drawObj.position.y = 0;
                    // this.drawObj.position.z =0;
                    // this.scene.add(this.drawObj);
                    this.draw = false;
                }
                break;
            case 'polygon':
                if (this.drawObj) {
                    this.scene.remove(this.drawObj);
                }
                if (this.drawPath.length >= 3) {
                    const path = new Shape();
                    path.moveTo(this.drawPath[0].x, this.drawPath[0].y, this.drawPath[0].z);
                    for (let i = 1; i< this.drawPath.length && i < 19; i++) {
                        path.lineTo(this.drawPath[i].x, this.drawPath[i].y, this.drawPath[0].z);
                    }
                    path.lineTo(this.drawPath[0].x, this.drawPath[0].y, this.drawPath[0].z);
                    this.drawObj = new Mesh(new ShapeBufferGeometry(path), this.meshBasicMaterial.clone());
                    this.drawObj.translateZ(this.drawPath[0].z);
                    this.scene.add(this.drawObj);
                }
                break;
            case 'circle':
                break;
            default:
                break;
        }
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
        console.log('aaa');
        const { type, data } = action;
        if (type === 'draw') {
            this.draw = true;
            this.orbitControls.enableRotate = false;
            console.log(this.orbitControls);
            // this.orbitControls.enabled = false;
            // this.orbitControls.maxPolarAngle = this.orbitControls.minPolarAngle = Math.PI / 2;
            // this.orbitControls.maxAzimuthAngle = this.orbitControls.minAzimuthAngle = 0;
        } else if (type === 'undraw') {
            this.orbitControls.enableRotate = true;
            this.draw = false;
        }
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
