/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';
import "./index.scss";
import Stats from "stats.js";
import {
  AmbientLight,
  AxesHelper,
  BoxBufferGeometry,
  BoxHelper,
  CameraHelper,
  CircleBufferGeometry,
  Clock,
  CylinderBufferGeometry,
  ExtrudeBufferGeometry,
  GridHelper,
  Group,
  Material,
  Math as _Math,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneBufferGeometry,
  Raycaster,
  Scene,
  SphereBufferGeometry, Sprite, SpriteMaterial, Texture,
  Vector2,
  Vector3,
  WebGLRenderer
} from "three";
import { WEBGL } from "three/examples/jsm/WebGL";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ObjectRemoved, ObjectSelected, ObjectChanged, ObjectAdded } from '../Signal';
import {fromEvent, partition, Subject, Subscription} from "rxjs";
import {throttleTime, map, distinct, filter} from "rxjs/operators";
import { traverseMaterials, GTLF_MAP_NAMES, transformCoordinateSys, generatePath, generateTextMark} from "../utils";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import OperationPanel from "./OperationPanel";
import {getDrawSignal} from "../actionPlane/DrawSinglServer";
import { extrudeSettings } from '../Config';
import debounce from 'lodash/debounce';
type Props = {};
type State = {
  error: boolean,
};
type SceneData = {
  scale: number, // m/px
  width: number, // m
  height: number, // m
};
class index extends Component<Props, State> {
  static defaultProps = {};
  containerRef: Object;
  canvasRef: Object;
  stats: Object; // 性能检测工具
  operation: string; // 操作模式
  draw: boolean; // 绘制模式
  scene: Object; // 场景
  basePlane: Object; // 基本面，地平面
  camera: Object; // 相机
  light: Object; // 灯光
  selected: Object; // 选中物体
  selectedBoxHelper: Object; // 选中物体包围盒辅助对象
  objGroup: Object; // 存放绘制对象
  drawTempObj: Object; // 绘制对象缓存
  drawPath: Array<Vector3>; // 绘制路径
  mixer: Object; // 动画混合器
  clips: Object; // 动画控制器
  clock: Object; // 时钟
  rayCaster: Object; // 光线处理
  renderer: Object;  // 渲染器
  controls: Object; // 控制器
  selectControl: TransformControls; // 选中物体控制器
  materialMap: Map<string, Material>; // 材质缓存
  sceneData: SceneData; // 场景相关数据
  subscription: Subscription; // 事件订阅处理
  clearPathSignal: Subject;
  handObjectChange: {[key: string]: Function};
  constructor(props: Props) {
    super(props);
    this.state = {
      error: false,
    };
    this.canvasRef = React.createRef();
    this.containerRef = React.createRef();
    this.materialMap = new Map();
    this.clearPathSignal = new Subject();
    this.handObjectChange = {
      path: this.onPathChange,
      geometry: this.onGeometryChange,
      material: this.onMaterialChange,
    };
  }
  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { error: true };
  }
  componentDidMount(): * {
    if (!WEBGL.isWebGLAvailable()) {
      throw new Error('not support webgl!');
    } else {
      this.initStats(this.containerRef.current);
      const canvas = this.canvasRef.current;
      if (!canvas) {
        throw new Error('dom element init failed!');
      }
      this.clock = new Clock();
      const { clientHeight, clientWidth } = canvas;
      this.sceneData = { width: clientWidth, height: clientHeight, scale: 1 };
      // this.initPerspectiveCamera(clientWidth, clientHeight);
      this.initScene();
      this.initOrthographicCamera(clientWidth, clientHeight, 500);
      this.initLight();
      
      // 初始化光线拾取
      this.rayCaster = new Raycaster();
      
      // 初始化对象存储对象
      this.objGroup = new Group();
      this.objGroup.name = 'objGroup';
      this.scene.add(this.objGroup);
      
      // 初始化控制器
      this.initControls();
      this.initSelectControl();
      this.initBoxHelper();
      
      // 初始化事件监听
      this.initMenuActionHandle();
      this.initMouseActionHandle();
      
      // 执行渲染
      this.initRender(canvas);
      this.animate();
    }
  }
  
  componentDidCatch(error: Error, info: { componentStack: string }): * {
    console.log('error:', error);
    console.log('info:', info);
  }
  
  shouldComponentUpdate(): boolean {
    return false;
  }
  
  componentWillUnmount(): * {
    this.subscription.unsubscribe();
  }
  
  // 初始化函数
  initStats = (dom: HTMLElement) => {
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.stats.dom.style.cssText = 'position:absolute;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000';
    dom.appendChild( this.stats.dom );
  };
  initScene = () => {
    this.scene = new Scene();
    this.scene.name = 'Scene';
    const max = Math.max(this.sceneData.width, this.sceneData.height);
    // TODO 背板透明度设置为0
    this.basePlane = new Mesh(new PlaneBufferGeometry(this.sceneData.width * 10, this.sceneData.height * 10), new MeshBasicMaterial({ color: 0xffffff, opacity: 1, transparent: true }));
    // this.basePlane.opacity = 0;
    this.scene.add(this.basePlane);
    const gridHelper = new GridHelper(max, 10);
    gridHelper.rotateX(Math.PI / 2);
    this.scene.add(new AxesHelper(max));
    this.scene.add(gridHelper);
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
    this.scene.add(new CameraHelper(this.camera));
    this.scene.add(this.camera);
  };
  initLight = () => {
    this.light = new AmbientLight(0xffffff, 1);
    // this.light.position.set(-1, -1, 1);
    this.scene.add(this.light);
  };
  initBoxHelper = () => {
    this.selectedBoxHelper = new BoxHelper();
    this.scene.add(this.selectedBoxHelper);
    if (this.selected) {
      this.selectedBoxHelper.setFromObject(this.selected);
      // this.selectedBoxHelper.update();
    }
  };
  initSelectControl = () => {
    this.selectControl = new TransformControls(this.camera, this.canvasRef.current);
    this.selectControl.addEventListener( 'dragging-changed', event => {
      this.controls.enabled = !event.value;
    });
    this.selectControl.addEventListener('objectChange', event => {
      this.selectObject(this.selected);
      this.selectedBoxHelper.update();
    });
    this.selectControl.addEventListener('mouseUp', () => {

    });
    this.scene.add(this.selectControl);
  };
  initRender = (canvas) => {
    if (WEBGL.isWebGL2Available()) {
      console.log('webgl2 enable');
      const context = canvas.getContext('webgl2');
      this.renderer = new WebGLRenderer({ canvas, antialias: true, context });
    } else {
      this.renderer = new WebGLRenderer({ canvas, antialias: true });
    }
    this.renderer.setClearColor('#aaaaaa');
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.gammaOutput = true;
    this.renderer.gammaFactor = 2.2;
    this.renderer.setSize(this.sceneData.width, this.sceneData.height);
    this.renderer.render(this.scene, this.camera);
  };
  initControls = () => {
    this.controls = new OrbitControls(this.camera, this.canvasRef.current);
    this.controls.screenSpacePanning = true;
    console.log(this.controls);
  };
  // 角度限制
  resetControlsRotateAngle(controls) {
    // this.controls.reset();
    this.controls.enableRotate = true;
    this.controls.maxPolarAngle = Math.PI;
    this.controls.minAzimuthAngle = -Math.PI / 2;
    this.controls.maxAzimuthAngle = Math.PI / 2;
  }
  setDrawControlsAngle = () => {
    this.controls.saveState();
    this.controls.minPolarAngle = this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.minAzimuthAngle = this.controls.maxPolarAngle = 0;
    this.controls.enableRotate = false;
  };
  initMouseActionHandle = () => {
    const [drawObserver, selectObserver] = partition(fromEvent(this.canvasRef.current, 'click'), () => this.draw);
    this.subscription.add(selectObserver.pipe(
      throttleTime(500),
      map(event => {
        // Todo 优化，提前获取坐标
        const { x, y } =  transformCoordinateSys(event, this.canvasRef.current);
        const mouse = new Vector2(x, y);
        this.rayCaster.setFromCamera(mouse, this.camera);
        const intersects = this.rayCaster.intersectObjects(this.objGroup.children);
        console.log(intersects);
        if (intersects.length) {
          // const { point } = intersects[0];
          // point.set(Math.round(point.x), Math.round(point.y), Math.round(point.z));
          // point.userData = { positionX, positionY };
          // return point;
          return intersects[0].object;
        }
      })
    ).subscribe(this.selectObject));
    this.subscription.add(
      drawObserver.pipe(
        throttleTime(500),
        distinct(event => event.clientX + ':' + event.clientY, this.clearPathSignal.asObservable()),
        map(this.getPoint),
        filter(res => !!res),
      ).subscribe(this.onDrawClick));
    this.subscription.add(fromEvent(this.canvasRef.current, 'mousemove').pipe(
      filter( () => this.draw && this.drawPath.length),
      distinct(event => event.clientX + ':' + event.clientY, this.clearPathSignal.asObservable()),
      map(this.getPoint),
      filter(res => !!res),
    ).subscribe(this.onDrawMouseMove));
    this.subscription.add(fromEvent(this.canvasRef.current, 'dblclick').pipe(
      filter( () => this.draw && this.drawPath.length),
    ).subscribe(res => this.completeDraw(true)));
  };
  initMenuActionHandle = () => {
    this.subscription = ObjectAdded.subscribe().pipe(
      throttleTime(1000)
    ).subscribe(res => {
      let geometry = null;
      // TODO 抽离参数至配置中
      switch (res.type) {
        case 'box':
          geometry = new BoxBufferGeometry(100,100,100,1,1,1);
          break;
        case 'circle':
          geometry = new CircleBufferGeometry(100,100);
          break;
        case 'cylinder':
          geometry = new CylinderBufferGeometry(100,100,100,100,100);
          break;
        case 'sphere':
          geometry = new SphereBufferGeometry(100,100,100);
          break;
        default:
          break;
      }
      if (geometry) {
        const material = this.getMaterialFromCache('#5bcfff');
        const mesh = new Mesh(geometry, material);
        mesh.userData = res.data;
        this.objGroup.add(mesh);
        this.selectObject(mesh);
      }
    });
    this.subscription.add(ObjectChanged.subscribe().subscribe(res => {
      const { type, data } = res;
      this.handObjectChange[type](data);
    }));
  };
  onPathChange = data => {
    const { path, depth, type } = data;
    console.log('update');
    const drawGeometry = this.drawGraph(type, path, { depth });
    this.selected.userData.depth = depth;
    this.selected.geometry.copy(drawGeometry);
    drawGeometry.dispose();
    this.selectObject(this.selected);
  };
  onGeometryChange = data => {
    const { type } = data;
    let geometry;
    switch (type) {
      case 'box':
        geometry = new BoxBufferGeometry(data.width,data.height,data.depth,data.widthSegments,data.heightSegments,data.depthSegments);
        break;
      case 'circle':
        geometry = new CircleBufferGeometry(data.radius,data.segments, data.thetaStart, data.thetaLength);
        break;
      case 'cylinder':
        geometry = new CylinderBufferGeometry(data.radiusTop,data.radiusBottom,data.height,data.radialSegments, data.heightSegments);
        break;
      case 'sphere':
        geometry = new SphereBufferGeometry(data.radius,data.widthSegments,data.heightSegments, data.phiStart, data.phiLength, data.thetaStart, data.thetaLength);
        break;
      default:
        break;
    }
    geometry.userData = this.selected.geometry.userData;
    this.selected.geometry.copy(geometry);
    geometry.dispose();
    this.selectObject(this.selected);
  };
  onMaterialChange = data => {
    console.log(data);
    const { type, parameters } = data;
    let material;
    switch (type) {
      case 'phong':
        material = new MeshPhongMaterial(parameters);
        break;
      default:
        break;
    }
    const oldMaterial = this.selected.material;
    this.selected.material = material;
    oldMaterial.dispose();
    this.selectObject(this.selected);
  };
  getPoint = (event) => {
    // Todo 优化，提前获取坐标
    const { x, y, positionX, positionY } =  transformCoordinateSys(event, this.canvasRef.current);
    const mouse = new Vector2(x, y);
    this.rayCaster.setFromCamera(mouse, this.camera);
    const intersects = this.rayCaster.intersectObject(this.basePlane);
    if (intersects.length) {
      const { point } = intersects[0];
      point.set(Math.round(point.x), Math.round(point.y), Math.round(point.z));
      point.userData = { positionX, positionY };
      return point;
    }
  };
  onDrawClick = (point: Vector3) => {
    this.drawPath.push(point);
    this.completeDraw();
  };
  onDrawMouseMove = (point: Vector3) => {
    const tempPath = this.drawPath.slice();
    tempPath.push(point);
    this.addDrawObj(tempPath);
  };
  completeDraw = (mask = false)=> {
    if (this.isComplete(mask)) {
      this.addDrawObj();
      this.drawTempObj.userData = { type: this.operation, path: this.drawPath, ...JSON.parse(JSON.stringify(extrudeSettings)) };
      // TODO 控制器位置不对
      // TODO 调整定位或重写控制器相关定位
      // const center = new Vector3();
      // this.drawTempObj.geometry.computeBoundingBox();
      // this.drawTempObj.geometry.boundingBox.getCenter(center);
      // this.drawTempObj.position.copy(center);
      // this.drawTempObj.translateX(center.x * -1);
      // this.drawTempObj.translateY(center.y * -1);
      // this.drawTempObj.translateZ(center.z * -1);
      // console.log(this.drawTempObj);
      this.drawTempObj = null;
      this.drawPath = [];
      this.clearPathSignal.next(true);
    }
  };
  addDrawObj = (drawPath: Array = this.drawPath, depth) => {
    const drawGeometry = this.drawGraph(this.operation, drawPath, { depth });
    if (!this.drawTempObj) {
      this.drawTempObj  = new Mesh(drawGeometry, this.getMaterialFromCache('#696969'));
      // this.drawTempObj.position.copy(center);
      // this.drawTempObj.translate(center.multiplyScalar(-1));
      // this.drawTempObj.
      this.objGroup.add(this.drawTempObj);
    } else {
      this.drawTempObj.geometry.copy(drawGeometry);
      drawGeometry.dispose();
      // this.drawTempObj.position.copy(center);
      // this.drawTempObj.translate(center.multiplyScalar(-1));
      // 设置geometry更新
      // this.drawTempObj.geometry.verticesNeedUpdate = true;
      // this.drawTempObj.geometry.elementsNeedUpdate = true;
      // this.drawTempObj.geometry.uvsNeedUpdate = true;
      // this.drawTempObj.geometry.normalsNeedUpdate = true;
      // this.drawTempObj.geometry.colorsNeedUpdate = true;
      // this.drawTempObj.geometry.groupsNeedUpdate = true;
      // this.drawTempObj.geometry.lineDistancesNeedUpdate = true;
    }
    return this.drawTempObj;
  };
  isComplete = (dblClick = false) => {
    switch (this.operation) {
      case 'line':
      case 'rect':
      case 'circle':
        return this.drawPath.length >= 2;
      case 'polygon':
        return dblClick ? this.drawPath.length >= 3 : this.drawPath.length >= 20;
      case 'path':
        return dblClick && this.drawPath.length;
      default:
        return false;
    }
  };
  drawGraph = (drawShape, drawPath, para) => {
    let geometry = null;
    // const depth = parseFloat( para.height || para.height === 0 ? 0 : 100 || 100);
    // TODO 参数调整
    if (drawShape !== 'mark') {
      const path = generatePath(drawShape, drawPath, this.camera.zoom);
      geometry = new ExtrudeBufferGeometry(path,  { ...extrudeSettings, ...para });
      // geometry.position.setZ(parseFloat(para.z || 0));
      // geometry.userData = { type: drawShape, points: drawPath.slice(), radius: path.radius, z: object3d.position.z, height: depth };
    } else {
      // const mark = { content: '', width: 64, height: 50, placement: '', z: 50 };
      // const texture = new Texture(generateTextMark(mark));
      // texture.needsUpdate = true;
      // geometry = new Sprite(new SpriteMaterial({ map: texture, color: 0xffffff, transparent:true, depthTest: false }));
      // geometry.position.copy(this.drawPath[0]);
      // geometry.scale.set(mark.width, mark.height,1);
      // geometry.userData = { ...mark, type: drawShape, points: drawPath };
    }
    return geometry;
  };
  getMaterialFromCache = (color: string) => {
    let material = this.materialMap.get(color);
    if (material) {
      return material;
    }
    material = new MeshPhongMaterial( { color, flatShading: true } );
    this.materialMap.set(color, material);
    return material;
  };
  destroyActionHandle = () =>{
    this.subscription.unsubscribe();
  };
  selectObject = debounce((object) => {
    this.selected = object;
    object ? this.selectControl.attach(object) : this.selectControl.detach();
    // this.selectControl.attach(object);
    object && this.selectedBoxHelper.setFromObject(object);
    ObjectSelected.dispatch({ type: 'select', data: object });
  }, 500);
  clear = () => {
    if (!this.scene || this.scene.children.length === 0) {
      return false;
    }
    console.log(this.renderer.info);
    // dispose geometry
    this.scene.traverse((node) => {
      if ( !node.isMesh ) return;
      node.geometry.dispose();
    });
    // dispose textures
    traverseMaterials(this.scene, (material) => {
      GTLF_MAP_NAMES.forEach((map) => {
        if (material[map]) material[map].dispose();
      });
      material.dispose();
    });
    console.log(this.renderer.info);
  };
  onOperationClick = ({ type, key }) => {
    this.operation = key;
    this.draw = type === 'draw';
    if (this.draw) {
      this.selectObject(null);
      this.setDrawControlsAngle();
      this.clearDraw();
    } else {
      this.clearDraw();
      this.resetControlsRotateAngle();
    }
  };
  clearDraw = () => {
    this.drawPath = [];
    this.clearPathSignal.next(true);
    if (this.drawTempObj) {
      this.objGroup.remove(this.drawTempObj);
      this.drawTempObj.geometry.dispose();
      this.drawTempObj = null;
    }
  };
  animate = () => {
    const dt = this.clock.getDelta();
    requestAnimationFrame(this.animate);
    // 需要更新
    this.mixer && this.mixer.update(dt);
    this.controls.update();
    this.stats.update();
    this.renderer.render(this.scene, this.camera);
  };
  render() {
    const { error } = this.state;
    if (error) {
      return <div>
        请使用支持webgl的浏览器!
      </div>
    } 
    return <div ref={this.containerRef} className="map-editor-scene">
      <canvas ref={this.canvasRef} className="map-editor-scene-canvas">
        Please use browser support canvas!
      </canvas>
      <OperationPanel onClick={this.onOperationClick} />
    </div>;
  }
}

export default index;