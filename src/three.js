/**
 * @author:lpf
 * @flow
 *
 **/
import React, { Component } from 'react';
import * as THREE from 'three';
import WEBGL from './WebGL';
// import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
// import { MapControls } from 'three/examples/jsm/controls/MapControls';
import { TransformControls } from './TransformControls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {CameraHelper} from "three";
type
Props = {};
type
State = {};

export default class Three extends Component<Props, State> {
    static defaultProps = {};
    containerRef: Object;
    canvasRef: Object;
    cameraControls: Object;
    scene: Object;
    camera: Object;
    renderer: Object;
    constructor(props) {
        super(props);
        this.state = {};
        this.containerRef = React.createRef();
        this.canvasRef = React.createRef();
        this.scene = new THREE.Scene();
        // this.cameraControls = new THREE.Track
    }

    componentDidMount(): void {
        console.log(this.containerRef);
        if (this.containerRef.current) {
            // console.log(aa);
            const canvas = this.canvasRef.current;
            const { clientHeight, clientWidth } = canvas;
            this.camera = new THREE.PerspectiveCamera(100, clientWidth / clientHeight, 1, 1000);
            if (WEBGL.isWebGL2Available()) {
                console.log('webgl2');
                const context = canvas.getContext('webgl2');
                this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, context });
            } else {
                this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
            }
            this.renderer.setPixelRatio( window.devicePixelRatio );
            var geometry = new THREE.BoxGeometry( 1, 1, 1 );
            var material = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.DoubleSide } );
            // material.side = THREE.DoubleSide;
            var cube = new THREE.Mesh( geometry, material );
            cube.translateY(0.5);
            const control = new TransformControls( this.camera, canvas );
            control.addEventListener( 'change', () => {this.renderer.render(this.scene, this.camera);} );

            control.addEventListener( 'dragging-changed', event => {
                console.log(event);
                this.cameraControls.enabled = ! event.value;
                // orbit.enabled = ! event.value;

            } );
            control.attach( cube );
            // cube.position.x = 2;
            // this.scene.rotateX(Math.PI / 2);
            // this.scene.rotateZ(Math.PI / 3);
            var planeGeometry = new THREE.PlaneGeometry( 20, 20, 1, 1);
            var planeMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} );
            var plane = new THREE.Mesh( planeGeometry, planeMaterial );
            plane.rotateX(Math.PI / 2);
            this.scene.add( plane );
            this.scene.add( cube );
            // this.scene.add( control );
            // this.scene.add(new THREE.GridHelper( 1000, 1000 ));
            this.scene.add(new THREE.AxesHelper(1000));
            // this.scene.add(new THREE.CameraHelper(this.camera));
            this.camera.position.z = -1000;
            this.camera.lookAt(this.scene.position);
            // this.cameraControls = new OrbitControls(this.camera, this.containerRef.current);
            // this.cameraControls.addEventListener( 'change', render );
            // this.cameraControls.rotateSpeed = 1.0;
            // this.cameraControls.zoomSpeed = 1.2;
            // this.cameraControls.panSpeed = 0.8;
            // this.cameraControls.noZoom = false;
            // this.cameraControls.noPan = false;
            // this.cameraControls.staticMoving = true;
            // this.cameraControls.dynamicDampingFactor = 0.3;
            // this.cameraControls.addEventListener('change', () => {
            //     this.renderer.render(this.scene, this.camera);
            // });
            // this.cameraControls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
            // this.cameraControls.dampingFactor = 0.25;
            //
            // this.cameraControls.screenSpacePanning = false;

            // this.cameraControls.minDistance = 100;
            // this.cameraControls.maxDistance = 500;

            // this.cameraControls.maxPolarAngle = Math.PI / 2;
            this.renderer.setSize(clientWidth, clientHeight);
            this.renderer.setClearColor(new THREE.Color(0xEEEEEE));
            this.renderer.render(this.scene, this.camera);
            this.scene.add(new CameraHelper(this.camera));
            this.animate();
            console.log(this.renderer.info);
        }
    }
    animate = () => {
        requestAnimationFrame(this.animate);
        // this.cameraControls.update();
        this.renderer.render(this.scene, this.camera);
    };
    render() {
        return <div ref={this.containerRef} className="threeContainers">
            <canvas ref={this.canvasRef} className="canvasContent"/>
        </div>;
    }
}
