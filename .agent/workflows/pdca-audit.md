# Workflow: Auditoría Pre-Lanzamiento (PDCA-Audit)

Extiende la fase **Check** del [pdca-cycle.md](./pdca-cycle.md) con una auditoría 360° automatizada vía el subagente `arca-auditor`.

## Cuándo ejecutar

- **Obligatorio**: antes de cualquier deploy a producción (Vercel main).
- **Recomendado**: al cerrar una fase grande (ej. Fase 7 → Fase 8) o tras un refactor estructural.
- **Bajo demanda**: cuando el usuario diga "auditar", "pre-launch", "revisar antes de lanzar".

## Pre-requisitos (CRÍTICO)

> ⚠️ **Performance NUNCA se mide en `next dev`.** El score es artificialmente bajo por HMR WebSocket, ausencia de minify, chunks de React DevTools y bundles sin tree-shake. Medirlo en dev produce **falsos positivos** en Minify JS, Reduce Unused JS, Legacy JS y bfcache.

Antes de invocar al auditor:

```bash
# 1. Build de producción limpio
npm run build

# 2. Servir build de producción
npm start

# 3. Lighthouse en ventana incógnito contra http://localhost:3000
```

## Invocación

```
@arca-auditor ejecuta auditoría pre-lanzamiento completa
```

O con scope acotado:

```
@arca-auditor revisa solo D4 (Seguridad Web) y D5 (Supabase/RLS)
```

## Los 7 dominios

| ID  | Dominio | Foco principal |
|-----|---------|----------------|
| D1  | Performance | LCP, CLS, INP, bundle, imágenes |
| D2  | SEO | metadata, sitemap, JSON-LD, alts |
| D3  | Accesibilidad | contraste, aria, foco, formularios |
| D4  | Seguridad Web | headers, CSP, secretos, middleware |
| D5  | Supabase / DB | RLS, `select('*')`, `.range()`, indexes |
| D6  | Calidad código | build, lint, tsc, `any`, console.log |
| D7  | Bot + Observabilidad | `npm run test:bot`, error handling |

Detalle completo en [`.claude/agents/arca-auditor.md`](../../.claude/agents/arca-auditor.md).

## Salida esperada

Reporte markdown con:
- Resumen ejecutivo (conteo P0/P1/P2)
- Tabla de hallazgos por dominio (`ID | Sev | Hallazgo | Archivo:línea | Recomendación`)
- Plan de remediación priorizado
- Comandos ejecutados con resultado

## Criterios de aprobación para lanzamiento

- ✅ **0 hallazgos P0**
- ✅ Build, lint y test:bot en verde
- ✅ Lighthouse (prod): Performance ≥ 90, Accessibility ≥ 95, Best Practices = 100, SEO = 100
- ✅ Headers de seguridad configurados en `next.config.ts`
- ✅ RLS habilitado en las 14 tablas de Supabase

## Iteración PDCA

1. **Plan**: invocar auditor → obtener reporte
2. **Do**: el agente principal implementa fixes priorizados (NO el auditor)
3. **Check**: re-invocar auditor sobre los dominios afectados
4. **Act**: si quedan P0 → repetir; si todo verde → deploy
