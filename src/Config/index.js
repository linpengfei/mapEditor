/**
 * @author:lpf
 * @flow
 *
 **/
const meun = [{
  key: 'file',
  label: '文件',
  children: [{
    
  }]
}];

const extrudeSettings = {
  steps: 1,
  depth: 100,
  curveSegments: 100,
  bevelEnabled: false,
};
const scene = {
  width: 0,
  height: 0,
  scale: 1,
  name: 'scene',
};

export default { scene, extrudeSettings };