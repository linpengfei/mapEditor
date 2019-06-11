/**
 * @author:lpf
 * @flow
 *
 **/
import { Observer, Subject } from "rxjs/index";
import { distinctUntilKeyChanged, throttleTime, debounceTime } from 'rxjs/operators';
type data = {
    type: string,
    points: Array,
    uuid: string,
    height?: number,
    z?: number,
    radius?: number,
    img?: number,
}
const infoSubject = new Subject<data>();
const valueSetSubject = new Subject<data>();
export function sendInfoData(actionData: data) {
    console.log(actionData);
    infoSubject.next(actionData);
}

export function getInfoData(): Observer {
    return infoSubject.asObservable().pipe(
        distinctUntilKeyChanged('uuid')
    );
}

export function sendValueSet(value: data) {
    console.log('valueSet:', value);
    valueSetSubject.next(value);
}

export function getValueSet() {
    return valueSetSubject.asObservable().pipe(
        debounceTime(500)
    )
}
