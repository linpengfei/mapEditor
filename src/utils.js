/**
 * @author:lpf
 * @flow
 *
 **/
import { Shape, Vector2 } from  'three';
import Mark from './assets/img/pointMark.svg';
export function getOffsetOfEvent(evt: {clientX: number, clientY: number}, offsetParent: HTMLElement): { x: number, y: number } {
    const isBody = offsetParent === offsetParent.ownerDocument.body

    // 用于获得页面中某个元素的左，上，右和下分别相对浏览器视窗的位置
    const offsetParentRect = isBody ? { left: 0, top: 0 } : offsetParent.getBoundingClientRect()

    const x = evt.clientX + offsetParent.scrollLeft - offsetParentRect.left
    const y = evt.clientY + offsetParent.scrollTop - offsetParentRect.top

    return { x, y }
}
// var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
// vector = vector.unproject(camera);

export function transformCoordinateSys(evt: {clientX: number, clientY: number}, offsetParent: HTMLElement): { x: number, y: number } {
    const offsetParentRect = offsetParent.getBoundingClientRect();
    const width = offsetParentRect.width || offsetParentRect.right - offsetParentRect.left;
    const height = offsetParentRect.height || offsetParentRect.bottom - offsetParentRect.top;
    const positionX = evt.clientX + offsetParent.scrollLeft - offsetParentRect.left;
    const positionY = evt.clientY + offsetParent.scrollTop - offsetParentRect.top;
    const x = (positionX / width * 2 - 1);
    const y = (-positionY / height * 2 + 1);
    return { x, y, positionX, positionY }
}
const imageMark = new Image();
imageMark.src = Mark;
export function generateTextMark(mark, oldCanvas) {
    const { content, width, height, placement } = mark;
    const canvas = oldCanvas ? oldCanvas : document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,width, height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2e8eff';
    ctx.font = "900 20px serif";
    if(placement === 'top') {
        ctx.drawImage(imageMark, width / 2 - 16, height - 32, 32, 32);
        ctx.fillText(content, width / 2, height / 2 - 16, width);
    } else {
        ctx.drawImage(imageMark, width / 2 - 16, 0, 32, 32);
        ctx.fillText(content, width / 2, height / 2 +16, width);
    }
    return canvas;
}
export function saveArrayBuffer( buffer, filename ) {
    save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
}
export function saveString( text, filename ) {
    save( new Blob( [ text ], { type: 'text/plain' } ), filename );
}
function save( blob, filename ) {
    const link = document.createElement( 'a' );
    link.style.display = 'none';
    document.body.appendChild( link ); // Firefox workaround, see #6594
    link.href = URL.createObjectURL( blob );
    link.download = filename;
    link.click();
    document.body.removeChild(link);
    // URL.revokeObjectURL( url ); breaks Firefox...
}

export function generatePath(drawShape: string, drawPath: Array, radius: number, zoom: number) {
    const path = new Shape();
    switch (drawShape) {
        case 'line':
            // 3d
            path.moveTo(drawPath[0].x, drawPath[0].y, 0);
            path.lineTo(drawPath[1].x, drawPath[1].y, 0);
            break;
        case 'rect':
            path.moveTo(drawPath[0].x, drawPath[0].y, 0);
            path.lineTo(drawPath[1].x, drawPath[0].y, 0);
            path.lineTo(drawPath[1].x, drawPath[1].y, 0);
            path.lineTo(drawPath[0].x, drawPath[1].y, 0);
            path.lineTo(drawPath[0].x, drawPath[0].y, 0);
            break;
        case 'polygon':
            path.moveTo(drawPath[0].x, drawPath[0].y, 0);
            for (let i = 1; i < drawPath.length && i < 19; i++) {
                path.lineTo(drawPath[i].x, drawPath[i].y, 0);
            }
            path.lineTo(drawPath[0].x, drawPath[0].y, 0);
            break;
        case 'circle':
            path.moveTo(drawPath[0].x, drawPath[0].y, 0);
            const a = new Vector2(drawPath[0].positionX, drawPath[0].positionY);
            const b = new Vector2(drawPath[1].positionX, drawPath[1].positionY);
            const radiusTemp = parseFloat(radius || (a.distanceTo(b) / zoom));
            path.absarc(drawPath[0].x, drawPath[0].y, radiusTemp, 0, 2* Math.PI);
            path.radius = radiusTemp;
            break;
        default:
            break;
    }
    return path;
}
