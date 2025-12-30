# Group Sheet Editor

Aplicación web para editar gráficamente estructuras de canciones para bandas musicales de versiones.

## Características

- **Editor WYSIWYG**: Espacio de trabajo visual tipo DIN-A4 (vertical u horizontal)
- **Cabecera configurable**: Tempo, compás, nombre de canción, autor y tono
- **Secciones de canción**: Crea y edita secciones con acordes y compases
- **Estructura visual**: Representación gráfica de la secuencia de secciones
- **Notas**: Añade notas adicionales a tus partituras
- **Persistencia**: Almacenamiento automático en localStorage del navegador
- **Exportación**: Imprime o exporta a PDF

## Tecnologías

- Vue 3
- Vite
- Pinia (gestión de estado)
- html2pdf.js (exportación PDF)

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

## Estructura de Datos

La aplicación utiliza un modelo de datos JSON que incluye:

- **$header**: Cabecera con tempo, compás, nombre, autor y tono
- **@body**: Secciones con compases y acordes
- **$structure**: Secuencia visual de las secciones
- **$notes**: Notas adicionales
- **settings**: Configuración de colores, formas y orientación

## Uso

1. **Editar campos**: Haz clic en el icono de lápiz (✏️) en cualquier campo editable
2. **Añadir secciones**: Usa el botón "+ Añadir Sección" en el cuerpo
3. **Añadir compases**: Dentro de cada sección, usa "+ Compás"
4. **Editar acordes**: Haz clic en el lápiz de cada compás para editar los acordes
5. **Estructura**: Añade elementos a la estructura para visualizar la secuencia
6. **Guardar**: Los cambios se guardan automáticamente en el navegador
7. **Exportar**: Usa los botones de la barra superior para imprimir o exportar a PDF

## Componentes

### Estructurales ($)
- `$Header.vue`: Cabecera del documento
- `$Left.vue`, `$Center.vue`, `$Right.vue`: Secciones de la cabecera
- `$Structure.vue`: Visualización de la estructura
- `$Notes.vue`: Sección de notas

### Editables (@)
- `@Tempo.vue`, `@Signature.vue`: Tempo y compás
- `@Name.vue`, `@Author.vue`: Nombre y autor
- `@Tone.vue`: Tono de la canción
- `@Body.vue`: Cuerpo con secciones
- `@Section.vue`: Sección individual
- `@Compass.vue`: Compás con acordes
- `@Chord.vue`: Acorde individual
- `@StructureItem.vue`: Elemento de estructura
- `@NoteLine.vue`: Línea de nota

## Licencia

MIT
