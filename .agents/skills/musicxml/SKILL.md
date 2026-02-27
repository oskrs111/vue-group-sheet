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
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
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
- `<chord/>`: Indica que la nota actual es parte de un acorde con la nota anterior.
- `<rest/>`: Indica un silencio. Puede incluir `measure="yes"` para silencios de compás completo.
- `<grace/>`: Indica una apoyatura (nota de adorno). Normalmente no tiene duración.
- `<tie type="start"|"stop"/>`: Indica ligadura de prolongación (aspecto sonoro).

### Notaciones y Apariencia
Dentro de `<notations>`:
- `<tied type="start"|"stop"/>`: Representación visual de la ligadura.
- `<slur type="start"|"stop"/>`: Ligadura de expresión.
- `<tuplet type="start"|"stop"/>`: Grupos irregulares (tresillos, etc.).
- `<articulations>`: `<staccato/>`, `<accent/>`, `<tenuto/>`.

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

## 5. Direcciones y Flujo (`<direction>`)

Se usa para marcas de dinámica (`<dynamics>`), tempo (`<metronome>`), o texto libre (`<words>`).

### Posicionamiento (Polyphony)
- `<backup>`: Retrocede el "cabezal" de lectura en el tiempo (útil para múltiples voces en un mismo pentagrama).
- `<forward>`: Salta tiempo hacia adelante.

## 6. Reglas de Validación y Mejores Prácticas
1. **Consistencia de Divisiones**: Mantén un valor de `<divisions>` constante si es posible para simplificar cálculos.
2. **Orden de Elementos**: MusicXML es estricto con el orden de los sub-elementos (XSD). Sigue siempre el orden: pitch/rest -> duration -> tie -> voice -> type -> dot -> accidental -> time-modification -> stem -> notehead -> notations -> lyric.
3. **Escala**: Usa `<defaults>` para definir el tamaño de página y escalado (`<scaling>`) para asegurar consistencia visual en diferentes lectores.
