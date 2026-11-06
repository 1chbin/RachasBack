# Rachas — Backend (Parte I)

API REST en **NestJS** con persistencia en **MongoDB Atlas** para el trabajo práctico Rachas (Dominio y API).

## Requisitos

- Node.js 20+
- Cluster MongoDB Atlas (tier gratuito)

## Configuración

1. Copiá `.env.example` a `.env`.
2. Completá `MONGODB_URI` con tu cadena de Atlas, incluyendo el nombre de la base (por ejemplo `...mongodb.net/rachas`).
3. **Atlas → Network Access:** agregá tu **IP pública actual** (o `0.0.0.0/0` solo en dev). Sin esto el back puede escuchar en `:3000` pero `/health` y la API fallan con MongoDB desconectado (SSL / server selection en la terminal).
4. Opcional: `PORT` (por defecto `3000`).

**No subas `.env` al repositorio.**

## Ejecución

```bash
npm install
npm run start:dev
```

Al iniciar, si es la primera vez, se cargan **datos de prueba** (3 usuarios y 2 desafíos) de forma idempotente.

## Autenticación (Parte III)

Todos los endpoints (salvo los marcados explícitamente como públicos en el futuro) requieren:

`Authorization: Bearer <Firebase ID token>`

El back valida el token con **Firebase Admin SDK**. La primera vez que alguien ingresa con Google se crea su documento en `usuarios` (vinculado por `firebaseUid`). La persona activa **nunca** se envía en body, query ni headers custom.

**Opción recomendada:** descargá el JSON de la cuenta de servicio (Firebase → Cuentas de servicio → generar clave) y guardalo en `RachasBack/secrets/` (carpeta gitignored). En `.env`:

`FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-adminsdk.json`

**Opción alternativa:** variables `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (PEM en una línea con `\n`; ver `.env.example`).

Si el back falla con `Failed to parse private key`, usá la ruta al JSON en lugar de pegar la clave en `.env`.

## Visibilidad del desafío y código de invitación

- **`GET /desafios`** devuelve un **resumen público** (explorar): nombre, categoría, estado, fechas, etc. **No** incluye `codigoInvitacion`.
- **`GET /desafios/:id`**: si quien consulta **no** participa → resumen público. Si participa → detalle con `codigoInvitacion`.
- **`GET /usuarios/me/desafios`**: desafíos del usuario autenticado (con código si corresponde).
- **`GET /desafios/:id/participantes`**: requiere participación activa; si no, **403**.

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
| GET | `/usuarios/me` | Sí | Persona autenticada (`requiereAlias` si falta alias) | 401 |
| PATCH | `/usuarios/me` | Sí | Actualizar nombre / zona horaria | 401, 404 |
| PATCH | `/usuarios/me/alias` | Sí | Elegir alias único (post primer login) | 400, 409 |
| GET | `/usuarios/me/desafios` | Sí | Desafíos en los que participa | 401 |
| GET | `/usuarios/me/inicio` | Sí | Resumen de desafíos vigentes | 401 |
| GET | `/desafios` | Sí | Listar resumen (sin `codigoInvitacion`) | 401, 400 query |
| POST | `/desafios` | Sí | Crear desafío (respuesta con código) | 401, 400 reglas, 409 límite 5 vigentes |
| GET | `/desafios/:id` | Sí | Resumen o detalle según participación | 401, 404 |
| PATCH | `/desafios/:id` | Sí (creador) | Modificar | 403, 409 estado |
| POST | `/desafios/:id/cancelar` | Sí (creador) | Cancelar | 403, 409 |
| POST | `/desafios/unirse` | Sí | Unirse por código | 404 código, 409 cupo/reingreso/límite 5 |
| POST | `/desafios/:id/abandonar` | Sí | Abandonar | 400 creador, 404/409 |
| GET | `/desafios/:id/participantes` | Sí (participante) | Participantes activos | 403, 404 |
| POST | `/desafios/:id/check-ins` | Sí | Registrar check-in | 403, 409 no activo, 400 día |
| DELETE | `/desafios/:id/check-ins/ultimo` | Sí | Deshacer último propio (solo hoy) | 400, 404 |
| GET | `/desafios/:id/check-ins` | Sí | Historial paginado del usuario autenticado | 401, 404 |
| GET | `/desafios/:id/racha` | Sí (participante) | Racha actual y mejor racha del usuario | 403, 404 |
| GET | `/desafios/:id/ranking` | Sí (participante) | Ranking; `ganador` si `FINALIZADO` | 403, 404 |

Orden de validación en services: formato (400) → existencia (404) → permisos (403) → estado (409) → reglas de negocio (400/409).

## Parte II — Puntos, rachas y paginación

- Cada check-in guarda **`puntos`** (10 + bonus de racha: +0 / +5 / +10).
- **`GET /desafios`** y **`GET /desafios/:id/check-ins`** responden `{ data, meta }` con `page` y `limit` (default 20, máx. 50).
- Al arrancar, si hay check-ins antiguos sin puntos, se recalculan una sola vez (clave de migración `parte-2-puntos`).

### Ejemplo resumen inicio

`GET /usuarios/me/inicio` con Bearer token:

```json
{
  "desafios": [
    {
      "desafio": { "id": "...", "nombre": "...", "estado": "ACTIVO" },
      "rachaActual": 3,
      "mejorRacha": 5,
      "posicion": 2,
      "puntosTotales": 45,
      "checkInHoy": false
    }
  ]
}
```

## Pruebas manuales

Usá [rachas.http](./rachas.http) con la extensión REST Client de VS Code/Cursor, o importá [rachas.postman_collection.json](./rachas.postman_collection.json) en Postman (carpeta **Flujo completo** en orden).

## Parte III — WebSockets (Socket.IO)

Mismo host y puerto que la API HTTP. La conexión envía el Firebase ID token en el handshake:

```json
{ "auth": { "token": "<Firebase ID token>" } }
```

También se acepta `Authorization: Bearer …` en los headers del handshake.

### Cliente → servidor

| Evento | Payload | Respuesta (ack) |
|--------|---------|-----------------|
| `desafio:suscribir` | `{ "desafioId": string }` | `{ "ok": true }` o `{ "ok": false, "message": string }` si no participás |
| `desafio:desuscribir` | `{ "desafioId": string }` | `{ "ok": true }` |
| `aliento:enviar` | `{ "desafioId", "destinatarioUsuarioId", "emojiId" }` — `emojiId`: `fuego` \| `fuerza` \| `aplauso` \| `corazon` \| `estrella` | `{ "ok": true }` o `{ "ok": false, "message": string }` (auto-aliento, no participante, emoji inválido, rate limit 10 s) |

Tras suscribirte, el socket entra en la sala `desafio:<desafioId>`.

### Servidor → sala (participantes suscriptos)

| Evento | Cuándo se emite | Payload |
|--------|-----------------|---------|
| `checkin:registrado` | Check-in persistido | `{ desafioId, checkIn, usuarioId, alias }` |
| `checkin:deshecho` | Último check-in deshecho | `{ desafioId, usuarioId, dia }` |
| `ranking:actualizado` | Tras check-in, deshacer, unirse o abandonar | `{ desafioId, ranking: FilaRanking[] }` |
| `participante:unido` | Unión con código | `{ desafioId, usuarioId, alias }` |
| `participante:abandono` | Abandono | `{ desafioId, usuarioId, alias }` |
| `desafio:cancelado` | Cancelación por creador | `{ desafioId, estado: "CANCELADO" }` |
| `aliento:recibido` | Aliento enviado por otro participante (efímero, no persistido) | `{ desafioId, destinatarioUsuarioId, remitenteUsuarioId, remitenteAlias, emojiId, emoji }` — solo el destinatario debería mostrarlo en UI |

Los eventos se emiten **después** de persistir en MongoDB (salvo `aliento:recibido`, que no se guarda). Si un cliente pierde la conexión, debe volver a `desafio:suscribir` y refrescar el estado por HTTP (la app no reenvía eventos históricos).

### Alientos efímeros (Consigna C)

Los alientos **no se guardan** en la base: son señales en tiempo real para motivar en el momento. Implica: no hay historial ni notificaciones push retroactivas; si el destinatario no tiene el detalle abierto (o pierde el evento), el aliento se pierde. El límite de un aliento cada 10 segundos por persona y desafío vive en memoria del servidor (un reinicio del back lo resetea).

### Prueba manual (tiempo real)

1. Dos sesiones (dos navegadores, emulador + web, etc.) con usuarios distintos en el **mismo desafío**.
2. Abrí el detalle del desafío en ambas.
3. Registrá un check-in en una → en la otra el ranking se reordena sin pull-to-refresh y aparece un aviso breve.
4. Cortá la red o matá la app, volvé → datos consistentes tras reconexión y refetch.
5. **Alientos:** con el detalle abierto en ambos, A elige emoji para B en el ranking → B ve el banner efímero; segundo envío en menos de 10 s → error en ack.

---

## Parte IV — Versionado, analytics y monitoreo

- Rutas **`/v1/...`** (adaptadores JSON legacy + headers `Deprecation` / `Sunset`) y **`/v2/...`** (contrato actual: `finalizaEn`, `puntos` objeto, `PAUSADO`, check-in con `zonaHoraria`).
- Público: `GET /health` (Terminus + Mongo), `GET /version-policy`.
- Headers de app: `x-app-version`, `x-platform`, `x-request-id`; respuesta **426** si la versión es menor a `MIN_APP_VERSION`.
- Analytics: `POST /v2/analytics/events` (lotes, TTL 30 días), `POST /v2/analytics/client-errors` (público), reportes `GET /v2/analytics/reportes/personas-activas-por-dia`, `GET /v2/analytics/reportes/embudo-ingreso-desafio-checkin`, `GET /v2/analytics/reportes/checkins-por-version-app`.
- Logs HTTP en JSON (middleware `HttpRequest`).

Variables: ver `.env.example` (`MIN_APP_VERSION`, `RECOMMENDED_APP_VERSION`, `V1_SUNSET_DATE`).

Documentación: [`../docs/`](../docs/) y [`../README.md`](../README.md).
