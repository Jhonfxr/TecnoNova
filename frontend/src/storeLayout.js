export const ROOM = {halfWidth: 10, halfDepth: 12, height: 4.4};
export const ENTRANCE = [0, 1.65, 10.7];

const bays = [
  {x: -8.6, z: 2.7, angle: Math.PI / 2, color: '#547662'},
  {x: 8.6, z: 2.7, angle: -Math.PI / 2, color: '#375f85'},
  {x: -8.6, z: -5.9, angle: Math.PI / 2, color: '#845238'},
  {x: 8.6, z: -5.9, angle: -Math.PI / 2, color: '#645284'},
  {x: -5, z: -10.6, angle: 0, color: '#477869'},
  {x: 4, z: -10.6, angle: 0, color: '#375f85'},
];

export function storeLayout(categories, products) {
  const groups = new Map();
  for (const product of products) {
    const name = categories.find(category => category.id === product.categoria_id)?.nombre || 'Tecnología';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(product);
  }
  const zones = Array.from(groups, ([name, items], index) => {
    const bay = bays[index % bays.length];
    return {...bay, name, items, key: name};
  });
  const fixtures = zones.map(({x,z,angle}) => ({
    x,z,width: angle ? 2 : 7.6, depth: angle ? 7.6 : 2,
  }));
  fixtures.push({x:0,z:0,width:3.5,depth:2.2}, {x:0,z:-8.2,width:3.5,depth:1.5});
  return {zones, fixtures};
}

export function canWalk(x, z, fixtures) {
  const radius = .29;
  return Math.abs(x) < ROOM.halfWidth - radius &&
    Math.abs(z) < ROOM.halfDepth - radius &&
    !fixtures.some(fixture =>
      Math.abs(x - fixture.x) < fixture.width / 2 + radius &&
      Math.abs(z - fixture.z) < fixture.depth / 2 + radius);
}
