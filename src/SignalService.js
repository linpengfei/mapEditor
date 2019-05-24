/**
 * @author:lpf
 * @flow
 *
 **/
import {Observer, Subject} from "rxjs";
import {BoxBufferGeometry, Mesh, MeshStandardMaterial, Vector3} from "three";

type data = {
    type: string,
    data: Object,
};
const actionSignalSubject = new Subject<data>();

export function sendActionSignal(type: string) {
    let actionData = {};
    let mesh = {};
    switch (type) {
        case 'point':
            break;
        case 'line':
            break;
        case 'square':
            actionData.type = 'add';
            mesh = new Mesh( new BoxBufferGeometry( 1, 1, 1, 1, 1, 1 ), new MeshStandardMaterial() );
            mesh.name = 'square';
            mesh.translateY(0.5);
            // mesh.position = new Vector3(0,0,1);
            break;
        case 'rectangle':
            break;
        case 'round':
            break;
        case 'arc':
            break;
        default:
            break;
    }
    actionData.data = mesh;
    actionSignalSubject.next(actionData);
}

export function getActionSignal(): Observer {
    return actionSignalSubject.asObservable();
}

