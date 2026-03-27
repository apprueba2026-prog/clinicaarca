# Flujo: Conectar una Tabla de Supabase

Pasos para integrar una tabla de Supabase en la aplicacion.

---

## Paso 1: Definir el Tipo

Crear o agregar el tipo de la entidad en `lib/types/`:

```typescript
// lib/types/patient.ts
export interface Patient {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
}
```

Nunca usar `any`.

---

## Paso 2: Crear el Servicio

Crear el servicio en `lib/services/{entidad}.service.ts`:

```typescript
// lib/services/patients.service.ts
import { createBrowserClient } from '@/lib/supabase/client'
import type { Patient } from '@/lib/types/patient'

export async function getPatients(from: number = 0, to: number = 19): Promise<Patient[]> {
  const supabase = createBrowserClient()

  try {
    const { data, error } = await supabase
      .from('patients')
      .select('id, name, email, phone, created_at')
      .range(from, to)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error al obtener pacientes:', error)
    throw error
  }
}
```

**NUNCA** usar `select('*')`. Siempre columnas explicitas.

---

## Paso 3: Crear Hook de TanStack Query

Crear el hook para consumir el servicio:

```typescript
// lib/hooks/use-patients.ts
import { useQuery } from '@tanstack/react-query'
import { getPatients } from '@/lib/services/patients.service'

export function usePatients(page: number = 0) {
  const from = page * 20
  const to = from + 19

  return useQuery({
    queryKey: ['patients', page],
    queryFn: () => getPatients(from, to),
  })
}
```

---

## Paso 4: Conectar al Componente

Usar el hook en el componente que muestra los datos:

```typescript
'use client'

import { usePatients } from '@/lib/hooks/use-patients'

export function PatientList() {
  const { data: patients, isLoading, error } = usePatients()

  if (isLoading) return <PatientListSkeleton />
  if (error) return <ErrorMessage message="Error al cargar pacientes" />

  return (
    <div>
      {patients?.map((patient) => (
        <PatientCard key={patient.id} {...patient} />
      ))}
    </div>
  )
}
```

---

## Paso 5: Implementar Mutaciones

Para crear, actualizar o eliminar registros, usar `useMutation` con `invalidateQueries`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPatient } from '@/lib/services/patients.service'

export function useCreatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}
```

---

## Paso 6: Verificar RLS

Asegurarse de que las politicas de Row Level Security (RLS) esten configuradas correctamente en Supabase para la tabla:

- Verificar que la tabla tenga RLS habilitado
- Verificar que existan politicas para SELECT, INSERT, UPDATE, DELETE segun corresponda
- Probar con diferentes roles de usuario
