# Bloque 7: ParkControl con Supabase PostgreSQL

El PDF del curso utiliza HospitalSoft. Esta guía adapta los conceptos al dominio de ParkControl. El PDF remite a otros README del curso que no están disponibles aquí; esta adaptación no reproduce instrucciones que no hemos recibido.

## 7.1. Crear y verificar la base de datos

1. En Supabase abre tu proyecto. Si aún no tienes uno, créalo y guarda la contraseña de la base de datos en un lugar privado.
2. Abre **SQL Editor** y crea una consulta. Copia todo `database/01_esquema_parkcontrol.sql` y ejecútalo.
3. Abre **Table Editor** y comprueba las siete tablas: roles, usuarios, conductores, vehiculos, espacios, estancias y pagos.
   - **Captura 01:** listado de las siete tablas.
4. En otra consulta del SQL Editor ejecuta `database/02_roles_seguridad.sql`. Este script requiere los roles `anon` y `authenticated` de Supabase.
   - **Captura 02:** resultado con siete filas y `rowsecurity = true`.
5. Abre `database/03_verificacion.sql`. Selecciona y ejecuta cada consulta por separado para capturar su resultado.
   - **Captura 03:** consulta 1, las siete tablas.
   - **Captura 04:** consulta 2, restricciones de las tablas, incluidas claves primarias y foráneas.
   - **Captura 05:** consulta 3, RLS activado en las siete tablas.
   - **Captura 06:** consulta 4, roles `administrador` y `usuario` activos.
   - **Captura 07:** consulta 5, cero filas de permisos directos para `anon` y `authenticated`.
6. Si la interfaz ofrece un diagrama del esquema, abre las relaciones entre las tablas.
   - **Captura 08:** diagrama con las claves foráneas.

No incluyas contraseñas, cadenas de conexión, tokens ni API keys en las capturas.

Activar RLS y retirar permisos directos prepara la protección de las tablas. El control de acceso del backend también dependerá del rol de conexión y de las comprobaciones de autorización en Express. Estos scripts todavía no conectan la API ni migran sus arreglos en memoria.

## Siguientes etapas

- **7.2:** configurar credenciales mediante variables de entorno, conexión TLS, módulo de consultas y prueba de consulta a `public.roles`.
- **7.3:** migrar un primer CRUD sencillo, por ejemplo espacios, y verificar persistencia después de reiniciar Node.js.
- **7.4:** migrar recursos relacionados conservando claves foráneas y validaciones.
- **7.5:** completar la persistencia, empezando por usuarios antes de hacer depender la autenticación de identificadores persistentes.

Realiza y verifica cada etapa antes de avanzar a la siguiente.
