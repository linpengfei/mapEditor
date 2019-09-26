/**
 * @author:lpf
 * @flow
 *
 **/
import { Observable, Subject} from "rxjs";
export type MenuClickedData = {
  type: string,
  data: {},
};
const menuClickedSub = new Subject<MenuClickedData>();
function dispatch(object: MenuClickedData) {
  menuClickedSub.next(object);
}

function subscribe(): Observable<MenuClickedData> {
  return menuClickedSub.asObservable();
}

export default { dispatch, subscribe };