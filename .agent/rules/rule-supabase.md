# Reglas de Supabase - Clinica Arca

---

## Consultas

### NUNCA usar `select('*')`

Siempre especificar las columnas explicitas que se necesitan:

```typescript
// MAL
const { data } = await supabase.from('patients').select('*')

// BIEN
const { data } = await supabase.from('patients').select('id, name, email, phone')
```

### SIEMPRE paginar con `.range(from, to)`

```typescript
const { data } = await supabase
  .from('patients')
  .select('id, name, email')
  .range(0, 19) // primeros 20 registros
```

---

## Estructura de Servicios

Los servicios se ubican en `lib/services/{entidad}.service.ts`:

```
lib/services/
  patients.service.ts
  appointments.service.ts
  invoices.service.ts
  ...
```

---

## Clientes de Supabase

| Contexto            | Funcion                |
| ------------------- | ---------------------- |
| Client Components   | `createBrowserClient()` |
| Server Components   | `createServerClient()`  |

---

## Manejo de Errores

Siempre usar `try/catch` en las llamadas a Supabase:

```typescript
try {
  const { data, error } = await supabase
    .from('patients')
    .select('id, name, email')
    .range(0, 19)

  if (error) throw error
  return data
} catch (error) {
  console.error('Error al obtener pacientes:', error)
  throw error
}
```

---

## Tipos

- **NUNCA** usar `any`
- Definir tipos explicitos para todas las entidades en `lib/types/`

```typescript
// BIEN
interface Patient {
  id: string
  name: string
  email: string
  phone: string
}

// MAL
const data: any = ...
```

---

## Scripts SQL

Los scripts SQL se versionan en el directorio `supabase/` con prefijo numerico:

```
supabase/
  01-schema.sql
  02-tables.sql
  03-rls.sql
  04-functions.sql
  05-triggers.sql
  06-seed.sql
```

---

## Storage Buckets

| Bucket               | Acceso         | Descripcion                      |
| -------------------- | -------------- | -------------------------------- |
| `testimonial-videos` | Lectura publica | Videos de testimonios de pacientes |
| `avatars`            | Lectura publica | Fotos de perfil de usuarios       |
| `news-images`        | Lectura publica | Imagenes para noticias y blog     |
| `invoice-pdfs`       | Privado         | PDFs de facturas (solo autenticados) |
