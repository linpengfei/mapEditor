/**
 * @author:lpf
 * @flow
 *
 **/
import { Observable, Subject} from "rxjs";
const transformModelChangeSub = new Subject<Object>();

function dispatch(object: Object) {
  transformModelChangeSub.next(object);
}

function subscribe(): Observable {
  return transformModelChangeSub.asObservable();
}
export default { dispatch, subscribe };