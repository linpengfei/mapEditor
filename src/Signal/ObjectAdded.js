/**
 * @author:lpf
 * @flow
 *
 **/
import { Observable, Subject} from "rxjs";
export type ObjectAddedData = {
  type: string,
  data: {},
};
const objectAddSub = new Subject<ObjectAddedData>();
function dispatch(object: ObjectAddedData) {
  objectAddSub.next(object);
}

function subscribe(): Observable<ObjectAddedData> {
  return objectAddSub.asObservable();
}

export default { dispatch, subscribe };