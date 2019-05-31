/**
 * @author:lpf
 * @flow
 *
 **/
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
