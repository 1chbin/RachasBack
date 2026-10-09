# Rachas — Backend (Parte I)

API REST en **NestJS** con persistencia en **MongoDB Atlas** para el trabajo práctico Rachas (Dominio y API).

## Requisitos

- Node.js 20+
- Cluster MongoDB Atlas (tier gratuito)

## Configuración

1. Copiá `.env.example` a `.env`.
2. Completá `MONGODB_URI` con tu cadena de Atlas, incluyendo el nombre de la base (por ejemplo `...mongodb.net/rachas`).
3. Opcional: `PORT` (por defecto `3000`).

**No subas `.env` al repositorio.**

## Ejecución

```bash
npm install
npm run start:dev
```

Al iniciar, si es la primera vez, se cargan **datos de prueba** (3 usuarios y 2 desafíos) de forma idempotente.

## Identificación (Parte I)

Los pedidos que modifican datos o actúan en nombre de una persona envían el header:

`x-usuario-id: <id de MongoDB>`

## Visibilidad del desafío y código de invitación

- **`GET /desafios`** devuelve un **resumen público** (explorar): nombre, categoría, estado, fechas, etc. **No** incluye `codigoInvitacion`.
- **`GET /desafios/:id`**: sin `x-usuario-id`, o con un usuario que **no** participa → mismo resumen público. Con `x-usuario-id` de un **participante activo** → detalle completo, **incluido** `codigoInvitacion` (para invitar a otros).
- **`GET /usuarios/:id/desafios`**: desafíos donde participa esa persona; cada ítem es detalle de participante (con código).
- **`GET /desafios/:id/participantes`**: requiere `x-usuario-id` y participación activa; si no, **403**.

El código de invitación funciona como secreto de unión: no se expone en el catálogo global.

## Decisiones de modelado

### Participantes embebidos vs colección `participaciones`

Se usa una colección **`participaciones`** con referencias a `usuarioId` y `desafioId`. Facilita consultar “mis desafíos”, contar cupo, aplicar el límite de 5 desafíos vigentes y registrar abandono sin reescribir arrays grandes en el documento del desafío.

### Estado del desafío

- **`PROGRAMADO`**, **`ACTIVO`** y **`FINALIZADO`** se **calculan** al leer/validar según `fechaInicio` y `fechaFin` (fechas calendario `YYYY-MM-DD`) y la fecha de referencia del servidor (`America/Argentina/Buenos_Aires`).
- **`CANCELADO`** se **persiste** (`cancelado: true`) porque no se deduce solo de las fechas.

Así no quedan estados desactualizados en la base cuando pasa el tiempo, y la cancelación explícita sigue siendo auditable.

### Fecha del check-in

Se guarda el campo **`dia`** como string `YYYY-MM-DD` en la zona horaria de la persona (`zonaHorariaUsada` en el documento). Las reglas “hoy / ayer” y el rango del desafío se validan con esa zona (`date-fns-tz`). Un índice único `(desafioId, usuarioId, dia)` garantiza un check-in por día.

## Índices de unicidad

| Colección        | Índice                          |
|------------------|---------------------------------|
| `usuarios`       | `alias`, `email`                |
| `desafios`       | `codigoInvitacion`              |
| `participaciones`| `usuarioId` + `desafioId`       |
| `checkins`       | `desafioId` + `usuarioId` + `dia` |

## Endpoints

| Método | Ruta | Auth | Descripción | Errores típicos |
|--------|------|------|-------------|-----------------|
| POST | `/usuarios` | No | Registrar persona | 400 validación, 409 alias/email duplicado |
| GET | `/usuarios` | No | Listar todas las personas | — |
| GET | `/usuarios/:id` | No | Obtener persona | 404 |
| PATCH | `/usuarios/:id` | Sí (propio) | Actualizar nombre / zona horaria | 403, 404 |
| GET | `/usuarios/:id/desafios` | No | Desafíos en los que participa | 404 usuario |
| GET | `/desafios` | No | Listar resumen público (sin `codigoInvitacion`) | 400 query |
| POST | `/desafios` | Sí | Crear desafío (respuesta con código) | 400 reglas, 409 límite 5 vigentes |
| GET | `/desafios/:id` | Opcional | Resumen público; detalle con código si participa | 404, 403 header inválido |
| PATCH | `/desafios/:id` | Sí (creador) | Modificar | 403, 409 estado |
| POST | `/desafios/:id/cancelar` | Sí (creador) | Cancelar | 403, 409 |
| POST | `/desafios/unirse` | Sí | Unirse por código | 404 código, 409 cupo/reingreso/límite 5 |
| POST | `/desafios/:id/abandonar` | Sí | Abandonar | 400 creador, 404/409 |
| GET | `/desafios/:id/participantes` | Sí (participante) | Participantes activos | 403, 404 |
| POST | `/desafios/:id/check-ins` | Sí | Registrar check-in | 403, 409 no activo, 400 día |
| DELETE | `/desafios/:id/check-ins/ultimo` | Sí | Deshacer último propio (solo hoy) | 400, 404 |
| GET | `/desafios/:id/check-ins?usuarioId=` | No | Historial de una persona | 400, 404 |

Orden de validación en services: formato (400) → existencia (404) → permisos (403) → estado (409) → reglas de negocio (400/409).

## Pruebas manuales

Usá [rachas.http](./rachas.http) con la extensión REST Client de VS Code/Cursor, o importá [rachas.postman_collection.json](./rachas.postman_collection.json) en Postman (carpeta **Flujo completo** en orden).

## Parte II en adelante

Puntos, rachas, ranking y paginación se implementan en la Parte II. Autenticación real y WebSockets en la Parte III.
