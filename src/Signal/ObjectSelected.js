/**
 * @author:lpf
 * @flow
 *
 **/
import { Observable, Subject} from "rxjs";
export type ObjectSelectedData = {
  type: string,
  data: {},
};
const objectSelectedSub = new Subject<ObjectSelectedData>();
function dispatch(object: ObjectSelectedData) {
  objectSelectedSub.next(object);
}

function subscribe(): Observable<ObjectSelectedData> {
  return objectSelectedSub.asObservable();
}
export default { dispatch, subscribe };