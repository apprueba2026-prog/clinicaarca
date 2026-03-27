# Sistema de Diseno - Clinica Arca

Referencia completa del sistema de diseno basado en Material Design 3 (MD3).

---

## Tokens de Color MD3 (46 tokens)

### Primary

| Token                        | Valor     |
| ---------------------------- | --------- |
| `primary`                    | `#006194` |
| `primary-container`          | `#007bb9` |
| `primary-fixed`              | `#cce5ff` |
| `primary-fixed-dim`          | `#93ccff` |
| `on-primary`                 | `#ffffff` |
| `on-primary-container`       | `#fdfcff` |
| `on-primary-fixed`           | `#001d31` |
| `on-primary-fixed-variant`   | `#004b73` |

### Secondary

| Token                          | Valor     |
| ------------------------------ | --------- |
| `secondary`                    | `#565e74` |
| `secondary-container`          | `#dae2fd` |
| `secondary-fixed`              | `#dae2fd` |
| `secondary-fixed-dim`          | `#bec6e0` |
| `on-secondary`                 | `#ffffff` |
| `on-secondary-container`       | `#5c647a` |
| `on-secondary-fixed`           | `#131b2e` |
| `on-secondary-fixed-variant`   | `#3f465c` |

### Tertiary

| Token                         | Valor     |
| ----------------------------- | --------- |
| `tertiary`                    | `#006387` |
| `tertiary-container`          | `#007da9` |
| `tertiary-fixed`              | `#c4e7ff` |
| `tertiary-fixed-dim`          | `#7bd0ff` |
| `on-tertiary`                 | `#ffffff` |
| `on-tertiary-container`       | `#fcfcff` |
| `on-tertiary-fixed`           | `#001e2c` |
| `on-tertiary-fixed-variant`   | `#004c69` |

### Error

| Token               | Valor     |
| -------------------- | --------- |
| `error`              | `#ba1a1a` |
| `error-container`    | `#ffdad6` |
| `on-error`           | `#ffffff` |
| `on-error-container` | `#93000a` |

### Surface

| Token                       | Valor     |
| --------------------------- | --------- |
| `surface`                   | `#f7f9fb` |
| `surface-dim`               | `#d8dadc` |
| `surface-bright`            | `#f7f9fb` |
| `surface-variant`           | `#e0e3e5` |
| `surface-tint`              | `#006398` |
| `surface-container`         | `#eceef0` |
| `surface-container-low`     | `#f2f4f6` |
| `surface-container-high`    | `#e6e8ea` |
| `surface-container-highest` | `#e0e3e5` |
| `surface-container-lowest`  | `#ffffff` |
| `on-surface`                | `#191c1e` |
| `on-surface-variant`        | `#3f4850` |

### Outline

| Token             | Valor     |
| ----------------- | --------- |
| `outline`         | `#707881` |
| `outline-variant` | `#bfc7d2` |

### Background

| Token           | Valor     |
| --------------- | --------- |
| `background`    | `#f7f9fb` |
| `on-background` | `#191c1e` |

### Inverse

| Token                | Valor     |
| -------------------- | --------- |
| `inverse-surface`    | `#2d3133` |
| `inverse-on-surface` | `#eff1f3` |
| `inverse-primary`    | `#93ccff` |

---

## Tipografia

### Manrope (titulos y encabezados)

- Uso: headline, display, title
- Pesos: 400 (regular), 600 (semibold), 700 (bold), 800 (extrabold)

### Inter (cuerpo y etiquetas)

- Uso: body, label, caption
- Pesos: 400 (regular), 500 (medium), 600 (semibold)

---

## Iconografia

- Libreria: **Material Symbols Outlined**
- Configuracion:
  ```css
  font-variation-settings: 'FILL' 0, 'wght' 400;
  ```

---

## Border Radius

| Token | Valor       |
| ----- | ----------- |
| `xs`  | `0.125rem`  |
| `sm`  | `0.25rem`   |
| `md`  | `0.5rem`    |
| `lg`  | `0.75rem`   |
| `xl`  | `1rem`      |
| `2xl` | `1.5rem`    |

---

## Glassmorphism

```css
/* Modo claro */
backdrop-filter: blur(24px); /* backdrop-blur-xl */
background: rgba(255, 255, 255, 0.7); /* bg-white/70 */

/* Modo oscuro */
backdrop-filter: blur(24px); /* backdrop-blur-xl */
background: rgba(15, 23, 42, 0.7); /* bg-slate-900/70 */
```

---

## Componentes Base

### Sidebar

- Ancho: `w-64`
- Fondo: `bg-slate-50`

### Cards

- Fondo: `bg-surface-container-lowest`
- Bordes: `rounded-2xl` o `rounded-3xl`
- Sombra: `shadow-sm`

### Botones

- Primario: `bg-primary text-on-primary`
- Bordes: `rounded-xl`
- Sombra: `shadow-lg shadow-primary/20`

### Badges

- Estilo: `inline-flex rounded-full text-[10px] font-bold uppercase`

---

## Interacciones y Animaciones

### Hover

```
hover:-translate-y-2
hover:shadow-xl
active:scale-95
```

### Transiciones

```
transition-all duration-300
```

---

## Estado de Seleccion

```
bg-primary-fixed text-on-primary-fixed
```

---

## Modo Oscuro

Patrones de uso:

```
bg-white dark:bg-slate-900
text-slate-900 dark:text-white
```

Siempre incluir variantes `dark:` en los componentes que requieran soporte de modo oscuro.
