import {useEffect, useRef} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import {Euler, Raycaster, Vector2} from 'three';

export default function WalkControls({products, onSelect}) {
  const {camera, gl, scene} = useThree();
  const keys = useRef(new Set());
  const rotation = useRef(new Euler(0, 0, 0, 'YXZ'));
  const ray = useRef(new Raycaster());

  useEffect(() => {
    const canvas = gl.domElement;
    camera.position.set(0, 1.65, 8);
    rotation.current.set(0, 0, 0);
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
    const held = keys.current;
    if (held.delete('KeyE')) {
      ray.current.setFromCamera(new Vector2(), camera);
      for (const hit of ray.current.intersectObjects(scene.children, true)) {
        if (hit.distance > 5) break;
        let node = hit.object;
        while (node && node.userData.productIndex === undefined) node = node.parent;
        if (node) {
          const product = products[node.userData.productIndex];
          if (product) onSelect(product);
          break;
        }
      }
    }
    const forward = Number(held.has('KeyW') || held.has('ArrowUp')) -
      Number(held.has('KeyS') || held.has('ArrowDown'));
    const side = Number(held.has('KeyD') || held.has('ArrowRight')) -
      Number(held.has('KeyA') || held.has('ArrowLeft'));
    if (!forward && !side) return;
    const step = Math.min(delta, .05) * 4 / Math.hypot(forward, side);
    const yaw = rotation.current.y;
    const x = camera.position.x + (side * Math.cos(yaw) - forward * Math.sin(yaw)) * step;
    const z = camera.position.z - (side * Math.sin(yaw) + forward * Math.cos(yaw)) * step;
    function clear(x, z) {
      return Math.abs(x) < 11.5 && Math.abs(z) < 11.5 &&
        !products.slice(0,12).some((_, i) =>
          Math.abs(x - (i % 4 - 1.5) * 4) < 1.7 &&
          Math.abs(z - (Math.floor(i / 4) - 1) * 4) < 1.6);
    }
    if (clear(x, camera.position.z)) camera.position.x = x;
    if (clear(camera.position.x, z)) camera.position.z = z;
  });

  return null;
}
