/**
 * @author:lpf
 * @flow
 *
 **/
import { Observable, Subject} from "rxjs";
const objectRemovedSub = new Subject<Object>();

function dispatch(object: Object) {
  objectRemovedSub.next(object);
}

function subscribe(): Observable {
  return objectRemovedSub.asObservable();
}
export default { dispatch, subscribe };