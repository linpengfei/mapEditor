/**
 * @author:lpf
 * @flow
 *
 **/
import { Observable, Subject} from "rxjs";
const objectSelectedSub = new Subject<Object>();

function dispatch(object: Object) {
  objectSelectedSub.next(object);
}

function subscribe(): Observable {
  return objectSelectedSub.asObservable();
}
export default { dispatch, subscribe };