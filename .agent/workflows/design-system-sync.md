# Flujo: Sincronizacion del Sistema de Diseno

Pasos para mantener el sistema de diseno sincronizado entre los mockups HTML y la aplicacion Next.js.

---

## Paso 1: Leer Tokens Actuales

Revisar los tokens de diseno definidos actualmente en `globals.css`:

```
app/globals.css
```

Identificar todos los CSS custom properties (variables) definidos en `:root` y `.dark`.

---

## Paso 2: Comparar con Mockups HTML

Abrir los mockups HTML de referencia y comparar:

- Colores (tokens MD3)
- Tipografia (familias, pesos, tamanos)
- Espaciado y border-radius
- Sombras
- Efectos de glassmorphism

Documentar las diferencias encontradas.

---

## Paso 3: Actualizar `globals.css`

Si se encuentran diferencias, actualizar `globals.css` con los valores correctos del mockup:

```css
:root {
  --primary: #006194;
  --primary-container: #007bb9;
  /* ... demas tokens */
}
```

Mantener la referencia completa de tokens en `rule-design.md`.

---

## Paso 4: Buscar Componentes Afectados

Identificar todos los componentes que usan los tokens modificados:

- Buscar por nombre de la clase CSS o variable
- Revisar componentes en `components/`
- Revisar paginas en `app/`

---

## Paso 5: Actualizar Clases de Tailwind

Actualizar las clases de Tailwind en los componentes afectados para que usen los tokens correctos.

Verificar que se mantiene la consistencia visual en toda la aplicacion.

---

## Paso 6: Verificar Modo Oscuro

Para cada componente actualizado:

- Verificar que las variantes `dark:` estan correctamente definidas
- Probar visualmente en modo oscuro
- Asegurar contraste adecuado entre texto y fondo

---

## Paso 7: Verificar Build

Ejecutar el build para confirmar que no se introdujeron errores:

```bash
npm run build
```

El build debe completarse con **0 errores**.
