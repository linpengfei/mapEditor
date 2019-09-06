/**
 * @author:lpf
 * @flow
 *
 **/
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { OBJLoader2 } from "three/examples/jsm/loaders/OBJLoader2";
import { MtlObjBridge } from "three/examples/jsm/loaders/obj2/bridge/MtlObjBridge";
import { TDSLoader } from "three/examples/jsm/loaders/TDSLoader";
import { LoaderUtils, LoadingManager } from  'three';
const MAP_NAMES = [
  'map',
  'aoMap',
  'emissiveMap',
  'glossinessMap',
  'metalnessMap',
  'normalMap',
  'roughnessMap',
  'specularMap',
];
export function loadGltfModel(url, rootPath, assetMap) {
  const baseURL = LoaderUtils.extractUrlBase(url);
  return new Promise((resolve, reject) => {
    
    const manager = new LoadingManager();
    
    // Intercept and override relative URLs.
    manager.setURLModifier((url, path) => {
      
      const normalizedURL = rootPath + url
        .replace(baseURL, '')
        .replace(/^(\.?\/)/, '');
      console.log(normalizedURL);
      if (assetMap.has(normalizedURL)) {
        const blob = assetMap.get(normalizedURL);
        const blobURL = URL.createObjectURL(blob);
        blobURLs.push(blobURL);
        return blobURL;
      }
      console.log(blobURLs);
      
      return (path || '') + url;
      
    });
    
    const loader = new GLTFLoader(manager);
    loader.setCrossOrigin('anonymous');
    loader.setDRACOLoader( new DRACOLoader() );
    const blobURLs = [];
    
    loader.load(url, (gltf) => {
      
      const scene = gltf.scene || gltf.scenes[0];
      const clips = gltf.animations || [];
      // this.setContent(scene, clips);
      
      blobURLs.forEach(URL.revokeObjectURL);
      
      // See: https://github.com/google/draco/issues/349
      // THREE.DRACOLoader.releaseDecoderModule();
      
      resolve({ scene, clips, gltf });
      
    }, undefined, reject);
    
  });
}


export function loadObjModel(url, mtlUrl, rootPath, assetMap) {
  const baseURL = LoaderUtils.extractUrlBase(url);
  return new Promise((resolve, reject) => {
    
    const manager = new LoadingManager();
    const blobURLs = [];
    // Intercept and override relative URLs.
    manager.setURLModifier((url, path) => {
      
      const normalizedURL = rootPath + url
        .replace(baseURL, '')
        .replace(/^(\.?\/)/, '');
      console.log(normalizedURL);
      if (assetMap.has(normalizedURL)) {
        const blob = assetMap.get(normalizedURL);
        const blobURL = URL.createObjectURL(blob);
        blobURLs.push(blobURL);
        return blobURL;
      }
      console.log(blobURLs);
      return (path || '') + url;
      
    });
    const onLoad = (scene) => {
      console.log(scene);
      // this.setContent(scene, clips);
  
      blobURLs.forEach(URL.revokeObjectURL);
  
      // See: https://github.com/google/draco/issues/349
      // THREE.DRACOLoader.releaseDecoderModule();
  
      resolve({ scene, clips: [] });
  
    };
    const objLoader2 = new OBJLoader2();
    if (mtlUrl) {
      let mtlLoader = new MTLLoader(manager);
      mtlLoader.load( mtlUrl, mtlParseResult => {
        objLoader2.setLogging(true, true);
        objLoader2.addMaterials( MtlObjBridge.addMaterialsFromMtlLoader( mtlParseResult ) );
        objLoader2.load( url, onLoad, null, reject, null );
      });
    } else {
      objLoader2.setLogging(true, true);
      objLoader2.load( url, onLoad, null, reject, null );
    }
  });
}

export function load3DSModel(url, rootPath, assetMap) {
  const baseURL = LoaderUtils.extractUrlBase(url);
  return new Promise((resolve, reject) => {
    
    const manager = new LoadingManager();
    const blobURLs = [];
    // Intercept and override relative URLs.
    manager.setURLModifier((url, path) => {
      
      const normalizedURL = rootPath + url
        .replace(baseURL, '')
        .replace(/^(\.?\/)/, '');
      console.log(normalizedURL);
      if (assetMap.has(normalizedURL)) {
        const blob = assetMap.get(normalizedURL);
        const blobURL = URL.createObjectURL(blob);
        blobURLs.push(blobURL);
        return blobURL;
      }
      console.log(blobURLs);
      return (path || '') + url;
      
    });
    const onLoad = (scene) => {
      console.log(scene);
      // this.setContent(scene, clips);
      
      // blobURLs.forEach(URL.revokeObjectURL);
      
      // See: https://github.com/google/draco/issues/349
      // THREE.DRACOLoader.releaseDecoderModule();
      
      resolve({ scene, clips: [] });
      
    };
    const tdsLoader = new TDSLoader(manager);
    tdsLoader.load( url, onLoad);
  });
}