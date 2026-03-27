# Reglas de Seguridad - Clinica Arca

---

## PROHIBICIONES (nunca hacer)

1. **NUNCA** leer ni mostrar el contenido de `.env.local`
2. **NUNCA** escribir claves, tokens o secretos directamente en el codigo (hardcode)
3. **NUNCA** hacer commit de archivos con credenciales al repositorio
4. **NUNCA** exponer `SUPABASE_SERVICE_ROLE_KEY` en codigo del cliente

---

## OBLIGATORIO (siempre hacer)

1. **SIEMPRE** usar `process.env.NOMBRE_VARIABLE` para acceder a credenciales
2. **SIEMPRE** mantener `.env.example` como plantilla de referencia (sin valores reales)
3. **SIEMPRE** usar `SUPABASE_SERVICE_ROLE_KEY` exclusivamente en el servidor (Server Components, Route Handlers, Server Actions)
4. **SIEMPRE** validar que las variables de entorno existan antes de usarlas

---

## Archivos Protegidos

Los siguientes archivos contienen informacion sensible y **nunca** deben ser leidos, mostrados ni incluidos en commits:

- `.env.local`
- `.env.production`

---

## Buenas Practicas

- Usar `.env.example` como referencia para documentar las variables necesarias
- Las claves publicas de Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) pueden usarse en el cliente
- Las claves privadas (`SUPABASE_SERVICE_ROLE_KEY`) solo deben usarse en el servidor
- Revisar que `.gitignore` incluya `.env.local` y `.env.production`
