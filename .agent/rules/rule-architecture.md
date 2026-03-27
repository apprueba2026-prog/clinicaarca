# Reglas de Arquitectura - Clinica Arca

---

## Server Components por Defecto

- Todos los componentes son **Server Components** por defecto
- Solo agregar `'use client'` cuando sea estrictamente necesario (interactividad, hooks del navegador, event handlers)
- Las **pages** (`page.tsx`) son Server Components que obtienen datos directamente

---

## Manejo de Estado

| Tipo de estado   | Herramienta          | Uso                                      |
| ---------------- | -------------------- | ---------------------------------------- |
| Estado servidor  | TanStack Query       | Cache, fetching, sincronizacion con API  |
| Estado cliente   | Zustand              | Estado global de UI (modales, sidebar)   |
| Estado URL       | `useSearchParams`    | Filtros, paginacion, busqueda            |

---

## Convenciones de Nombres

| Elemento         | Convencion    | Ejemplo                          |
| ---------------- | ------------- | -------------------------------- |
| Archivos         | `kebab-case`  | `patient-card.tsx`               |
| Componentes      | `PascalCase`  | `PatientCard`                    |
| Hooks            | `camelCase`   | `usePatients` (prefijo `use`)    |
| Tipos/Interfaces | `PascalCase`  | `Patient`, `AppointmentStatus`   |

---

## Idioma

| Contexto                  | Idioma   | Ejemplo                              |
| ------------------------- | -------- | ------------------------------------ |
| Interfaz de usuario (UI)  | Espanol  | "Pacientes", "Nueva Cita"           |
| Variables y funciones     | Ingles   | `getPatients()`, `appointmentDate`   |
| Rutas (URLs)              | Espanol  | `/pacientes`, `/citas`               |
| Comentarios en codigo     | Espanol  | `// Obtener lista de pacientes`      |

---

## Utilidades y Validacion

- **`cn()`**: Usar para clases condicionales de Tailwind (clsx + tailwind-merge)
- **Zod**: Validacion de esquemas para formularios y datos de API
- **React Hook Form**: Manejo de formularios con integracion Zod

```typescript
const schema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Email invalido'),
})
```

---

## Manejo de Errores y Carga

Cada ruta debe incluir:

| Archivo        | Proposito                                           |
| -------------- | --------------------------------------------------- |
| `error.tsx`    | Error boundary para capturar errores de la ruta     |
| `loading.tsx`  | Estado de carga con skeleton o spinner              |

Ademas, usar componentes skeleton para estados de carga parciales dentro de la pagina.

```
app/
  pacientes/
    page.tsx
    loading.tsx
    error.tsx
```
