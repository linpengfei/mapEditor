/**
 * @author:lpf
 * @flow
 *
 **/
import { Observable, Subject} from "rxjs";
const objectAddSub = new Subject<Object>();

function dispatch(object: Object) {
  objectAddSub.next(object);
}

function subscribe(): Observable {
  return objectAddSub.asObservable();
}

export default { dispatch, subscribe };