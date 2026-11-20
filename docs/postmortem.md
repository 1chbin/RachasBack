# Postmortem — cambio estructural Parte IV

## Resumen ejecutivo

Se introdujo el contrato **v2** del API (campos y validaciones distintos al cliente congelado **1.0.0**). Quienes siguieron usando esa build contra rutas sin el adaptador legacy vieron datos incorrectos y fallos de check-in (**400**). La salida fue **versionado por URI** (`/v1` adaptado, `/v2` actual), política de versiones mínima/recomendada, y app **1.1.0** en `/v2`. Hoy el sistema puede seguir recibiendo tráfico antiguo mientras se comunica el retiro de v1.

## Qué cambió

El back adoptó contrato **v2**: `finalizaEn`, `puntos` como objeto, estado `PAUSADO`, y `zonaHoraria` obligatoria al crear check-ins. La app **1.0.0** seguía esperando el contrato original.

## A quién afectó

Usuarios (y desarrolladores) con build **1.0.0** sin prefijo `/v1`: listados, ranking, check-in y detalle dejaron de ser confiables o fallaron con **400**.

## Cronología (alto nivel)

1. **Cambio estructural** en el dominio (v2) sin compatibilidad en JSON hacia clientes viejos.
2. **Detección** con prueba guiada: app tag `app-1.0.0` vs back nuevo ([`compatibilidad.md`](compatibilidad.md)).
3. **Diseño**: Nest versionado; mappers v1 desde la misma capa de servicios; `Deprecation`/`Sunset`; logs de uso v1.
4. **Mitigación inmediata**: clientes 1.0.0 con `EXPO_PUBLIC_API_PREFIX=/v1`.
5. **Estado objetivo**: producto **1.1.0** en `/v2`, métricas y monitoreo (`requestId`, health, analytics).

## Cómo lo detectamos

Prueba guiada app del tag `app-1.0.0` contra el back nuevo: campos undefined, validación de check-in y matriz en [`compatibilidad.md`](compatibilidad.md).

## Síntomas observables

Descritos en la matriz y en la guía de capturas: [`evidencia-consignas-ab.md`](evidencia-consignas-ab.md) (fechas, ranking, 400 en check-in, recuperación con `/v1` y demo 426/banner). Las capturas en `docs/evidencia/` (cuando existan) son la evidencia de entrega.

## Cómo lo resolvimos

- **Versionado URI** NestJS: `/v1` (adaptadores) y `/v2` (contrato nuevo) sin duplicar lógica de negocio.
- Headers **Deprecation/Sunset** en v1.
- **`GET /version-policy`** + headers `x-app-version` / `x-platform`; **426** si la app está por debajo de `MIN_APP_VERSION`.
- App **1.1.0** con `EXPO_PUBLIC_API_PREFIX=/v2`.

## Proceso en un equipo real

1. Tag/release congelado antes de cambios rompedores.
2. Matriz de compatibilidad y prueba app vieja vs back nuevo.
3. v2 + adaptador v1 + política de sunset documentada.
4. Monitoreo de tráfico v1 hasta retiro.

En operación: logs HTTP en JSON con el mismo `requestId` que envía la app; errores no controlados se reportan al back con ese id cuando aplica, para cruzar síntoma en el dispositivo con línea de log en el servidor. Detalle: [README del monorepo](../README.md#correlación-error-en-app--servidor), plan de eventos [`tracking-plan.md`](tracking-plan.md), checklist [`verificacion-parte-iv.md`](verificacion-parte-iv.md).

## Lecciones y controles adicionales

- **Contract tests** (o snapshots de DTO) entre releases para detectar cambios de forma antes del despliegue.
- **Feature flags** para activar validaciones nuevas en back solo cuando una fracción de clientes ya actualizó.
- **Ventana de sunset** medible: alertas cuando el tráfico `/v1` no baja antes de la fecha en `Sunset` (ver README — alertas sugeridas).

## ¿Qué cambios son seguros desde el principio?

- Campos **opcionales** nuevos en respuestas.
- Endpoints **nuevos** sin eliminar los existentes.
- Correcciones de bugs compatibles con el JSON actual.

## ¿Cuáles nunca lo son sin versionado?

- Renombrar campos, cambiar tipos, estados nuevos con semántica distinta, y campos **obligatorios** nuevos en requests.

**Cierre (Consigna E):** los cambios que solo *añaden* compatibilidad hacia atrás son los que se pueden desplegar sin coordinar clientes; los que *cambian forma o significado* de lo que ya consumían los usuarios requieren versionado de API y/o de app, prueba explícita de la build congelada y comunicación clara de retiro.
