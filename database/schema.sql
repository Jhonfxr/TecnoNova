create table public.categorias (
    id bigint generated always as identity primary key,
    nombre varchar(100) not null unique,
    descripcion text not null
);

create table public.productos (
    id bigint generated always as identity primary key,
    categoria_id bigint not null references public.categorias (id),
    nombre varchar(120) not null,
    marca varchar(80) not null,
    descripcion text not null,
    precio numeric(12, 2) not null check (precio >= 0 and precio <> 'NaN'::numeric),
    stock integer not null check (stock >= 0),
    modelo_3d text not null check (modelo_3d in ('laptop', 'phone', 'headphones', 'keyboard', 'monitor', 'speaker')),
    color varchar(7) not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
    activo boolean not null default true,
    created_at timestamptz not null default now()
);

create table public.ventas (
    id bigint generated always as identity primary key,
    pedido_id uuid not null,
    producto_id bigint not null references public.productos (id),
    nombre_producto varchar(120) not null,
    cantidad integer not null check (cantidad > 0),
    precio_unitario numeric(12, 2) not null check (precio_unitario >= 0 and precio_unitario <> 'NaN'::numeric),
    total numeric(12, 2) not null check (total = precio_unitario * cantidad),
    created_at timestamptz not null default now(),
    unique (pedido_id, producto_id)
);

create index productos_categoria_id_idx on public.productos (categoria_id);
create index ventas_producto_id_idx on public.ventas (producto_id);
-- La restricción única ya indexa las búsquedas por pedido_id (primera columna).

alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.ventas enable row level security;

revoke all privileges on public.categorias, public.productos, public.ventas from public, anon, authenticated;
revoke all privileges on sequence public.categorias_id_seq, public.productos_id_seq, public.ventas_id_seq
    from public, anon, authenticated;
grant select on public.categorias, public.productos to anon, authenticated;

create policy categorias_lectura_publica on public.categorias
    for select to anon, authenticated using (true);
create policy productos_activos_lectura_publica on public.productos
    for select to anon, authenticated using (activo);
