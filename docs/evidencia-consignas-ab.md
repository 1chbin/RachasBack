# Evidencia y pruebas visuales — Consignas A y B (Parte IV)

Guardá capturas en `docs/evidencia/` (creá la carpeta) con nombres sugeridos abajo. Sirven para la entrega y para el postmortem.

**Requisitos:** back con Mongo OK (`GET /health` → 200), `npm run start:dev` en `RachasBack/`, Expo en `RachasFront/`.

Variables back en `.env` (Parte IV):

```env
MIN_APP_VERSION=1.0.0
RECOMMENDED_APP_VERSION=1.1.0
V1_SUNSET_DATE=2026-12-31
```

Front 1.1.0: `EXPO_PUBLIC_API_PREFIX=/v2` (o default en código).

---

## Consigna A — La 1.0.0 se rompe y vuelve a funcionar

### A1 — Rotura (app congelada vs back nuevo, sin v1)

1. `cd RachasFront` → `git checkout app-1.0.0`
2. En `.env`: **no** uses `/v2`; si la app llama rutas sin prefijo o sin `/v1`, dejalo como en ese tag.
3. Back en **main actual** (contrato v2 en `/v2`, adaptadores en `/v1`).
4. `npx expo start -c` → emulador o web.

**Capturar (`A1-detalle-fechaFin.png`, etc.):**

- Detalle o listado de desafío: fecha de fin vacía o raro (`finalizaEn` / `fechaFin`).
- Ranking o historial: puntos `undefined` / `NaN` si el back devuelve objeto `puntos`.
- Check-in: error **400** (falta `zonaHoraria` en v2; la 1.0.0 no lo envía si pega a v2).
- Opcional: desafío `PAUSADO` con badge raro (estado no previsto en 1.0.0).

### A2 — Compatibilidad con v1 (ya no se rompe)

1. Mismo `app-1.0.0`.
2. En `.env`: `EXPO_PUBLIC_API_PREFIX=/v1`
3. Reiniciar Expo con `-c`.

**Capturar (`A2-inicio-ok.png`):**

- Inicio / detalle con fechas y ranking coherentes.
- Check-in OK en desafío activo.

### A3 — App nueva

1. `git checkout main` (o rama con 1.1.0).
2. `.env` con `/v2` (o default).
3. Flujo normal login → desafío → check-in.

**Capturar (`A3-v2-ok.png`):** pantalla principal o detalle mostrando `finalizaEn`/estados bien.

Volvé a `main` en Front cuando termines.

---

## Consigna B — Versionado, 426 y aviso recomendado

### B1 — Headers v1 (Postman o DevTools)

1. Pedido autenticado a **`GET http://localhost:3000/v1/usuarios/me`** (Bearer Firebase).
2. En respuesta, captura headers: **`Deprecation: true`**, **`Sunset`** (fecha de `V1_SUNSET_DATE`).
3. En consola del back, línea JSON `api_v1_request`.

**Captura:** `B1-headers-v1.png`

### B2 — Política pública

1. Navegador: `http://localhost:3000/version-policy`
2. JSON: `{ "min": "1.0.0", "recommended": "1.1.0" }`

**Captura:** `B2-version-policy.png`

### B3 — 426 (versión por debajo del mínimo)

**Opción simple (sin recompilar):**

1. En `RachasBack/.env`: `MIN_APP_VERSION=1.2.0` (temporal).
2. Reiniciar back.
3. App **1.1.0** con sesión → cualquier pantalla que llame API autenticada (Inicio).

**Esperado:** redirección a pantalla **Actualizar** (`/actualizar`) o mensaje de actualización requerida.

**Captura:** `B3-pantalla-426.png`

4. Restaurar `MIN_APP_VERSION=1.0.0` y reiniciar back.

**Opción alternativa:** checkout `app-1.0.0` con back `MIN_APP_VERSION=1.1.0`.

### B4 — Aviso versión **recomendada** (descartable)

1. Back: `RECOMMENDED_APP_VERSION=1.2.0`, `MIN_APP_VERSION=1.0.0`.
2. App **1.1.0**, reiniciar Expo.
3. Banner arriba: “Hay una versión más nueva…” → **Ahora no** lo oculta.
4. Cerrar y abrir app: no debe reaparecer (dismiss guardado por versión recomendada).

**Captura:** `B4-banner-recomendado.png`

5. Restaurar `RECOMMENDED_APP_VERSION=1.1.0`.

### B5 — Estado desconocido (tolerancia forward)

No hace falta back especial: si en algún listado ves un estado raro, `BadgeEstado` muestra el texto del enum o `DESCONOCIDO`. Opcional captura.

### B6 — Demo resumida (para informe)

Tabla en el informe o postmortem:

| Escenario | Resultado esperado |
|-----------|-------------------|
| 1.0.0 sin v1 | Rotura documentada (A1) |
| 1.0.0 + `/v1` | OK (A2) |
| 1.1.0 + `/v2` | OK (A3) |
| App &lt; `MIN_APP_VERSION` | 426 → Actualizar (B3) |
| App &lt; `recommended` | Banner dismissible (B4) |

---

## Checklist rápido antes de entregar A/B

- [ ] Matriz en [`compatibilidad.md`](compatibilidad.md) completa.
- [ ] Carpeta `docs/evidencia/` con al menos A1, A2, A3, B1, B3 (y B4 si hay banner).
- [ ] Postmortem enlaza a esta guía y a las capturas.
- [ ] Quitar logs de debug del hook `useDevBackReachability` antes del commit final (hecho en código).

---

## Referencia de implementación (Consigna B — banner)

- [`RachasFront/lib/semver.ts`](../RachasFront/lib/semver.ts)
- [`RachasFront/hooks/useRecommendedUpdateBanner.ts`](../RachasFront/hooks/useRecommendedUpdateBanner.ts)
- [`RachasFront/components/system/RecommendedUpdateBanner.tsx`](../RachasFront/components/system/RecommendedUpdateBanner.tsx)
