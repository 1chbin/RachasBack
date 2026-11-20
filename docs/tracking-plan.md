# Plan de eventos (Parte IV)

Sin datos personales: solo ids de negocio y propiedades agregables.

| Evento | Cuándo | Propiedades |
| ------ | ------ | ----------- |
| `ingreso_exitoso` | Tras `GET /v2/usuarios/me` con sesión válida | `requiere_alias` (boolean) |
| `desafio_creado` | Desafío creado OK | `categoria`, `max_participantes` |
| `desafio_unido` | Unión con código OK | `desafio_id` (opcional) |
| `checkin_hecho` | Check-in registrado OK | `desafio_id` |
| `ranking_consultado` | Ranking cargado en detalle | `desafio_id` |
| `racha_perdida` | Tras check-in, si `rachaActual` baja respecto al valor anterior del detalle (p. ej. ventana/ayer) | `desafio_id`, `racha_anterior`, `racha_nueva` (números) |
| `aviso_actualizacion_mostrado` | Banner versión recomendada | `min`, `recommended`, `app_version` |

## Por qué cada propiedad

Ninguna lleva email, alias, nota ni valor libre del check-in. El día del check-in queda en el dominio; el evento no lo duplica.

- `requiere_alias`: distingue un ingreso que todavía tiene que elegir alias de uno que ya tiene persona completa, sin guardar el alias.
- `categoria`: agrupa desafíos creados por tipo de hábito (`SALUD`, `ESTUDIO`, etc.).
- `max_participantes`: mide el tamaño de grupo elegido al crear, un número entre 2 y 20.
- `desafio_id`: agrupa unión, check-in, ranking y racha por desafío, sin identificar a la persona por email.
- `racha_anterior` y `racha_nueva`: miden cuánto cayó la racha en ese check-in; son números, no texto de la persona.
- `min` y `recommended`: registran la política de versiones que disparó el aviso.
- `app_version`: permite ver en qué versión de la app se mostró el aviso, sin datos del dispositivo más allá de la versión.

Implementación: [`RachasFront/services/analytics/track.ts`](../RachasFront/services/analytics/track.ts) → `POST /v2/analytics/events` (lotes). TTL 30 días en colección `eventos_uso`.

Consentimiento: interruptor **Compartir datos de uso** en Perfil.

## Preguntas de negocio (MongoDB)

Requieren sesión (mismo auth que el resto de la API v2, header `x-usuario-id`).

- Personas activas por día: `GET /v2/analytics/reportes/personas-activas-por-dia` (distinct `usuarioId` por día calendario sobre `eventos_uso`).
- Embudo ingreso → primer desafío → primer check-in (orden estricto por primera ocurrencia de cada evento por usuario): `GET /v2/analytics/reportes/embudo-ingreso-desafio-checkin` (respuesta: `usuarios_con_ingreso`, `usuarios_ingreso_antes_primer_desafio`, `usuarios_embudo_completo`).
- Check-ins por versión de app: `GET /v2/analytics/reportes/checkins-por-version-app` (`nombre: checkin_hecho`, agrupa `appVersion` o `desconocido`).
