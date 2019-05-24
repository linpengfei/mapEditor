/**
 * @author:lpf
 * @flow
 *
 **/
import { Observer, Subject } from "rxjs/index";
import { distinct } from 'rxjs/operators';
type data = {
    type: string,
    data: Object,
}
const drawSignalSubject = new Subject<data>();

export function sendDrawSignal(actionData: data) {
    console.log(actionData);
    drawSignalSubject.next(actionData);
}

export function getDrawSignal(): Observer {
    return drawSignalSubject.asObservable();
}
