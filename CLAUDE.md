# CLAUDE.md — Clínica Arca

Este archivo guía a Claude Code al trabajar en este repositorio.

## Comunicación

Toda interacción debe ser en **español**.

## Descripción del Proyecto

**Clínica Arca** — Aplicación web de gestión para una clínica dental en Perú.
Sitio público (landing) + panel administrativo (dashboard, agenda, pacientes, CMS, facturación).
Backend: Supabase. Frontend: Next.js 15. Deploy: Vercel.

## Seguridad — Credenciales y Datos Sensibles

**PROHIBICIONES ABSOLUTAS:**
- NUNCA leer, copiar, mostrar o incluir: `.env.local`, `.env.production`
- NUNCA hardcodear API keys, URLs de Supabase, secrets en código fuente
- NUNCA commitear archivos con credenciales

**OBLIGATORIO:**
- Toda credencial vía `process.env.VARIABLE`
- `.env.example` como plantilla (sin valores reales)
- `SUPABASE_SERVICE_ROLE_KEY` solo en server-side
- Verificar `.gitignore` antes de cualquier commit

## Stack Tecnológico

- **Framework:** Next.js 15 (App Router) + TypeScript strict
- **Estilos:** Tailwind CSS v4 con tokens MD3 en `@theme`
- **Estado cliente:** Zustand 5
- **Estado servidor:** TanStack Query 5
- **Tablas:** TanStack Table 8
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Formularios:** React Hook Form + Zod
- **Gráficos:** Recharts
- **Deploy:** Vercel
- **Idioma UI:** Español

## Comandos Clave

```bash
# Desarrollo
npm run dev                    # Next.js dev server (localhost:3000)

# Build y verificación
npm run build                  # Build producción (debe dar 0 errores)
npm run lint                   # ESLint
```

## Estructura de Carpetas

```
src/
├── app/
│   ├── (public)/    # Rutas públicas (home, especialidades)
│   ├── (auth)/      # Login
│   ├── (admin)/     # Panel administrativo (protegido)
│   └── api/         # API routes
├── components/
│   ├── ui/          # Átomos (Button, Input, Badge...)
│   ├── layout/      # Layouts (TopNavBar, SideNavBar, Footer)
│   ├── shared/      # Moléculas y organismos
│   └── charts/      # Gráficos Recharts
├── lib/
│   ├── supabase/    # Clientes Supabase (browser, server)
│   ├── services/    # Servicios por entidad
│   ├── types/       # TypeScript types
│   ├── utils/       # Utilities (cn, formatDate, formatCurrency)
│   └── validators/  # Zod schemas
├── hooks/           # Custom hooks
└── stores/          # Zustand stores
```

## Convenciones Supabase

- SQL scripts en `supabase/` (01-06), ordenados
- NUNCA usar `select('*')` — siempre columnas explícitas
- SIEMPRE paginar listas con `.range()`
- Schema: 14 tablas, 11 enums. Ver `.agent/rules/rule-supabase.md`

## Design System

- Color primario: `#006194` (primary)
- 46 tokens MD3 definidos en `src/app/globals.css` vía `@theme`
- Fonts: Manrope (headlines), Inter (body)
- Iconos: Material Symbols Outlined
- Dark mode: class strategy con toggle
- Glassmorphism: backdrop-blur-xl + bg opacity
- Referencia completa: `.agent/rules/rule-design.md`
- Mockups HTML: `pantallas/`

## Reglas de Código

- Server Components por defecto, `'use client'` solo cuando necesario
- TypeScript strict (nunca `any` para datos de Supabase)
- Archivos en kebab-case, componentes en PascalCase
- UI en español, código en inglés, rutas en español
- `cn()` para clases condicionales (clsx + tailwind-merge)

## Agent Workflows

Ver `.agent/workflows/` para procesos estandarizados:
- `create-screen.md` — Crear nueva pantalla
- `create-component.md` — Crear componente
- `connect-supabase-table.md` — Integrar tabla
- `pdca-cycle.md` — Ciclo de mejora continua
- `deploy.md` — Deploy a Vercel
- `design-system-sync.md` — Sincronizar tokens
