import {useEffect, useMemo} from 'react';
import {CanvasTexture, SRGBColorSpace} from 'three';
import {Html} from '@react-three/drei';
import {ROOM} from './storeLayout';

function Block({size, at, color, glow = false}) {
  return <mesh position={at} receiveShadow>
    <boxGeometry args={size}/>
    <meshStandardMaterial color={color} roughness={.75}
      emissive={glow ? color : '#000000'} emissiveIntensity={glow ? .7 : 0}/>
  </mesh>;
}

function Sign({label, subtitle, at, color = '#213b32', width = 4.8}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 768, 192);
    ctx.fillStyle = '#f9fcf6';
    ctx.font = '700 56px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(label, 384, 85, 710);
    ctx.fillStyle = '#e5f2d5';
    ctx.font = '500 27px system-ui';
    ctx.fillText(subtitle, 384, 143, 710);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    return map;
  }, [label, subtitle, color]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={at}>
    <planeGeometry args={[width, width / 4]}/>
    <meshBasicMaterial map={texture} toneMapped={false}/>
  </mesh>;
}

function Plant({at}) {
  return <group position={at}>
    <mesh position={[0,.23,0]}><cylinderGeometry args={[.29,.22,.46,12]}/><meshStandardMaterial color="#3b4844"/></mesh>
    {[[-.18,.7,0],[.18,.82,.07],[0,1,-.1]].map((position,i) =>
      <mesh key={i} position={position} scale={[.28,.43,.28]}>
        <sphereGeometry args={[1,10,8]}/><meshStandardMaterial color={i === 1 ? '#688658' : '#426748'}/>
      </mesh>)}
  </group>;
}

const elevations = {laptop:0, phone:1.25, headphones:.75, keyboard:.06, monitor:1.05, speaker:1.1};

function DisplayProduct({product, at, Device, selected, onSelect, label = true}) {
  const scale = .42;
  return <group position={at} userData={{productId:product.id}}
    onClick={event => {event.stopPropagation(); onSelect(product);}}>
    <Block size={[1.75,.09,1.42]} at={[0,0,0]} color={selected ? '#a7cf66' : '#d2ded5'}/>
    <Device type={product.modelo_3d} color={product.color} scale={scale}
      position={[0,.06+(elevations[product.modelo_3d] ?? 1.1)*scale,0]}/>
    {label && <Html position={[0,.05,.78]} center distanceFactor={7} occlude>
      <button className={'pod-label' + (selected ? ' active' : '')} onClick={() => onSelect(product)}>
        {product.nombre}
      </button>
    </Html>}
  </group>;
}

export default function StoreRoom({layout, selected, onSelect, Device, walking}) {
  const {halfWidth, halfDepth, height} = ROOM;
  const feature = layout.zones[0]?.items[0];
  return <>
    <Block size={[20,.16,24]} at={[0,-.08,0]} color="#cdd4cb"/>
    <gridHelper args={[24,12,'#b3bdb3','#bac4ba']} position={[0,.004,0]}/>
    <Block size={[20,.022,22]} at={[0,0,-.5]} color="#dbe0d8"/>
    <Block size={[3.1,.016,19]} at={[0,.021,0]} color="#b9cbbd"/>
    <Block size={[20,height,.22]} at={[0,height/2,-halfDepth]} color="#eef0e8"/>
    <Block size={[.22,height,24]} at={[-halfWidth,height/2,0]} color="#e9ede6"/>
    <Block size={[.22,height,24]} at={[halfWidth,height/2,0]} color="#e9ede6"/>
    {walking && <>
      <Block size={[20,.2,24]} at={[0,height,0]} color="#e4e8e3"/>
      <Block size={[7.7,height,.22]} at={[-6.15,height/2,halfDepth]} color="#e9ede6"/>
      <Block size={[7.7,height,.22]} at={[6.15,height/2,halfDepth]} color="#e9ede6"/>
      <Block size={[4.6,1,.22]} at={[0,3.9,halfDepth]} color="#304d40"/>
    </>}
    {[-6,0,6].flatMap(x => [-8,-2,4,9].map(z =>
      <Block key={x+':'+z} size={[.32,.055,2.7]} at={[x,height-.16,z]} color="#fff9e8" glow/>))}
    <Sign label="TECNONOVA" subtitle="TECNOLOGÍA · SHOWROOM" at={[0,3.52,-11.86]} width={6.2}/>
    <Block size={[3.5,1,1.5]} at={[0,.5,-8.2]} color="#385344"/>
    <Block size={[3.6,.1,1.6]} at={[0,1.05,-8.2]} color="#eef2e8"/>
    <Block size={[.58,.32,.27]} at={[.9,1.26,-8.35]} color="#273837"/>
    <Sign label="CAJA" subtitle="Atención y retiro" at={[0,.62,-7.43]} width={1.75}/>
    <Block size={[3.5,.8,2.2]} at={[0,.4,0]} color="#526c5c"/>
    <Block size={[3.55,.09,2.25]} at={[0,.84,0]} color="#eef2e8"/>
    <Sign label="DESTACADO" subtitle="Colección Nova" at={[0,.52,1.112]} width={2}/>
    {feature && <DisplayProduct product={feature} Device={Device} at={[0,.91,0]}
      selected={selected?.id === feature.id} onSelect={onSelect}/>}
    {[[-8.8,0,-10.5],[8.8,0,-10.5],[-7,0,10.5],[7,0,10.5]].map(at =>
      <Plant key={at.join()} at={at}/>)}
    {layout.zones.map(zone => <group key={zone.key} position={[zone.x,0,zone.z]} rotation={[0,zone.angle,0]}>
      <Block size={[7.6,.85,2]} at={[0,.425,0]} color={zone.color}/>
      <Block size={[7.62,.09,2]} at={[0,.89,0]} color="#f2f4eb"/>
      <Block size={[7.6,2.7,.1]} at={[0,1.65,-.96]} color="#e1e7dd"/>
      <Block size={[7.62,.07,.1]} at={[0,2.28,-.89]} color="#e8ffca" glow/>
      <Sign label={zone.name.toUpperCase()} subtitle={zone.items.length + ' productos'} at={[0,2.86,-.88]} color={zone.color}/>
      {zone.items.slice(0,8).map((product,i) => {
        const count = Math.min(4, zone.items.length - Math.floor(i / 4)*4);
        const row = Math.floor(i / 4);
        return <group key={product.id}>
          {row === 1 && i === 4 && <Block size={[7.6,.08,1.65]} at={[0,1.73,-.12]} color="#f2f4eb"/>}
          <DisplayProduct product={product} Device={Device}
            at={[(i % 4 - (count-1)/2)*1.82, row ? 1.8 : .96, -.12]}
            selected={selected?.id === product.id} onSelect={onSelect}/>
        </group>;
      })}
    </group>)}
  </>;
}
