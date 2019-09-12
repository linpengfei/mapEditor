/**
 * @author:lpf
 * @flow
 *
 **/
import { Observable, Subject} from "rxjs";
const objectAttrSub = new Subject<Object>();

function dispatch(object: Object) {
  objectAttrSub.next(object);
}

function subscribe(): Observable {
  return objectAttrSub.asObservable();
}

export default { dispatch, subscribe };