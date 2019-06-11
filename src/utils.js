/**
 * @author:lpf
 * @flow
 *
 **/
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
const canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 256;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');
const image = new Image();
image.src = Mark;
export function generateTextMark(text) {
    ctx.clearRect(0,0,256,256);
    ctx.drawImage(image, 96, 0, 64, 64);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    // TODO 后期需要根据文字宽度进行分行显示
    ctx.fillStyle = '#2e8eff';
    ctx.font = "900 56px serif";
    ctx.fillText(text, 128, 128, 256);
    return canvas;
}
