/**
 * @author:lpf
 * @flow
 *
 **/
import { Observable, BehaviorSubject } from "rxjs";
import defaultConfig from '../Config';
let config = JSON.parse(JSON.stringify(defaultConfig));
export type ConfigData = {
  scene?: { width: number, height: number, scale: number, name: string },
  extrudeSettings?: {
    step: number,
    depth: number,
    curveSegments: number,
    bevelEnable: boolean,
  },
  baseMap?: File,
};
const menuClickedSub = new BehaviorSubject<ConfigData>(config);
function modify(object: ConfigData) {
  config = Object.assign(config, object);
  menuClickedSub.next(config);
}

function subscribe(): Observable<ConfigData> {
  return menuClickedSub.asObservable();
}

export default { modify, subscribe };