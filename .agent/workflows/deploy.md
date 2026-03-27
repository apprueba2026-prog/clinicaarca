# Flujo: Despliegue (Deploy)

Pasos para desplegar la aplicacion en produccion.

---

## Paso 1: Build Limpio

Ejecutar el build completo y verificar que no hay errores:

```bash
npm run build
```

El build debe completarse con **0 errores** y **0 advertencias**.

---

## Paso 2: Verificar `.env.example`

Confirmar que `.env.example` contiene todas las variables necesarias (sin valores reales):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Nunca incluir valores reales en este archivo.

---

## Paso 3: Configurar Variables de Entorno en Vercel

En el dashboard de Vercel, configurar todas las variables de entorno necesarias:

1. Ir a Settings > Environment Variables
2. Agregar cada variable de `.env.example` con sus valores de produccion
3. Asegurarse de que `SUPABASE_SERVICE_ROLE_KEY` solo este disponible en el servidor

---

## Paso 4: Push a Main

Enviar los cambios a la rama principal:

```bash
git push origin main
```

Vercel detectara el push y comenzara el despliegue automaticamente.

---

## Paso 5: Verificar Despliegue

1. Esperar a que Vercel complete el build
2. Verificar que el despliegue fue exitoso en el dashboard de Vercel
3. Abrir la URL de produccion y verificar que la aplicacion funciona

---

## Paso 6: Checklist Post-Despliegue

Verificar los siguientes puntos en produccion:

- [ ] La pagina principal carga correctamente
- [ ] La autenticacion funciona (login/logout)
- [ ] Los datos de Supabase se cargan correctamente
- [ ] Las imagenes y archivos estaticos se muestran
- [ ] El modo oscuro funciona
- [ ] No hay errores en la consola del navegador
- [ ] Las rutas protegidas redirigen correctamente a usuarios no autenticados
- [ ] Los formularios funcionan y validan correctamente
