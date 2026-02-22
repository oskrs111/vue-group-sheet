---
name: "vue-styling-guidelines"
description: "Pautas y convenciones para estilización (CSS) de los componentes en Vue, inspiradas en la estética Dark Modern y Glassmorphism de Loopra AI."
---

# Guía de Estilos Web para el Proyecto (Estética Loopra AI)

Este skill define las reglas obligatorias que debes seguir cada vez que se te pida crear o modificar interfaces transaccionales dentro del proyecto.

## 1. Alcance de los Estilos
- **SOLO para Menús y Herramientas**: Las reglas de esta guía aplican **exclusivamente** a componentes de la interfaz de usuario: barras de herramientas (`Toolbar`), diálogos modales, menús de secciones y controles interactivos.
- **PROHIBIDO en el canvas/hoja de la canción y Textareas Editables**: Las partituras (`.page-vertical`, `.page-horizontal`), las vistas de exportación, y los editores de letra (`.lyrics-modal-textarea`) deben permanecer inalterados. **Nunca** utilices variables globales de UI como `var(--ui-text-primary)` para textos dentro del folio o del editor de letra. Sus textos deben ser implícitamente o explícitamente negros (`#000000`) para contrastar con su fondo blanco puro.

## 2. Estética "Dark Modern / Glassmorphism" (Tipo Loopra)
La interfaz debe transmitir modernidad extrema, profundidad y tecnología de vanguardia:

- **Fondos Muy Oscuros**: El fondo base de la UI debe ser negro profundo azulado (Ej. `#030712` / `rgb(3, 7, 18)`).
- **Tarjetas, Navbars y Superficies**: Los elementos flotantes y contenedores usan fondos oscuros semitransparentes (Ej. `rgba(24, 24, 27, 0.5)` o `#18181b80`) combinados con **desenfoque** estilo "glassmorphism" (`backdrop-filter: blur(8px)`).
- **Textos**: Texto principal en blanco puro (`#ffffff`) y texto secundario o descriptivo en un gris platinado/zinc (`#a1a1aa`).
- **Acentos Vibrantes y Botones**:
  - **Color primario (Acciones clave)**: Azul brillante (`#3b82f6`).
  - **Color de información/secundario**: Celeste "Sky" (`#38bdf8`).
  - Los botones primarios usan fondos sólidos azules con sombras difusas que imitan "glow" (`box-shadow: 0 0 20px rgba(59, 130, 246, 0.4)`).
- **Radio de Borde**:
  - Opciones de menú, botones y píldoras (badges): Borde completamente redondeado (`border-radius: 9999px`).
  - Modales, listas y tarjetas: Borde cuadrado ligeramente redondeado moderno (`border-radius: 12px`).
- **Bordes**: Finos y tenues de 1px (`1px solid rgba(255, 255, 255, 0.1)`) para delimitar los componentes de manera suave.

## 3. Tipografía
- **Familia**: Uso prioritario de tipografías nítidas sans-serif como `Geist`, `Inter`, `system-ui`.
- **Grosores (Weights)**: Ligero para cuerpos (`400`), medio para botones/interfaz (`500`) y semi-negrita para títulos (`600-700`).

## 4. Microinteracciones
- **Hover States**: Aumenta el brillo (`brightness(1.1)` o `brightness(1.2)`) o aumenta sutilmente la opacidad del borde (de `0.1` a `0.2`) sobre botones transparentes. Movimientos suaves con transiciones de `0.3s ease-out`.
