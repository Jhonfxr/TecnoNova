import React, {Suspense, Component, useMemo, useRef, useState} from 'react';
import {Canvas} from '@react-three/fiber';
import {OrbitControls, RoundedBox, ContactShadows, Float} from '@react-three/drei';
import WalkControls from './WalkControls';
import StoreRoom from './StoreRoom';
import {storeLayout, ROOM} from './storeLayout';

function Box({size,at=[0,0,0],color='#41464d',radius=.06,...props}){return <RoundedBox args={size} radius={radius} smoothness={3} position={at} {...props}><meshStandardMaterial color={color} metalness={.45} roughness={.32}/></RoundedBox>}
export function Device({type='laptop',color='#c5f66b',...props}){
 return <group {...props}>{type==='laptop'?<><Box size={[3,.12,2]} at={[0,0,.3]}/><Box size={[2.65,.025,1.1]} at={[0,.07,.2]} color="#121819"/>{Array.from({length:40},(_,i)=><Box key={i} size={[.20,.025,.15]} at={[-1.1+i%10*.245,.09,-.2+Math.floor(i/10)*.23]} color={i%12===0?color:'#5c6269'} radius={.01}/>)}<Box size={[.8,.02,.4]} at={[0,.08,1]} color="#7a8388"/><group position={[0,1.02,-.68]} rotation={[-.15,0,0]}><Box size={[3,1.95,.1]}/><Box size={[2.8,1.74,.025]} at={[0,0,.065]} color="#152c2c"/><mesh position={[0,0,.085]} rotation={[0,0,-.5]}><planeGeometry args={[.65,1.5]}/><meshBasicMaterial color={color}/></mesh><mesh position={[.7,-.2,.085]} rotation={[0,0,-.5]}><planeGeometry args={[.25,1]}/><meshBasicMaterial color="#7a9d63"/></mesh></group></>:type==='phone'?<><Box size={[1.25,2.5,.17]} color="#717c84" radius={.14}/><Box size={[1.12,2.34,.03]} at={[0,0,.1]} color="#152c2c" radius={.1}/><mesh position={[0,-.15,.123]} rotation={[0,0,-.45]}><planeGeometry args={[.55,1.85]}/><meshBasicMaterial color={color}/></mesh><Box size={[.38,.09,.02]} at={[0,1.04,.14]} color="#030604" radius={.04}/><Box size={[.4,.03,.02]} at={[0,-1.05,.14]} color="#fafafa" radius={.01}/>{[.8,.35].map(y=><mesh key={y} position={[-.35,y,-.12]}><cylinderGeometry args={[.15,.15,.06,24]}/><meshStandardMaterial color="#05090e"/></mesh>)}</>:type==='headphones'?<><mesh position={[0,.25,0]}><torusGeometry args={[1,.13,12,48,Math.PI]}/><meshStandardMaterial color={color} metalness={.6} roughness={.3}/></mesh>{[-1,1].map(x=><group key={x} position={[x,-.2,0]} rotation={[0,0,x*.12]}><Box size={[.55,1.1,.8]} color="#282f35" radius={.22}/><Box size={[.2,.85,.65]} at={[-x*.25,0,0]} color="#636c70" radius={.09}/></group>)}</>:type==='keyboard'?<group rotation={[.2,0,0]}><Box size={[3,.18,1.2]}/>{Array.from({length:48},(_,i)=><Box key={i} size={[.20,.08,.2]} at={[-1.32+i%12*.24,.13,-.42+Math.floor(i/12)*.27]} color={i%9===0?color:'#8a939a'} radius={.025}/>)}</group>:type==='monitor'?<><Box size={[3.3,1.95,.15]} at={[0,.7,0]}/><Box size={[3.13,1.78,.03]} at={[0,.7,.09]} color="#173334"/><mesh position={[0,.7,.12]} rotation={[0,0,-.5]}><planeGeometry args={[.6,1.6]}/><meshBasicMaterial color={color}/></mesh><Box size={[.15,.8,.12]} at={[0,-.65,-.04]}/><Box size={[1.1,.1,.6]} at={[0,-1,0]}/></>:<><Box size={[1.6,2.2,1]} color="#394442" radius={.18}/>{[.45,-.5].map(y=><mesh key={y} position={[0,y,.52]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.43,.43,.08,32]}/><meshStandardMaterial color="#0f1a19"/></mesh>)}<mesh position={[0,-.5,.58]}><torusGeometry args={[.38,.035,8,32]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.5}/></mesh></>}</group>
}
class SceneBoundary extends Component {state={failed:false};static getDerivedStateFromError(){return {failed:true}} render(){return this.state.failed?<div className="scene-fallback">Tu dispositivo no pudo iniciar el visor 3D. Puedes seguir explorando y comprando desde el catálogo.</div>:this.props.children}}
function StoreMap({layout, marker}) {
  return <div className="store-map" aria-label="Plano de la tienda">
    <svg viewBox="-10 -12 20 24" role="img" aria-label="Zonas, exhibidores y tu posición">
      <rect x="-10" y="-12" width="20" height="24" fill="#edf0e7"/>
      {layout.fixtures.map(({x,z,width,depth}, i) => <rect key={i}
        x={x-width/2} y={z-depth/2} width={width} height={depth}
        rx=".25" fill={layout.zones[i]?.color || '#809487'}/>)}
      <g ref={marker}><path d="M0 -.9 L.52 .55 L0 .32 L-.52 .55 Z" fill="#121f19" stroke="#fff" strokeWidth=".13"/></g>
    </svg>
    <span>PLANO · ENTRADA ↓</span>
  </div>;
}

const directions = [['KeyW','↑','Avanzar'],['KeyA','←','Izquierda'],
  ['KeyS','↓','Retroceder'],['KeyD','→','Derecha'],['KeyE','E','Seleccionar']];

export default function Scene({products=[], categories=[], selected, onSelect, room=false, rotate=true}) {
  const [walking,setWalking] = useState(true);
  const marker = useRef(null);
  const touchKeys = useRef(new Set());
  const layout = useMemo(() => storeLayout(categories, products), [categories, products]);
  const product = selected || products[0];
  const inStore = room && walking;
  function changeView() {
    touchKeys.current.clear();
    setWalking(value => !value);
  }
  return <div className={room ? 'store-viewport' : 'device-viewport'}>
    {room && <div className="store-hud">
      <button className="pod-label" onClick={changeView}>{walking ? 'Vista general' : 'Caminar en primera persona'}</button>
      <small>{walking ? 'WASD o flechas · Arrastra para mirar · E para seleccionar' : 'Arrastra para girar · Pulsa un producto'}</small>
    </div>}
    {inStore && <>
      <span className="store-crosshair" aria-hidden="true">+</span>
      <StoreMap layout={layout} marker={marker}/>
      <div className="store-touch" aria-label="Controles táctiles">
        {directions.map(([key,label,name]) => <button key={key} aria-label={name}
          onPointerDown={event => {
            event.currentTarget.setPointerCapture(event.pointerId);
            touchKeys.current.add(key);
          }}
          onPointerUp={() => {if (key !== 'KeyE') touchKeys.current.delete(key);}}
          onPointerCancel={() => touchKeys.current.delete(key)}>{label}</button>)}
      </div>
    </>}
    <SceneBoundary key={room ? 'room' : 'hero'}>
      <Canvas key={inStore ? 'walk' : 'orbit'} shadows={!room} dpr={[1,1.5]}
        camera={{position:room ? [7,13,17] : [5,3.7,6], fov:room ? 70 : 38}}
        gl={{antialias:true}}>
        <color attach="background" args={[room ? '#b4c2b9' : '#202920']}/>
        {room ? <>
          <hemisphereLight args={['#fff9ea','#a4ad9c',2.2]}/>
          <directionalLight position={[3,8,5]} intensity={1.5}/>
        </> : <>
          <ambientLight intensity={1.7}/>
          <directionalLight position={[4,8,5]} intensity={3} castShadow/>
          <pointLight position={[-5,4,2]} color="#c5f66b" intensity={35}/>
        </>}
        <Suspense fallback={null}>
          {room
            ? <StoreRoom layout={layout} selected={selected} onSelect={onSelect} Device={Device} walking={inStore}/>
            : <>
                <Float speed={1.7} rotationIntensity={.25} floatIntensity={.45}>
                  <Device type={product?.modelo_3d || 'laptop'} color={product?.color || '#c5f66b'}
                    rotation={[0,-.3,0]} position={[0,-.3,0]}/>
                </Float>
                <ContactShadows position={[0,-1.5,0]} opacity={.5} scale={12} blur={2.5} far={5}/>
              </>}
          {inStore
            ? <WalkControls products={products} onSelect={onSelect} fixtures={layout.fixtures}
                marker={marker} touchKeys={touchKeys}/>
            : <OrbitControls makeDefault autoRotate={rotate && !room} autoRotateSpeed={.6}
                enablePan={room} minDistance={4} maxDistance={room ? 32 : 10}
                maxPolarAngle={Math.PI/2.06} target={room ? [0,ROOM.height/3,0] : [0,.3,0]}/>}
        </Suspense>
      </Canvas>
    </SceneBoundary>
  </div>;
}
