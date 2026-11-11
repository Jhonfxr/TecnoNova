import {useEffect, useMemo} from 'react';
import {CanvasTexture, Color, SRGBColorSpace} from 'three';
import {Html, RoundedBox} from '@react-three/drei';
import {CHECKOUT, EXHIBIT, ROOM} from './storeLayout';

function Block({size, at, color, glow = false, roughness = .72}) {
  return <mesh position={at} receiveShadow>
    <boxGeometry args={size}/>
    {glow
      ? <meshBasicMaterial color={color} toneMapped={false}/>
      : <meshStandardMaterial color={color} roughness={roughness}/>}
  </mesh>;
}

function Trim({size, at, color, radius = .12, light = false}) {
  return <RoundedBox args={size} position={at} radius={radius} smoothness={2}>
    {light
      ? <meshBasicMaterial color={color} toneMapped={false}/>
      : <meshStandardMaterial color={color} roughness={.44} metalness={.24}/>}
  </RoundedBox>;
}

function Sign({label, subtitle, at, color = '#c5f66b', width = 4.8}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#121922';
    ctx.fillRect(0, 0, 1024, 192);
    ctx.fillStyle = '#f4f7ff';
    ctx.font = '700 72px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(label, 512, 91, 930);
    ctx.fillStyle = color;
    ctx.font = '600 31px system-ui';
    ctx.fillText(subtitle, 512, 145, 930);
    ctx.fillRect(404, 178, 216, 5);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    return map;
  }, [label, subtitle, color]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={at}>
    <planeGeometry args={[width, width * .1875]}/>
    <meshBasicMaterial map={texture} toneMapped={false}/>
  </mesh>;
}

function LightWash({texture, size, at, color, floor = false, opacity = .46}) {
  return <mesh position={at} rotation={floor ? [-Math.PI / 2,0,0] : [0,0,0]}>
    <planeGeometry args={size}/>
    <meshBasicMaterial map={texture} color={color} transparent opacity={opacity}
      depthWrite={false} toneMapped={false}/>
  </mesh>;
}

const elevations = {laptop:0, phone:1.25, headphones:.75, keyboard:.06, monitor:1.05, speaker:1.1};

function DisplayProduct({product, at, Device, selected, onSelect, accent}) {
  const scale = .46;
  return <group position={at} userData={{productId:product.id}}
    onClick={event => {event.stopPropagation(); onSelect(product);}}>
    <Trim size={[1.56,.09,1.46]} at={[0,0,0]} color={selected ? accent : '#3b4859'}
      radius={.045}/>
    <Device type={product.modelo_3d} color={product.color} scale={scale}
      position={[0,.06+(elevations[product.modelo_3d] ?? 1.1)*scale,0]}
      rotation={[0,-.12,0]}/>
    <Html position={[0,.13,.69]} center distanceFactor={6.4} occlude>
      <button className={'pod-label product-marker' + (selected ? ' active' : '')}
        style={{'--exhibit-accent':accent}} onClick={() => onSelect(product)}>
        {product.nombre}
      </button>
    </Html>
  </group>;
}

function Counter({width, depth, color, wash}) {
  return <>
    <LightWash texture={wash} size={[width+1.65,depth+1.55]} at={[0,.024,0]} color={color} floor/>
    <Trim size={[width-.25,.15,depth-.21]} at={[0,.11,0]} color="#151c28" radius={.07}/>
    <Trim size={[width-.16,.042,depth-.14]} at={[0,.19,0]} color={color} radius={.02} light/>
    <Trim size={[width-.13,.64,depth-.13]} at={[0,.525,0]} color="#253141"/>
    <Trim size={[width,.046,depth]} at={[0,.858,0]} color={color} radius={.022} light/>
    <Trim size={[width-.03,.114,depth-.03]} at={[0,.933,0]} color="#657488" radius={.055}/>
  </>;
}

function Exhibit({zone, selected, onSelect, Device, wash}) {
  const {length,depth} = EXHIBIT;
  const {angle,color,items,name,x,z} = zone;
  const back = -(angle ? EXHIBIT.backdrop : EXHIBIT.rearBackdrop);
  const signOffset = z > 0 ? Math.sign(angle)*1.52 : 0;
  const tint = new Color('#172231').lerp(new Color(color), .16);
  return <group position={[x,0,z]} rotation={[0,angle,0]}>
    <Counter width={length} depth={depth} color={color} wash={wash}/>
    <Trim size={[length+.65,3.6,.19]} at={[0,1.93,back]} color="#293546" radius={.18}/>
    <Trim size={[length+.35,3.32,.09]} at={[0,1.93,back+.13]} color="#101925" radius={.12}/>
    <Trim size={[length-.15,1.94,.055]} at={[0,1.48,back+.20]} color={tint} radius={.03}/>
    <LightWash texture={wash} size={[length-.17,2.06]} at={[0,1.64,back+.238]} color={color} opacity={.39}/>
    {[.56,2.52].map(y =>
      <Block key={y} size={[length-.14,.032,.05]} at={[0,y,back+.26]} color={color} glow/>)}
    <Sign label={name} subtitle={items.length + (items.length === 1 ? ' producto' : ' productos')}
      at={[signOffset,3.06,back+.24]} color={color} width={z > 0 ? 4.35 : 6.5}/>
    {items.length > 4 && <Trim size={[length,.11,1.42]} at={[0,1.98,-.39]} color="#536177" radius={.045}/>}
    {items.slice(0,8).map((product,index) => {
      const row = Math.floor(index / 4);
      const count = Math.min(4, items.length - row*4);
      const spacing = Math.min(2.2, (length-1.68) / Math.max(1,count-1));
      return <DisplayProduct key={product.id} product={product} Device={Device} accent={color}
        at={[(index % 4 - (count-1)/2)*spacing,row ? 2.1 : 1.05,row ? -.4 : .06]}
        selected={selected?.id === product.id} onSelect={onSelect}/>;
    })}
  </group>;
}

export default function StoreRoom({layout, selected, onSelect, Device, walking}) {
  const {halfWidth, halfDepth, height} = ROOM;
  const wash = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64,64,12,64,64,64);
    gradient.addColorStop(0,'rgba(255,255,255,1)');
    gradient.addColorStop(.63,'rgba(255,255,255,.62)');
    gradient.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,128,128);
    return new CanvasTexture(canvas);
  }, []);
  useEffect(() => () => wash.dispose(), [wash]);

  return <>
    <Block size={[20,.16,24]} at={[0,-.08,0]} color="#475569" roughness={.46}/>
    <Block size={[4.45,.016,24]} at={[0,.008,0]} color="#202a38" roughness={.82}/>
    {[-2.25,2.25].map(x =>
      <Block key={x} size={[.035,.012,24]} at={[x,.013,0]} color="#768597"/>)}
    <Block size={[20,height,.24]} at={[0,height/2,-halfDepth]} color="#252e3d"/>
    {[-halfWidth,halfWidth].map(x =>
      <Block key={x} size={[.24,height,24]} at={[x,height/2,0]} color="#202a38"/>)}
    {walking && <>
      <Block size={[20,.18,24]} at={[0,height,0]} color="#151c26"/>
      {[-6.2,6.2].map(x =>
        <Block key={x} size={[7.6,height,.24]} at={[x,height/2,halfDepth]} color="#202a38"/>)}
      {[-7.2,7.2].map(x =>
        <Block key={x} size={[.052,.042,21]} at={[x,height-.16,0]} color="#c4d9f4" glow/>)}
      {[-8,-4,0,4,8].map(z =>
        <Block key={z} size={[.38,.058,1.8]} at={[0,height-.16,z]} color="#edf6ff" glow/>)}
    </>}
    <Trim size={[5.35,3.72,.20]} at={[0,1.9,-11.68]} color="#57677b" radius={.15}/>
    <Trim size={[5.16,3.56,.12]} at={[0,1.9,-11.51]} color="#121925" radius={.12}/>
    <Sign label="TECNONOVA" subtitle="SHOWROOM" at={[0,2.77,-11.40]} width={4.75}/>
    <group position={[CHECKOUT.x,0,CHECKOUT.z]}>
      <Counter width={CHECKOUT.width} depth={CHECKOUT.depth} color="#b9ec83" wash={wash}/>
      <Sign label="CAJA" subtitle="Atención y retiro" at={[0,.56,.80]} width={2.27}/>
      <Trim size={[.54,.34,.18]} at={[.95,1.17,-.25]} color="#0e1720" radius={.045}/>
    </group>
    {layout.zones.map(zone => <Exhibit key={zone.name} zone={zone} selected={selected}
      onSelect={onSelect} Device={Device} wash={wash}/>)}
  </>;
}
