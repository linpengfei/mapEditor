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
  Box3,
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
  CameraHelper,
  ExtrudeGeometry,
  Points,
  PointsMaterial,
  Group,
  Raycaster,
  TextureLoader,
  SpriteMaterial,
  Sprite,
  TextGeometry,
  Font,
  TextBufferGeometry,
  Texture,
  DirectionalLight,
  FrontSide,
  MeshLambertMaterial,
  DirectionalLightHelper,
  MeshDepthMaterial,
  MeshPhysicalMaterial,
  Material,
  MeshPhongMaterial,
  PlaneBufferGeometry,
  AnimationMixer,
  Object3D,
  Clock, AmbientLight, VectorKeyframeTrack, AnimationClip, LoopPingPong, AnimationAction, LoopRepeat,
} from 'three';
import WEBGL from './WebGL';
import { sendActionSignal, getActionSignal } from "./SignalService";
import { sendDrawSignal, getDrawSignal } from "./actionPlane/DrawSinglServer";
import { sendInfoData, getValueSet } from "./infoPlane/InfoCommunicateServer";
import { TransformControls } from './TransformControls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
// import { MapControls } from 'three/examples/jsm/controls/MapControls';
import BgImg from './assets/img/zoneFloor.png';
import fontData from './assets/font/helvetiker_regular.typeface';
import {Subscription, fromEvent, partition} from "rxjs";
import { map, filter, distinct } from 'rxjs/operators';
import { transformCoordinateSys, generateTextMark, saveArrayBuffer, saveString, generatePath } from './utils';
import { Upload, message, Button, Icon } from 'antd';
import {load3DSModel, loadGltfModel, loadObjModel} from './modelImport';
import debounce from 'lodash/debounce';
import Stats from 'stats.js';
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import { Tween } from 'es6-tween';
import {AnimationClipCreator} from "three/examples/jsm/animation/AnimationClipCreator";
type Props = {};
type State = {};
const extrudeSettings = {
    steps: 1,
    depth: 100,
    curveSegments: 100,
    bevelEnabled: false,
};
export default class Sketchpad extends Component<Props, State> {
    static defaultProps = {};
    containerRef: Object;
    canvasRef: Object;
    scene: Object;
    sceneHelpers: Object;
    camera: Object;
    object: Object;
    animations: Object;
    selected: Object;
    helpers: Object;
    light: Object;
    mixer: Object; // 动画控制
    clips: Object; // 帧控制
    clock: Object; // 动画时钟
    // 绘制参数
    drawPath: Array;
    drawShape: string;
    draw: boolean;
    drawObj: Object;
    lineBasicMaterial: Object;
    meshBasicMaterial: Object;
    zBase: number;
    markImg: Object;
    font: Object;
    imgLoader: Object;


    group3D: Object;
    group3DMap: Map;
    selectObject: Object;


    raycaster: Object; // 光线处理
    renderer: Object;
    orbitControls: Object;
    actionSignalSub: Subscription;
    drawSignalSub: Subscription;
    eventSub: Subscription;
    scentSize: Object; // 场景尺寸
    drawData: Object; // 绘图数据
    constructor(props) {
        super(props);
        this.object = {};

        this.animations = {};
        this.selected = null;
        this.helpers = {};



        this.state = {};
        this.containerRef = React.createRef();
        this.canvasRef = React.createRef();
        this.scene = new Scene();
        this.scene.name = 'Scene';
        this.clock = new Clock();
        // this.scene.background = new Color( 0xaaaaaa );
        this.scentSize = {};
        this.group3D = new Group();
        this.group3DMap = new Map<string, string>();
        this.scene.add(this.group3D);
        this.sceneHelpers = new Scene();

    //   共用字体
        this.font = new Font(fontData);
  
        this.clock = new Clock();

    //    标记点图像
        this.markImg = null;
    //    z基准高度
        this.zBase = 5;

    //    基础材质准备
        this.lineBasicMaterial = new LineBasicMaterial({ color: 0x696969, opacity: 0.7, linewidth: 2, depthTest: true });
        // this.meshBasicMaterial = new MeshBasicMaterial({ color: 0x696969,  depthTest: true, shadowSide: FrontSide, transparent: true });
        this.meshBasicMaterial = new MeshPhongMaterial( { color: 0x696969, flatShading: true } )
    }
    initStats = () => {
      this.stats = new Stats();
      this.stats.showPanel(0);
      this.stats.showPanel(2);
      document.body.appendChild( this.stats.dom );
    };
    initPerspectiveCamera = (width: number, height: number) => {
      this.camera = new PerspectiveCamera(45, width / height, 0.01, 10000);
      this.camera.name = '透视相机';
      this.camera.position.set(0,0,500);
      this.camera.up = new Vector3(0,1,0);
      this.camera.lookAt({ x: 0, y: 0, z: 0 });
    };
    initOrthographicCamera = (width: number, height: number, perspective = 500) => {
      this.camera = new OrthographicCamera(-width/2 , width/2, height/2, -height / 2, 0.01, 100000);
      this.camera.name = '正投影相机';
      this.camera.position.set( 0, 0, perspective);
      // this.camera.up = new Vector3(0,1,0);
      this.camera.lookAt({ x: 0, y: 0, z: 0 });
      console.log(this.camera);
    };
    initLight = () => {
      this.light = new AmbientLight(0xffffff, 1);
      // this.light.position.set(-1, -1, 1);
    };
    initModel = () => {
      const loader = new GLTFLoader();
      loader.load( 'http://127.0.0.1:1234/examples/models/gltf/RobotExpressive/RobotExpressive.glb', gltf =>  {
        console.log(gltf);
        gltf.scene.children[0].scale.set(50,50,50);
        gltf.scene.children[0].position.setX(-900);
        gltf.scene.children[0].rotateY(Math.PI / 4);
        const position = gltf.scene.children[0].position;
        // this.tween = new Tween(position).to({ x: 300, y: 0, z: 0 }, 2000).onUpdate(() => {
        //   console.log(position);
        // }).start();
        // console.log(this.tween);
        if (this.mixer) {
          this.mixer.stopAllAction();
          this.mixer.uncacheRoot(this.mixer.getRoot());
          this.mixer = null;
        }
        this.mixer = new AnimationMixer(gltf.scene);
        const activeAction = this.mixer.clipAction(gltf.animations[10]);
        activeAction && activeAction.play();
        const times = [];
        const value = [];
        const point = new Vector3(-900,0,0);
        const step = 1400 / 1000;
        for (let i = 0; i < 1000; i++) {
          times.push(i / 1000);
          point.setX(-900 + i * step).toArray(value, value.length);
        }
        const animationClip = new AnimationClip('move', 1, [new VectorKeyframeTrack('RootNode.position', times, value)]);
        const temp = this.mixer.clipAction(animationClip);
        console.log(temp);
        temp.loop = LoopPingPong;
        // temp.clampWhenFinished = true;
        temp.timeScale = 0.1;
        // temp.setLoop(LoopPingPong);
        temp && temp.reset().play();
        this.scene.add( gltf.scene );
    
        // createGUI( model, gltf.animations );
    
      }, undefined, function ( e ) {
    
        console.error( e );
    
      } );
    };
    initRender = (canvas) => {
      const { clientHeight, clientWidth } = canvas;
      if (WEBGL.isWebGL2Available()) {
        console.log('webgl2');
        const context = canvas.getContext('webgl2');
        this.renderer = new WebGLRenderer({ canvas, antialias: true, context });
      } else {
        this.renderer = new WebGLRenderer({ canvas, antialias: true });
      }
      this.renderer.setClearColor('#aaaaaa');
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.gammaOutput = true;
      this.renderer.gammaFactor = 2.2;
      this.renderer.setSize(clientWidth, clientHeight);
      this.renderer.render(this.scene, this.camera);
    };
    componentDidMount() {
        const canvas = this.canvasRef.current;
        this.initStats();
        if (canvas) {
            const { clientHeight, clientWidth } = canvas;
            this.scentSize = { width: clientWidth, height: clientHeight };
            // this.initPerspectiveCamera(clientWidth, clientHeight);
            this.initOrthographicCamera(clientWidth, clientHeight, 500);
            this.initLight();
            this.scene.add(this.light);
            this.raycaster = new Raycaster();
            this.initRender(canvas);
            this.imgLoader = new ImageBitmapLoader();
            // this.loaderImg(BgImg);
            this.scene.add(new AxesHelper(Math.max(clientHeight, clientWidth)));
            // 增加网格辅助线
            const gridHelper = new GridHelper( Math.max(clientHeight, clientWidth), 100, 0x444444, 0x888888 );
            gridHelper.rotateX(Math.PI / 2);
            this.scene.add(gridHelper);
            this.orbitControls = new OrbitControls(this.camera, this.containerRef.current);
            this.orbitControls.screenSpacePanning = true;
            this.resetControlsRotateAngle(this.orbitControls);
          this.prevTime = 0;
            this.animate();
            this.subscribeSingle();
            // TODO 是否取整需要继续确认
            const [selectObserver, drawObserver] = partition(fromEvent(this.canvasRef.current, 'click'), () => this.draw);
            this.eventSub = selectObserver.pipe(
                filter(() => !this.isComplete()),
                distinct(event => event.clientX + ':' + event.clientY, getDrawSignal()),
                map(event => {
                    const { x, y, positionX, positionY } = transformCoordinateSys(event, this.canvasRef.current);
                    const vector = new Vector3(x, y);
                    vector.unproject(this.camera);
                    vector.setZ(0);
                  console.log(vector);
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
                filter(() => this.draw && this.drawPath.length && this.drawShape !== 'mark'),
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
            // TODO remove
            this.initModel();
        }
        console.log(this.renderer);
    }
    loaderImg = img => {
        const basePlane = this.scene.getObjectByName('baseMapPlane');
        if (basePlane) {
            this.scene.remove(basePlane);
            basePlane.material.dispose();
            basePlane.geometry.dispose();
            basePlane.material.map.dispose();
        }
        this.imgLoader && this.imgLoader.load(img, imageBitMap => {
            const texture = new CanvasTexture( imageBitMap );
            const material = new MeshBasicMaterial( { map: texture } );
            const { width, height } = imageBitMap;
            this.scentSize = { width, height };
            const planeGeometry = new PlaneGeometry( width, height, 1, 1);
            const plane = new Mesh( planeGeometry, material );
            plane.position.setZ(0);
            plane.rotateZ(Math.PI);
            plane.name = 'baseMapPlane';
            this.scene.add( plane );
        });
    };
    exportGltf = () => {
        const exporter = new GLTFExporter();
        exporter.parse(this.group3D, gltf => {
            console.log(gltf);
            gltf.asset.sceneSize = this.scentSize;
            if ( gltf instanceof ArrayBuffer ) {
                saveArrayBuffer( gltf, 'scene.glb' );
            } else {
                var output = JSON.stringify( gltf, null, 2 );
                console.log( output );
                saveString( output, 'scene.gltf' );
            }
        });
    };
    changeObject = changeData => {
        console.log(changeData);
        const { type: actionType, data } = changeData;
        const { uuid, type, points, radius, height, z } = data;
        // const path = this.generatePath(type, points);
        const itemUuid = this.group3DMap.get(uuid);
        const item = this.group3D.getObjectByProperty('uuid', itemUuid);
        if (actionType === 'modify') {
            if (type !== 'mark') {
                this.group3D.remove(item);
                item.geometry.dispose();
                const object = this.drawGraph(type, points, { height, z, radius});
                object.castShadow = true;
                object.material = item.material;
                object.userData.uuid = uuid;
                this.group3D.add(object);
                this.group3DMap.set(uuid, object.uuid);
            } else {
                item.userData = { ...item.userData, ...data };
                item.position.set(points[0].x, points[0].y, z);
                generateTextMark(data, item.material.map.image);
                item.material.map.needsUpdate = true;
            }
        } else if(actionType === 'delete') {
            item.geometry && item.geometry.dispose();
            if (type === 'mark') {
                item.material.map && item.material.dispose();
            }
            this.group3D.remove(item);
            sendInfoData({})
        }


    };
    getSelectObject = point => {
        this.raycaster.setFromCamera(point, this.camera);
        const intersects = this.raycaster.intersectObjects(this.group3D.children);
        if (intersects.length) {
            const [select] = intersects;
            if (!select.object.isSprite) {
                for (const x of this.group3D.children) {
                    console.log(x.material === this.meshBasicMaterial);
                    if (x.material !== this.meshBasicMaterial && !x.isSprite) {
                        x.material.dispose();
                        x.material = this.meshBasicMaterial;
                    }
                }
                this.select(select.object);
            } else {
                this.selectObject = select.object;
            }
            sendInfoData(select.object.userData);
        }
    };
    select = (object) => {
        this.selectObject = object;
        object.material = this.meshBasicMaterial.clone();
        object.material.color = new Color(0xff0000);
    };
    unselect = () => {
        if (this.selectObject) {
            this.selectObject.material = this.meshBasicMaterial.clone();
            this.selectObject = null;
        }
    };
    isComplete = (dblClick = false) => {
        switch (this.drawShape) {
            case 'line':
            case 'rect':
            case 'circle':
                return this.drawPath.length >= 2;
            case 'polygon':
                return dblClick ? this.drawPath.length >= 3 : this.drawPath.length >= 20;
            case 'mark':
                return this.drawPath.length;
            default:
                return false;
        }
    };
    // z 设置为5跟平面对齐
    drawGraph = (drawShape, drawPath, para = { height: 100, z: 0, radius: null, }) => {
        let object3d = null;
        const depth = parseFloat( para.height || para.height === 0 ? 0 : 100 || 100);
        if (drawShape !== 'mark') {
            const path = generatePath(drawShape, drawPath, para.radius, this.camera.zoom );
            object3d = new Mesh(new ExtrudeBufferGeometry(path, { ...extrudeSettings, depth }), this.meshBasicMaterial);
            object3d.position.setZ(parseFloat(para.z || 0));
            object3d.userData = { type: drawShape, points: drawPath.slice(), radius: path.radius, z: object3d.position.z, height: depth };
        } else {
            const mark = { content: '', width: 64, height: 50, placement: '', z: 50 };
            const texture = new Texture(generateTextMark(mark));
            texture.needsUpdate = true;
            object3d = new Sprite(new SpriteMaterial({ map: texture, color: 0xffffff, transparent:true, depthTest: false }));
            object3d.position.copy(this.drawPath[0]);
            object3d.scale.set(mark.width, mark.height,1);
            object3d.userData = { ...mark, type: drawShape, points: drawPath };
        }
        return object3d;
    };

    handleDrawClick = point => {
        this.drawPath.push(point);
        this.completeDraw();
    };
    handleDrawMouseMove = point => {
        if (!this.drawPath.length) {
            return;
        }
        const tempPath = this.drawPath.slice();
        tempPath.push(point);
        if (this.drawObj) {
            this.scene.remove(this.drawObj);
            this.drawObj.geometry.dispose();
        }
        this.drawObj = this.drawGraph(this.drawShape, tempPath);
        this.scene.add(this.drawObj);
    };
    completeDraw = (mask = false)=> {
        if (this.isComplete(mask)) {
            if (this.drawObj) {
                this.scene.remove(this.drawObj);
                this.drawObj.geometry.dispose();
            }
            const object = this.drawGraph(this.drawShape, this.drawPath, this.drawData);
            const uuid = _Math.generateUUID();
            object.userData.uuid = uuid;
            // object.object3d.userData.height = object.object3d.geometry.parameters.depth;
            // object.object3d.userData.z = object.object3d.position.z;
            this.group3D.add(object);
            this.group3DMap.set(uuid, object.uuid);
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
            this.unselect();
            this.draw = true;
            this.drawData = data;
            this.orbitControls.enableRotate = false;
            // this.orbitControls.enabled = false;
            this.orbitControls.maxPolarAngle = this.orbitControls.minPolarAngle = Math.PI / 2;
            this.orbitControls.maxAzimuthAngle = this.orbitControls.minAzimuthAngle = 0;
        } else if (type === 'undraw') {
            console.log('undraw');
            if (this.drawObj) {
                this.scene.remove(this.drawObj);
            }
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
        this.markImg = data.img;
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
    animate = (time) => {
      const dt = this.clock.getDelta();
        requestAnimationFrame(this.animate);
        // 需要更新
      this.tween && this.tween.update(dt);
        this.mixer && this.mixer.update(dt);
        this.orbitControls.update();
        this.stats.update();
        this.renderer.render(this.scene, this.camera);
        this.prevTime = time;
    };
    onMapChange = file => {
        console.log(file);
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            this.loaderImg(reader.result);
        });
        reader.readAsDataURL(file);
        return false;
    };
  upLoadMap = (file, files) => {
    console.log(files);
    this.loadingModel(files);
    return false;
  };
  loadingModel = debounce((files) => {
    let rootFile, rootPath, type, mltUrl;
    const fileMap = new Map();
    files.forEach(file => {
      const { name, webkitRelativePath } = file;
      if (name.match(/\.(gltf|glb)$/i)) {
        type = 'gltf';
        rootFile = file;
        rootPath = '/' + webkitRelativePath.replace(file.name, '');
      } 
      if(name.match(/\.obj$/i)) {
        type = 'obj';
        rootFile = file;
        rootPath = '/' + webkitRelativePath.replace(file.name, '');
      }
      if(name.match(/\.mtl$/i)) {
        // type = 'obj';
        mltUrl = file;
      }
      if(name.match(/\.3ds$/i)) {
        type = '3ds';
        rootFile = file;
        rootPath = '/' + webkitRelativePath.replace(file.name, '');
        console.log(rootPath);
      }
      fileMap.set('/' + webkitRelativePath, file);
    });
    console.log(fileMap);
    if (!rootFile) {
      message.error('No model asset found.');
      return false;
    }
//    TODO 加载模型之前清除已有场景
    const fileURL = typeof rootFile === 'string'
      ? rootFile
      : URL.createObjectURL(rootFile);
    mltUrl && (mltUrl = URL.createObjectURL(mltUrl));
    type === 'gltf' && loadGltfModel(fileURL, rootPath, fileMap).then(res => {
      if (typeof rootFile === 'object') URL.revokeObjectURL(fileURL);
      this.setContent(res);
      console.log(res);
    });
    type === 'obj' && loadObjModel(fileURL, mltUrl, rootPath, fileMap).then(res => {
      if (typeof rootFile === 'object') URL.revokeObjectURL(fileURL);
      this.setContent(res);
      console.log(res);
    });
    type === '3ds' && load3DSModel(fileURL, rootPath, fileMap).then(res => {
      if (typeof rootFile === 'object') URL.revokeObjectURL(fileURL);
      this.setContent(res);
      console.log(res);
    });
}, 1000);
  setContent ({ scene: object, clips} ) {
    
    // this.clear();
    
    const box = new Box3().setFromObject(object);
    const size = box.getSize(new Vector3()).length();
    const center = box.getCenter(new Vector3());
    
    // this.controls.reset();
    
    object.position.x += (object.position.x - center.x);
    object.position.y += (object.position.y - center.y);
    object.position.z += (object.position.z - center.z);
    // this.controls.maxDistance = size * 10;
    // 透视相机调整参数至模型可见
    // this.defaultCamera.near = size / 100;
    // this.defaultCamera.far = size * 100;
    // this.defaultCamera.updateProjectionMatrix();
    
    // if (this.options.cameraPosition) {
    //  
    //   this.defaultCamera.position.fromArray( this.options.cameraPosition );
    //   this.defaultCamera.lookAt( new THREE.Vector3() );
    //  
    // } else {
    //  
    //   this.defaultCamera.position.copy(center);
    //   this.defaultCamera.position.x += size / 2.0;
    //   this.defaultCamera.position.y += size / 5.0;
    //   this.defaultCamera.position.z += size / 2.0;
    //   this.defaultCamera.lookAt(center);
    //  
    // }
    
    // this.setCamera(DEFAULT_CAMERA);
    
    console.log(object);
    // this.controls.saveState();
    
    this.scene.add(object);
    // this.content = object;
    
    // this.state.addLights = true;
    // this.content.traverse((node) => {
    //   if (node.isLight) {
    //     this.state.addLights = false;
    //   }
    // });
    
    this.setClips(clips, object);
    object.traverse((node) => {
      if (node.isLight) {
        // this.state.addLights = false;
        console.log(node);
      }
    });
    // this.updateLights();
    // this.updateGUI();
    // this.updateEnvironment();
    // this.updateTextureEncoding();
    // this.updateDisplay();
    
  }
  setClips ( clips, object ) {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.mixer.getRoot());
      this.mixer = null;
    }
    
    this.clips = clips;
    if (!clips.length) return;
    
    this.mixer = new AnimationMixer(object);
    this.clips.forEach((clip, index) => {
      if (index === 0) {
        const action = this.mixer.clipAction(clip);
        action.play();
      }
      // this.mixer.clipAction(clip).play();
    });
    this.clock.getElapsedTime();
  }
    render() { 
        return <div ref={this.containerRef} className="sketchpadContainers">
            <canvas ref={this.canvasRef} className="canvasContent">
                Please use browser support canvas!
            </canvas>
            <button onClick={this.exportGltf} className="exportButton">export</button>
            <div className="uploadMap">
                <Upload name="file" beforeUpload={this.onMapChange} showUploadList={false}>
                    <Button>
                        <Icon type="upload" /> 上传底图
                    </Button>
                </Upload>
              <Upload name="file" beforeUpload={this.upLoadMap} showUploadList={false} directory={true}>
                <Button>
                  <Icon type="upload" /> 上传模型
                </Button>
              </Upload>
            </div>
        </div>;
    }
}
