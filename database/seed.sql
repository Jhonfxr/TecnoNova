insert into public.categorias (nombre, descripcion) values
    ('Computación', 'Portátiles, pantallas y equipos para trabajo o estudio.'),
    ('Móviles', 'Teléfonos para productividad y entretenimiento.'),
    ('Audio', 'Auriculares y altavoces para distintos espacios.'),
    ('Accesorios', 'Periféricos para completar el escritorio.')
on conflict (nombre) do nothing;

-- Evita duplicar el catálogo si se ejecutan dos cargas en paralelo.
-- No se modifica el precio, stock ni estado de los productos existentes.
lock table public.productos in share row exclusive mode;

with catalogo (categoria, nombre, marca, descripcion, precio, stock, modelo_3d, color) as (
    values
        ('Computación', 'NovaBook Air 14', 'TecnoNova', 'Portátil ligero de 14 pulgadas para estudiar y trabajar.', 5299.00, 12, 'laptop', '#96D945'),
        ('Computación', 'NovaBook Pro 16', 'TecnoNova', 'Portátil de 16 pulgadas para diseño y multitarea.', 7899.00, 8, 'laptop', '#7C86F3'),
        ('Computación', 'NovaView 27', 'Nova', 'Monitor QHD de 27 pulgadas con soporte ajustable.', 2199.00, 14, 'monitor', '#ADB9D0'),
        ('Móviles', 'Nova X1', 'TecnoNova', 'Teléfono de 6,4 pulgadas con pantalla OLED y doble cámara.', 2999.00, 15, 'phone', '#A3EE46'),
        ('Móviles', 'Nova X1 Plus', 'TecnoNova', 'Teléfono de 6,7 pulgadas con batería de alta capacidad.', 3899.00, 10, 'phone', '#DF7FFD'),
        ('Audio', 'NovaSound Studio', 'Nova', 'Auriculares inalámbricos con cancelación de ruido.', 849.00, 20, 'headphones', '#E59565'),
        ('Audio', 'NovaSound Move', 'Nova', 'Altavoz portátil Bluetooth con acabado resistente.', 549.00, 16, 'speaker', '#43CDCE'),
        ('Audio', 'NovaSound Mini', 'Nova', 'Altavoz compacto para escritorios y habitaciones.', 329.00, 18, 'speaker', '#ECCC54'),
        ('Accesorios', 'NovaKeys TKL', 'Nova', 'Teclado mecánico compacto con conexión USB-C.', 589.00, 17, 'keyboard', '#8798FA'),
        ('Accesorios', 'NovaKeys Compact', 'Nova', 'Teclado inalámbrico de perfil bajo para espacios pequeños.', 399.00, 22, 'keyboard', '#F2ACC1')
)
insert into public.productos (categoria_id, nombre, marca, descripcion, precio, stock, modelo_3d, color)
select c.id, s.nombre, s.marca, s.descripcion, s.precio, s.stock, s.modelo_3d, s.color
from catalogo s
join public.categorias c on c.nombre = s.categoria
where not exists (select 1 from public.productos p where p.nombre = s.nombre);
