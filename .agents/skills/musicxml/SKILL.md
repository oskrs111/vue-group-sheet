---
name: "musicxml-technical-guide"
description: "Guía técnica detallada para la escritura y validación de canciones en formato MusicXML 4.0, cubriendo estructuras de partitura, notas, armonía y metadatos."
---

# Guía Técnica de MusicXML 4.0

Este skill define los estándares y estructuras para generar o interpretar archivos MusicXML. MusicXML es el formato estándar de intercambio para notación musical occidental.

## 1. Estructura de Raíz y Metadatos

### Documento Base
Un archivo MusicXML debe comenzar con la declaración XML y el DOCTYPE (aunque XSD es preferido en 4.0). El elemento raíz estándar es `score-partwise`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- En 4.0 y versiones recientes es preferido usar el DTD de la W3C -->
<!DOCTYPE score-partwise PUBLIC "-//W3C//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <!-- Contenido aquí -->
</score-partwise>
```

### Cabecera (Metadata)
- `<work>`: Título de la obra y número.
- `<identification>`: Creadores (composer, lyricist), derechos y fechas.
- `<part-list>`: **Obligatorio**. Define los instrumentos/partes. Cada `<score-part>` tiene un `id` único.

```xml
<part-list>
  <score-part id="P1">
    <part-name>Piano</part-name>
  </score-part>
</part-list>
```

## 2. Organización de Partes y Compases

El cuerpo del documento contiene elementos `<part>` que coinciden con los IDs del `<part-list>`. Dentro de cada parte, la música se organiza por compases (`<measure>`).

### Atributos del Compás (`<attributes>`)
Se definen al inicio del primer compás o cuando hay cambios:
- `<divisions>`: Define la resolución temporal (cuántas unidades hay en una negra). Fundamental para los cálculos de `<duration>`.
- `<key>`: Armadura (e.g., `<fifths>0</fifths>` para Do Mayor).
- `<time>`: Compás (e.g., 4/4 tiene `<beats>4</beats>` y `<beat-type>4</beat-type>`).
- `<clef>`: Clave (e.g., Clave de Sol: `<sign>G</sign>`, `<line>2</line>`).

## 3. Representación de Notas (`<note>`)

El elemento `<note>` es el más complejo y central.

### Pitch y Duración
- `<pitch>`: Contiene `<step>` (A-G), `<alter>` (-1, 0, 1) y `<octave>`.
- `<duration>`: Valor numérico basado en `<divisions>`.
- `<type>`: Nombre rítmico (whole, half, quarter, eighth, 16th, etc.).

### Estructuras Especiales
- `<grace/>`: Indica una apoyatura (nota de adorno). Se coloca antes del pitch y no consume duración.
- `<chord/>`: Indica que la nota forma un acorde con la nota que le precede. ¡Debe ir introducido **antes** de `<pitch>`!
- `<rest/>`: Indica un silencio. Reemplaza a `<pitch>`, puede incluir `measure="yes"` para compases de espera.
- `<tie type="start"|"stop"/>`: Indica ligadura de prolongación (aspecto sonoro, para reproducción).

### Pentagramas y Agrupación
- `<staff>`: Indica en qué pentagrama se dibuja la nota (ej. `1` clave de Sol, `2` clave de Fa en un piano).
- `<beam number="1">begin|continue|end</beam>`: Controla las uniones de plicas (barras) entre corcheas y semicorcheas.

### Notaciones y Apariencia
Ubicadas dentro de `<notations>`:
- `<tied type="start"|"stop"/>`: Representación visual de la ligadura de prolongación en la partitura.
- `<slur type="start"|"stop"/>`: Ligadura de expresión o fraseo (puede abarcar muchas notas).
- `<tuplet type="start"|"stop"/>`: Grupos irregulares (tresillos, cinquillos, etc.).
- `<articulations>`: Articulaciones como `<staccato/>`, `<accent/>`, `<tenuto/>`.

## 4. Letras y Armonía

### Letras (`<lyric>`)
Permite múltiples versos mediante el atributo `number`.
- `<text>`: El sílaba o palabra.
- `<syllabic>`: `begin`, `middle`, `end`, o `single`.
- `<extend/>`: Para melismas (líneas de extensión).

### Armonía/Acordes (`<harmony>`)
Se colocan antes de la nota donde empieza el acorde.
- `<root>`: Nota fundamental.
- `<kind>`: Tipo de acorde (major, minor, dominant, etc.).
- `<degree>`: Alteraciones o tensiones (add9, b5).

## 5. Direcciones, Flujo y Estructura (`<direction>`)

Se usa para indicaciones generales a lo largo del compás:
- `<dynamics>`: Dinámicas (ej. `p`, `mf`, `f`).
- `<metronome>`: Marcas de tempo visuales y BPM. Anidado en `<direction-type>`, define la figura base (`<beat-unit>`, ej. `quarter`) y los pulsos por minuto (`<per-minute>`, ej. `120`).
- `<words>`: Texto libre por encima o debajo del pentagrama.
- `<rehearsal>`: Marcadores de sección (ej. Intro, A1, B2). Esenciales para la navegación por secciones u organizar "Section Marks".

Además, para que el BPM afecte a la **reproducción MIDI/Audio**, se debe incluir la etiqueta `<sound tempo="120"/>` directamente como hijo de `<direction>`, al mismo nivel que `<direction-type>`.

### Barras y Repeticiones (`<barline>`)
Permiten delimitar secciones o finalizar la obra:
- Para barras especiales, se usa `<barline location="right">` o `"left"`.
- `<bar-style>`: Estilos comunes son `light-light` (doble barra), y `light-heavy` (barra final).
- `<repeat direction="forward"|"backward"/>`: Añadidos dentro de barline para denotar secciones que se repiten.

### Posicionamiento y Polifonía
- `<voice>`: Diferencia las voces/líneas melódicas activas (ej. 1, 2, 3).
- `<backup>`: Retrocede el "cabezal" de lectura en el tiempo, descontando `<duration>`. Fundamental para escribir múltiples voces en un pentagrama.
- `<forward>`: Salta tiempo hacia adelante (análogo a un silencio invisible).

## 6. Reglas de Validación y Mejores Prácticas
1. **Consistencia de Divisiones**: Mantén un valor de `<divisions>` constante a lo largo de las partes si es posible, para mantener los cálculos más simples.
2. **Orden Estricto de Elementos (Error común de XSD)**: MusicXML exige un orden exacto para los elementos anidados de `<note>`. Sigue rigurosamente este orden: 
   `grace` -> `chord` -> `pitch` (ó `rest`) -> `duration` -> `tie` -> `voice` -> `type` -> `dot` -> `accidental` -> `time-modification` -> `stem` -> `staff` -> `beam` -> `notations` -> `lyric`.
3. **Escala y Defaults**: Usa `<defaults>` a nivel raíz para definir el tamaño de página y escalado (`<scaling>`), asegurando una consistencia visual en diferentes softwares notacionales.
4. **Agrupación de Direction-Types**: Si hay varias marcas en el mismo compás y momento temporal (ej. una Rehearsal Mark y Texto), se pueden agrupar en múltiples `<direction-type>` bajo el mismo `<direction>`.
