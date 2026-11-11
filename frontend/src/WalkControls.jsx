import {useEffect, useRef} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import {Euler, Raycaster, Vector2} from 'three';
import {canWalk, ENTRANCE} from './storeLayout';

export default function WalkControls({products, onSelect, fixtures, marker, needle, touchKeys}) {
  const {camera, gl, scene} = useThree();
  const keys = useRef(new Set());
  const rotation = useRef(new Euler(0, 0, 0, 'YXZ'));
  const ray = useRef(new Raycaster());

  useEffect(() => {
    const canvas = gl.domElement;
    camera.position.set(...ENTRANCE);
    rotation.current.set(-.035, 0, 0);
    camera.rotation.copy(rotation.current);
    const previousTabIndex = canvas.tabIndex;
    canvas.tabIndex = 0;
    canvas.focus();
    let drag = null;
    function down(event) {
      canvas.focus();
      drag = {id: event.pointerId, x: event.clientX, y: event.clientY};
      canvas.setPointerCapture(event.pointerId);
    }
    function move(event) {
      if (drag?.id !== event.pointerId) return;
      rotation.current.y -= (event.clientX - drag.x) * .005;
      rotation.current.x = Math.max(-1.25, Math.min(1.25,
        rotation.current.x - (event.clientY - drag.y) * .005));
      camera.rotation.copy(rotation.current);
      drag = {...drag, x: event.clientX, y: event.clientY};
    }
    function end() { drag = null; }
    function keydown(event) {
      if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE'].includes(event.code)) {
        event.preventDefault();
        keys.current.add(event.code);
      }
    }
    function keyup(event) { keys.current.delete(event.code); }
    function blur() { keys.current.clear(); end(); }
    const listeners = {pointerdown: down, pointermove: move, pointerup: end,
      pointercancel: end, keydown, keyup, blur};
    for (const [name, handler] of Object.entries(listeners)) canvas.addEventListener(name, handler);
    return () => {
      for (const [name, handler] of Object.entries(listeners)) canvas.removeEventListener(name, handler);
      canvas.tabIndex = previousTabIndex;
      blur();
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    const held = new Set([...keys.current, ...touchKeys.current]);
    if (held.has('KeyE')) {
      keys.current.delete('KeyE');
      touchKeys.current.delete('KeyE');
      ray.current.setFromCamera(new Vector2(), camera);
      for (const hit of ray.current.intersectObjects(scene.children, true)) {
        if (hit.distance > 5) break;
        let node = hit.object;
        while (node && node.userData.productId === undefined) node = node.parent;
        if (node) {
          const product = products.find(item => item.id === node.userData.productId);
          if (product) onSelect(product);
          break;
        }
      }
    }
    const forward = Number(held.has('KeyW') || held.has('ArrowUp')) -
      Number(held.has('KeyS') || held.has('ArrowDown'));
    const side = Number(held.has('KeyD') || held.has('ArrowRight')) -
      Number(held.has('KeyA') || held.has('ArrowLeft'));
    const {x: currentX, z: currentZ} = camera.position;
    const heading = -rotation.current.y * 180 / Math.PI;
    marker.current?.setAttribute('transform', `translate(${currentX} ${currentZ}) rotate(${heading})`);
    needle.current?.setAttribute('transform', `rotate(${heading} 32 32)`);
    if (!forward && !side) return;
    const step = Math.min(delta, .05) * 4 / Math.hypot(forward, side);
    const yaw = rotation.current.y;
    const x = camera.position.x + (side * Math.cos(yaw) - forward * Math.sin(yaw)) * step;
    const z = camera.position.z - (side * Math.sin(yaw) + forward * Math.cos(yaw)) * step;
    if (canWalk(x, camera.position.z, fixtures)) camera.position.x = x;
    if (canWalk(camera.position.x, z, fixtures)) camera.position.z = z;
  });

  return null;
}
