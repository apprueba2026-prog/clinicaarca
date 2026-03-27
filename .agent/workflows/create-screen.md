# Flujo: Crear una Nueva Pantalla

Pasos para crear una nueva pantalla (ruta) en la aplicacion.

---

## Paso 1: Crear `page.tsx`

Crear el archivo de pagina en la ruta correspondiente dentro de `app/`:

```
app/{nombre-ruta}/page.tsx
```

La pagina debe ser un **Server Component** (sin `'use client'`).

---

## Paso 2: Definir Metadata

Agregar los metadatos de la pagina para SEO:

```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Titulo de la Pagina | Clinica Arca',
  description: 'Descripcion breve de la pagina',
}
```

---

## Paso 3: Crear Servicio (si necesita datos)

Si la pantalla necesita obtener datos de Supabase, crear o extender el servicio correspondiente en `lib/services/{entidad}.service.ts`.

Recordar:
- Nunca usar `select('*')`
- Siempre paginar con `.range(from, to)`
- Tipar correctamente los datos de retorno

---

## Paso 4: Crear o Extender Store

Si la pantalla necesita estado del cliente (modales, filtros de UI, etc.), crear o extender el store de Zustand correspondiente.

Para estado del servidor (datos de API), usar TanStack Query.

---

## Paso 5: Implementar `loading.tsx`

Crear el componente de carga con skeleton:

```
app/{nombre-ruta}/loading.tsx
```

Debe reflejar la estructura visual de la pagina con placeholders animados.

---

## Paso 6: Implementar `error.tsx`

Crear el error boundary:

```
app/{nombre-ruta}/error.tsx
```

Debe ser un Client Component (`'use client'`) con boton de reintentar.

---

## Paso 7: Verificar

Ejecutar la verificacion completa:

```bash
npm run build
```

El build debe completarse con **0 errores**. Si hay errores, corregirlos antes de continuar.
