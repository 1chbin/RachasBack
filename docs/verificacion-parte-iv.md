# Verificación Parte IV

Checklist alineado con [`GuiaProyecto.md`](../GuiaProyecto.md) §7 y definición de terminado.

## Automática (última corrida)

Ejecutá desde la raíz del monorepo:

```powershell
cd RachasBack; npm run build
cd ..\RachasFront; npx tsc --noEmit
```

| Resultado | Fecha |
|-----------|--------|
| `RachasBack`: `npm run build` — OK | 2026-11-06 |
| `RachasFront`: `npx tsc --noEmit` — OK | 2026-11-06 |

## A — Congelar y romper

- [ ] Matriz en [`compatibilidad.md`](compatibilidad.md) revisada.
- [ ] Capturas A1/A2/A3 según [`evidencia-consignas-ab.md`](evidencia-consignas-ab.md) en `docs/evidencia/` (si aún no están).

## B — Versionado y política

- [ ] Headers `Deprecation` / `Sunset` en respuestas `/v1` (Postman o DevTools).
- [ ] `GET /version-policy` público.
- [ ] 426 + pantalla Actualizar con `MIN_APP_VERSION` mayor que la app en prueba.
- [ ] Banner de versión recomendada + dismiss (evidencia B4).
- [ ] Estado de desafío desconocido se muestra de forma genérica (BadgeEstado).

## C — Analytics

- [ ] Tabla en [`tracking-plan.md`](tracking-plan.md) coherente con `track()` en la app.
- [ ] Consentimiento ON: flujo ingreso → desafío → check-in → detalle; luego:
  - `GET /v2/analytics/reportes/personas-activas-por-dia`
  - `GET /v2/analytics/reportes/embudo-ingreso-desafio-checkin`
  - `GET /v2/analytics/reportes/checkins-por-version-app`
- [ ] Consentimiento OFF: no se envían eventos nuevos.

## D — Monitoreo

- [ ] `GET /health` → 200 con Mongo conectado.
- [ ] Log JSON por request (`requestId`, método, ruta, código, duración, versión app).
- [ ] Correlación: mismo `requestId` en log del servidor y en reporte de error cliente (boundary o global handler).

## E — Terminado

- [ ] Evidencia de rotura y de arreglo documentada (A + [`postmortem.md`](postmortem.md)).
- [ ] Al menos un trazado punta a punta con `requestId`.
- [ ] Reportes de negocio verificados contra la base (respuestas de los GET de analytics).
