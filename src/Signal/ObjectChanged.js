/**
 * @author:lpf
 * @flow
 *
 **/
import { Observable, Subject} from "rxjs";
const objectChangedSub = new Subject<Object>();

function dispatch(object: Object) {
  objectChangedSub.next(object);
}

function subscribe(): Observable {
  return objectChangedSub.asObservable();
}
export default { dispatch, subscribe };