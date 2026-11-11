export const ROOM = {halfWidth: 10, halfDepth: 12, height: 4.4};
export const ENTRANCE = [0, 1.69, 11.25];
export const EXHIBIT = {length: 6.8, depth: 2.24, backdrop: 3.94, rearBackdrop: 1.62};
export const CHECKOUT = {x: 0, z: -9.65, width: 3.9, depth: 1.58};

const bays = [
  {x: -5.35, z: 3.05, angle: Math.PI / 2, color: '#6ee0ff', category: 'Computación'},
  {x: 5.35, z: 3.05, angle: -Math.PI / 2, color: '#bd9aff', category: 'Móviles'},
  {x: -5.35, z: -4.6, angle: Math.PI / 2, color: '#ffc381', category: 'Audio'},
  {x: 5.35, z: -4.6, angle: -Math.PI / 2, color: '#c5f66b', category: 'Accesorios'},
  {x: -6.2, z: -9.8, angle: 0, color: '#72e2c3'},
  {x: 6.2, z: -9.8, angle: 0, color: '#f49fb9'},
];

export function storeLayout(categories, products) {
  const names = new Map(categories.map(category => [category.id, category.nombre]));
  const groups = new Map();
  for (const product of products) {
    const name = names.get(product.categoria_id) || 'Tecnología';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(product);
  }
  const zones = bays.flatMap(bay => {
    const items = groups.get(bay.category);
    if (!items) return [];
    groups.delete(bay.category);
    return [{...bay, name: bay.category, items}];
  });
  const freeBays = bays.filter(bay => !zones.some(zone => zone.category && zone.category === bay.category));
  for (const [name, items] of groups) {
    const bay = freeBays.shift();
    if (bay) zones.push({...bay, name, items});
    else zones[zones.length - 1].items = [...zones[zones.length - 1].items, ...items];
  }
  const fixtures = zones.map(({x,z,angle,color,name}) => ({
    x,z,color,name,width: angle ? EXHIBIT.depth : EXHIBIT.length,
    depth: angle ? EXHIBIT.length : EXHIBIT.depth,
  }));
  fixtures.push(CHECKOUT);
  const walls = zones.map(({x,z,angle}) => ({
    x: angle ? x - Math.sign(angle)*EXHIBIT.backdrop : x,
    z: angle ? z : z - EXHIBIT.rearBackdrop,
    width: angle ? .62 : EXHIBIT.length+.65,
    depth: angle ? EXHIBIT.length+.65 : .62,
  }));
  return {zones, fixtures, obstacles: [...fixtures, ...walls]};
}

export function canWalk(x, z, fixtures) {
  const radius = .29;
  return Math.abs(x) < ROOM.halfWidth - radius &&
    Math.abs(z) < ROOM.halfDepth - radius &&
    !fixtures.some(fixture =>
      Math.abs(x - fixture.x) < fixture.width / 2 + radius &&
      Math.abs(z - fixture.z) < fixture.depth / 2 + radius);
}
