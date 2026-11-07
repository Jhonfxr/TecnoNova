# Verificación del backend TecnoNova

- API: categorías y catálogo activo públicos; operaciones de inventario y ventas protegidas por clave administrativa. Los productos archivados conservan sus ventas históricas.
- Ventas: orden fijo de bloqueo por identificador de producto, bloqueo transaccional por UUID en PostgreSQL, validación de stock, precio calculado por el servidor y una sola transacción para líneas e inventario. Los reintentos comparan las cantidades agrupadas.
- SQL: tres tablas con restricciones, índices y RLS. El rol público solo puede leer categorías y productos activos. La carga inicial agrega cuatro categorías y diez productos sin modificar entradas existentes.
- Pruebas: `python -m unittest discover -s tests -v`, 7 aprobadas. Se observó el fallo inicial al no existir las rutas y luego se verificó el resultado con SQLite en memoria. Cubre acceso y clave ausente, validación, rechazo de precios enviados por clientes, reversión por falta de stock, duplicados e idempotencia, y archivo con historial.
- Límites de esta comprobación: SQLite no ejecuta los bloqueos de PostgreSQL ni RLS. No se ejecutó ninguna modificación de Supabase ni se envió un webhook real en esta etapa. Se usó el entorno Python ya instalado porque la red del sandbox no pudo resolver PyPI; `unittest` no depende de instalar pytest.
