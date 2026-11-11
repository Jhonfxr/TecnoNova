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
    <span>Plano de la tienda</span>
    <svg viewBox="-10 -12 20 24" role="img" aria-label="Zonas, exhibidores y tu posición">
      <rect x="-9.8" y="-11.8" width="19.6" height="23.6" rx=".7" fill="#1b2530" stroke="#4a5866" strokeWidth=".22"/>
      <path d="M0 10.5V-8.25" stroke="#495867" strokeWidth=".24" strokeDasharray=".65 .55"/>
      {layout.fixtures.map(({x,z,width,depth,color,name}) => <g key={name || 'checkout'}>
        <rect x={x-width/2} y={z-depth/2} width={width} height={depth}
          rx=".3" fill={color || '#738295'} fillOpacity=".24" stroke={color || '#738295'} strokeWidth=".16"/>
        {name && <text x={x} y={z} transform={depth > width ? `rotate(-90 ${x} ${z})` : undefined}
          textAnchor="middle" dominantBaseline="central" fontSize=".96" fill="#f0f5fc">{name}</text>}
      </g>)}
      <g ref={marker}><path d="M0 -1.13 L.69 .68 L0 .37 L-.69 .68 Z" fill="#c5f66b" stroke="#101a13" strokeWidth=".18"/></g>
    </svg>
  </div>;
}

function StoreCompass({needle}) {
  return <svg className="store-compass" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="30" fill="#101720" stroke="#586679" strokeOpacity=".8"/>
    <g fill="#dce6f3" fontSize="8" fontWeight="700" textAnchor="middle">
      <text x="32" y="13">N</text><text x="53" y="35">E</text>
      <text x="32" y="57">S</text><text x="11" y="35">O</text>
    </g>
    <g ref={needle}>
      <path d="M32 17 L39 34 L32 31 L25 34 Z" fill="#c5f66b"/>
      <path d="M32 46 L25 34 L32 37 L39 34 Z" fill="#7f8b99"/>
    </g>
  </svg>;
}

const directions = [['KeyW','↑','Avanzar'],['KeyA','←','Izquierda'],
  ['KeyS','↓','Retroceder'],['KeyD','→','Derecha'],['KeyE','E','Seleccionar']];

export default function Scene({products=[], categories=[], selected, onSelect, room=false, rotate=true}) {
  const [walking,setWalking] = useState(true);
  const marker = useRef(null);
  const needle = useRef(null);
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
      <StoreCompass needle={needle}/>
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
        camera={{position:room ? [7,13,17] : [5,3.7,6], fov:room ? 68 : 38}}
        gl={{antialias:true}}>
        <color attach="background" args={[room ? '#151c26' : '#202920']}/>
        {room ? <>
          <hemisphereLight args={['#e5efff','#677488',2.05]}/>
          <directionalLight position={[3,8,6]} color="#e5efff" intensity={2.15}/>
          <directionalLight position={[-6,5,-3]} color="#c8d5ff" intensity={.9}/>
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
            ? <WalkControls products={products} onSelect={onSelect} fixtures={layout.obstacles}
                marker={marker} needle={needle} touchKeys={touchKeys}/>
            : <OrbitControls makeDefault autoRotate={rotate && !room} autoRotateSpeed={.6}
                enablePan={room} minDistance={4} maxDistance={room ? 32 : 10}
                maxPolarAngle={Math.PI/2.06} target={room ? [0,ROOM.height/3,0] : [0,.3,0]}/>}
        </Suspense>
      </Canvas>
    </SceneBoundary>
  </div>;
}
