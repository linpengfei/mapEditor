/**
 * @author:lpf
 * @flow
 *
 **/
import { Observable, Subject} from "rxjs";
type ObjectChangedData  = {
  type: 'path' | 'geometry' | 'material',
  data: {
    path?:Array<{x: number, y: number, z: number}>,
    depth?: number,
    uuid: string,
    type: string,
  }
}
const objectChangedSub = new Subject<ObjectChangedData>();

function dispatch(object: ObjectChangedData) {
  console.log(object);
  objectChangedSub.next(object);
}

function subscribe(): Observable<ObjectChangedData> {
  return objectChangedSub.asObservable();
}
export default { dispatch, subscribe };