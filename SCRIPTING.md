# Sistema de Scripting para Canciones (Pseudo-código)

Este innovador sistema permite la creación, edición y almacenamiento de canciones en formato de texto plano (`pseudo-código`), facilitando la manipulación masiva de datos musicales y literarios sin necesidad de interactuar directamente con el modelo JSON subyacente.

## Estructura del Script

Un script válido se divide en tres bloques principales obligatorios, identificados por cabeceras seguidas de dos puntos:

1.  `Sections:` - Define los acordes, compases y repeticiones de cada sección.
2.  `Structure:` - Define el orden de ejecución de las secciones.
3.  `Lyrics:` - Define el texto literario asociado a cada sección.

---

## 1. Bloque de Secciones (`Sections:`)

Cada línea define el contenido armónico de una sección siguiendo el formato:
`ID = |compás1|compás2|...|xN`

### Notación de Compases y Acordes
- **Barras (`|`)**: Delimitan el inicio y fin de cada compás. Una barra doble `||` se interpreta como una sola línea divisoria compartida.
- **Comas (`,`)**: Separan múltiples acordes dentro de un mismo compás.
- **Duraciones (Puntos `.` o vacíos)**:
    - `(sin puntos)`: Redonda (División 1).
    - `.` : Negra (División 3).
    - `..` : Blanca (División 2).
    - `...` : Blanca con puntillo (División 5).
- **Acordes Especiales**:
    - `%`: Repetición del acorde anterior (Internal: `R`).
    - `_`: Silencio (Internal: `REST`).
    - `/`: Compás de salto de línea visual (Internal: `S`).

### Repeticiones
- `xN`: Al final de la línea, indica el número de vueltas o repeticiones de esa sección (ej. `x2`, `x4`).

**Ejemplo:**
`CORO = |C,G..|Am,F..|%|/|x2`

---

## 2. Bloque de Estructura (`Structure:`)

Define el flujo de la canción mediante una lista separada por comas de los IDs de sección definidos previamente.

- **IDs**: Deben coincidir exactamente con los definidos en `Sections:`.
- **Salto de Línea (`/`)**: Inserta un salto de línea visual en la partitura.

**Ejemplo:**
`INTRO, CORO, VERSO, CORO, / , SOLO, CORO, FIN`

---

## 3. Bloque de Letras (`Lyrics:`)

Asocia fragmentos de texto a cada instancia de una sección en la estructura.

### Formato
`ID = Texto de la sección`

- **Multi-línea**: El texto puede contener saltos de línea. El motor de script detecta el inicio de un nuevo ID para cerrar el anterior.
- **Orden**: Las letras se asignan a las secciones en el orden en que aparecen en el bloque `Structure:`. Si una sección se repite, el motor consumirá las entradas de `Lyrics:` en orden correlativo.
- **Codificación**: Internamente las letras se almacenan en Base64, pero el script las muestra y edita en texto plano legible.

**Ejemplo:**
```
Lyrics:
VERSO = Parte 1 de la letra
con múltiples líneas.
VERSO = Parte 2 de la letra
después del primer coro.
```

---

## Reglas de Procesamiento (Motor ScriptEngine.js)

1.  **Sincronización**: Al aplicar un script, se genera un parche que se fusiona con el estado actual. Se mantienen propiedades estéticas (colores, formas) si los IDs coinciden con los existentes.
2.  **Robustez**: El motor ignora líneas vacías y espacios innecesarios.
3.  **Seguridad**: El sistema cuenta con un sistema de **Snapshot/Undo**. Al aplicar un script, se guarda el estado previo permitiendo revertir con `Ctrl+Z` en caso de error o resultado no deseado.
4.  **Codificación de Chars**: Se utiliza `encodeURIComponent` y `unescape` para garantizar que caracteres especiales (tildes, ñ) en las letras se manejen correctamente entre el texto plano y el almacenamiento Base64.
