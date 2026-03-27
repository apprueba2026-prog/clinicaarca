# Flujo: Crear un Componente

Pasos para crear un nuevo componente reutilizable.

---

## Paso 1: Determinar la Capa

Identificar en que capa del proyecto pertenece el componente:

| Capa       | Directorio           | Descripcion                               |
| ---------- | -------------------- | ----------------------------------------- |
| `ui`       | `components/ui/`     | Componentes base (Button, Input, Badge)   |
| `shared`   | `components/shared/` | Componentes compartidos entre pantallas   |
| `layout`   | `components/layout/` | Componentes de estructura (Sidebar, Nav)  |
| `charts`   | `components/charts/` | Componentes de graficos y visualizaciones |

---

## Paso 2: Crear el Archivo

Crear el archivo con nombre en `kebab-case`:

```
components/{capa}/{nombre-componente}.tsx
```

---

## Paso 3: Definir la Interfaz de Props

Definir los tipos de las propiedades del componente:

```typescript
interface PatientCardProps {
  name: string
  email: string
  status: 'active' | 'inactive'
  className?: string
}
```

---

## Paso 4: Implementar con Tokens de Tailwind

Usar los tokens del sistema de diseno definidos en `rule-design.md`:

```typescript
export function PatientCard({ name, email, status, className }: PatientCardProps) {
  return (
    <div className={cn(
      'bg-surface-container-lowest rounded-2xl shadow-sm p-4',
      'transition-all duration-300 hover:-translate-y-2 hover:shadow-xl',
      className
    )}>
      {/* contenido */}
    </div>
  )
}
```

---

## Paso 5: Agregar Variantes con `cn()`

Usar `cn()` para manejar variantes y clases condicionales:

```typescript
cn(
  'base-classes',
  status === 'active' && 'bg-primary-fixed text-on-primary-fixed',
  status === 'inactive' && 'bg-surface-variant text-on-surface-variant',
  className
)
```

---

## Paso 6: Exportar el Componente

Exportar como named export desde el archivo:

```typescript
export function PatientCard({ ... }: PatientCardProps) { ... }
```

---

## Paso 7: Marcar como Client Component (si es interactivo)

Si el componente usa:
- Event handlers (`onClick`, `onChange`, etc.)
- Hooks de React (`useState`, `useEffect`, etc.)
- APIs del navegador

Agregar `'use client'` en la primera linea del archivo:

```typescript
'use client'

export function PatientCard({ ... }: PatientCardProps) { ... }
```
