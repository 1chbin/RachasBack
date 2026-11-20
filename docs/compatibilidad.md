# Matriz de compatibilidad (Anexo A)

| Cambio | ¿App vieja (1.0.0) + back nuevo? | ¿App nueva (1.1.0 /v2) + back viejo? | Cómo se resuelve sin romper |
| ------ | -------------------------------- | ------------------------------------ | --------------------------- |
| Renombrar `fechaFin` por `finalizaEn` | **No** — fechas vacías en listados y detalle | **No** — el cliente v2 espera `finalizaEn` | API **v1** adapta respuestas (`fechaFin`) y **v2** expone `finalizaEn`; lógica única en services |
| Cambiar `puntos` de número a objeto | **No** — UI muestra `NaN` o suma incorrecta en ranking/historial | **No** | v1 devuelve `puntos` numérico (`total`); v2 devuelve `{ total, bonusPorRacha }` |
| Agregar estado `PAUSADO` | **No** — badge/filtros sin caso estable | **No** | v1 mapea `PAUSADO` → `ACTIVO` en JSON; v1.1.0 muestra `PAUSADO` y estados desconocidos de forma genérica |
| Campo `zonaHoraria` obligatorio en check-in (v2) | **No** — POST check-in **400** sin el campo | **No** — back viejo no validaba igual | v1 rellena zona desde perfil; v2 exige body; mismas reglas de negocio en el service |
| Campo opcional `bonusPorRacha` en respuesta v2 | Parcial — app vieja lo ignora si no parsea objeto | **Sí** — forward compatible | Solo en contrato v2; v1 no lo expone |
| Eliminar rutas sin prefijo `/v1`/`/v2` | **No** — 404 si solo existían rutas legacy | N/A | Cliente 1.0.0 usa **`/v1`**; 1.1.0 usa **`/v2`** |
| Identificador numérico en subrecurso (ejemplo documentado) | **No** si el cliente asume string | **No** | Mantener `id` string en v1/v2; cambios de tipo solo en major version |

## Evidencia — app **1.0.0** (tag `app-1.0.0`) vs back Parte IV sin v1

Probado con el back que expone contrato v2 en `/v2` y la app congelada que llama `/desafios` sin prefijo y tipos v1:

1. **`finalizaEn`:** Inicio/Explorar/Detalle dejan de mostrar fin de desafío (`fechaFin` undefined).
2. **`puntos` objeto:** Historial del detalle y eventos WS muestran `+undefined pts` o desorden en ranking.
3. **`PAUSADO`:** Si un desafío está pausado, la app 1.0.0 no tiene estilo/label dedicado (badge genérico o estado crudo).
4. **`zonaHoraria` en check-in:** Cualquier check-in devuelve **400** porque el cliente no envía el campo.

Con **v1** (`EXPO_PUBLIC_API_PREFIX=/v1`) la app 1.0.0 vuelve a operar; con **1.1.0** y `/v2` el contrato nuevo es consistente.

## Tag `app-1.0.0`

```powershell
cd RachasFront
git checkout app-1.0.0
# Back compatible: usar commit/tag app-1.0.0 en RachasBack o v1 en back actual con EXPO_PUBLIC_API_PREFIX=/v1
```

Versión actual de producto: **1.1.0** + prefijo **`/v2`**.

## Pruebas visuales y capturas

Guía paso a paso (nombres de archivos sugeridos, escenarios 426 y banner recomendado): [`evidencia-consignas-ab.md`](evidencia-consignas-ab.md). Guardá PNG en `docs/evidencia/`.
