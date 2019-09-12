/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';
import "./index.scss";
import Stats from "stats.js";
import {OrthographicCamera, PerspectiveCamera, Vector3} from "three";
type Props = {};
type State = {};

class index extends Component<Props, State> {
  static defaultProps = {};
  containerRef: Object;
  canvasRef: Object;
  stats: Object; // 性能检测工具
  scene: Object; // 场景
  camera: Object; // 相机
  light: Object; // 灯光
  mixer: Object; // 动画混合器
  clips: Object; // 动画控制器
  clock: Object; // 时钟
  rayCaster: Object; // 光线处理
  renderer: Object;  // 渲染器
  controls: Object; // 控制器
  constructor(props: Props) {
    super(props);
    this.state = {};
    this.canvasRef = React.createRef();
    this.containerRef = React.createRef();
  }
  
  shouldComponentUpdate(): boolean {
    return false;
  }
  // 初始化函数
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
  render() {
    return <div ref={this.containerRef} className="map-editor-scene">
      <canvas ref={this.canvasRef} className="map-editor-scene-canvas">
        Please use browser support canvas!
      </canvas>
    </div>;
  }
}

export default index;