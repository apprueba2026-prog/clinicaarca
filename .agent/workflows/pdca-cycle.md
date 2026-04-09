# Flujo: Ciclo PDCA (Planificar-Hacer-Verificar-Actuar)

Ciclo de desarrollo adaptado del Campus MMM para proyectos Next.js.

---

## Fase 0: Verificar Entorno

Antes de comenzar cualquier ciclo, verificar que el entorno esta listo:

```bash
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar que existe .env.local (NO leer su contenido)
ls -la .env.local

# Verificar que el proyecto compila
npm run build
```

Si alguna verificacion falla, resolver antes de continuar.

---

## PLANIFICAR (Plan)

1. **Identificar la pantalla** a desarrollar (nombre, ruta, proposito)
2. **Revisar el mockup HTML** de referencia (si existe) para entender la estructura visual
3. **Identificar las tablas de Supabase** que se necesitan consultar o modificar
4. **Definir criterios de aceptacion**:
   - Que debe mostrar la pantalla
   - Que interacciones debe soportar
   - Que datos necesita
   - Como se ve en modo oscuro

---

## HACER (Do)

Ejecutar en este orden:

### 1. Crear tipos

```
lib/types/{entidad}.ts
```

### 2. Crear servicio

```
lib/services/{entidad}.service.ts
```

Recordar: nunca `select('*')`, siempre paginar, siempre tipar.

### 3. Crear componentes

Componentes necesarios para la pantalla, siguiendo el flujo de `create-component.md`.

### 4. Crear pagina

```
app/{ruta}/page.tsx
```

Con metadata, Server Component por defecto.

### 5. Crear estados de carga y error

```
app/{ruta}/loading.tsx
app/{ruta}/error.tsx
```

---

## VERIFICAR (Check)

Ejecutar todas las verificaciones:

### 1. Build sin errores

```bash
npm run build
```

Debe completarse con **0 errores**.

### 2. Lint sin advertencias

```bash
npm run lint
```

Debe completarse con **0 advertencias**.

### 3. Prueba manual en navegador

- Navegar a la ruta en el navegador
- Verificar que los datos se cargan correctamente
- Verificar estados de carga (loading)
- Verificar manejo de errores
- Verificar modo oscuro

### 4. Comparacion visual con mockup

- Comparar la pantalla con el mockup HTML de referencia
- Verificar colores, tipografia, espaciado
- Verificar responsividad

### 5. Performance (Lighthouse)

- Correr Lighthouse en Chrome DevTools sobre la pagina modificada
- **Metricas objetivo:** Performance >= 90, LCP < 1.5s, CLS < 0.1
- Verificar que **no hay errores de hidratacion** en la consola
- **Reglas criticas para imagenes (next/image):**
  - Si CSS controla dimensiones (h-[Xpx], w-full): usar `fill` + poner h/w en el contenedor padre
  - Si CSS solo controla una dimension (h-[68px] w-auto): width/height deben coincidir con display
  - NUNCA usar width/height grandes cuando CSS los reduce (causa CLS)
  - Siempre limpiar `.next` cache despues de cambiar Image props
- **Dev mode:** Ignorar warnings de "Minify JS", "Unused JS", "bfcache" (artefactos de dev)
- **Regla de Icon fonts:** Todo componente que use web fonts (Material Symbols, etc.) DEBE tener dimensiones fijas (w-X h-X + overflow-hidden) para prevenir CLS por font swap. Los nombres de iconos como texto ("dark_mode") son mucho mas anchos que el glifo.
- **Regla de font-display:** Para `next/font` (Manrope, Inter), usar `"swap"` — Next.js genera `size-adjust` automaticamente. `"optional"` puede causar shifts sutiles en primera visita.
- **Regla de cache:** SIEMPRE limpiar `.next` despues de cambiar props de Image o dimensiones de componentes

---

## ACTUAR (Act)

### 1. Corregir errores

Si se encontraron errores en la fase de verificacion, corregirlos inmediatamente.

### 2. Refactorizar codigo duplicado

Identificar patrones repetidos y extraerlos a componentes o utilidades reutilizables.

### 3. Documentar lecciones

Registrar lo aprendido durante el ciclo:
- Problemas encontrados y como se resolvieron
- Patrones utiles descubiertos
- Mejoras para el proximo ciclo

---

## Variantes especializadas

Para cambios en areas especificas del proyecto, usa el workflow correspondiente
(extiende este, no lo reemplaza):

- **Arca Assistant (bot conversacional con Gemini)**: [pdca-bot.md](./pdca-bot.md)
  - Aplica cuando tocas `src/lib/ai/*`, `src/app/api/ai/**`,
    `src/lib/services/ai-conversation*` o `email-otp*`.
  - Anade un paso obligatorio: ejecutar `npm run test:bot` en la fase Verificar.
  - Catalogo de regresiones: [bot-test-cases.md](./bot-test-cases.md).
