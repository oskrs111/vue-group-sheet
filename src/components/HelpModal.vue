<template>
  <div v-dialog class="modal-overlay help-modal-overlay" @click.self="$emit('close')">
    <div class="modal-content help-modal-content">
      <div class="modal-header">
        <AppIcon class="title-icon" name="help_outline" />
        Guía de Usuario - Group Sheet Editor
      </div>
      <div class="modal-body help-body">
        <section class="help-section tutorial-links">
          <h3><AppIcon name="school" /> Manual con capturas</h3>
          <p>Aprende a crear «Rockin’ Around The Christmas Tree» con Script, editar la hoja, preparar una colección y exportarla.</p>
          <a
            class="tutorial-link"
            :href="helpHref"
            target="_blank"
            rel="noopener noreferrer"
          >
            <AppIcon name="slideshow" />
            Abrir el manual con capturas
          </a>
          <p><a :href="exampleHref" download>Descargar el script completo del ejemplo</a></p>
        </section>

        <section class="help-section">
          <h3><AppIcon name="architecture" /> Conceptos Básicos</h3>
          <p>Esta aplicación es un editor WYSIWYG (lo que ves es lo que tienes) diseñado para crear <strong>hojas de ruta musicales</strong> en formato A4 (210x297mm).</p>
          <div class="alert-info">
            <AppIcon name="monitor_weight" />
            <span><strong>Indicador A4:</strong> Un borde <strong>rojo discontinuo</strong> señala que el contenido excede el tamaño A4 de impresión.</span>
          </div>
        </section>

        <section class="help-section">
          <h3><AppIcon name="edit_note" /> Edición y Contenido</h3>
          <ul>
            <li><strong>Cabecera:</strong> Haz clic en el icono <AppIcon class="icon-inline" name="edit" /> para editar Tempo, Compás, Nombre, Autor o Tono.</li>
            <li><strong>Cuerpo:</strong> Añade secciones principales con acordes. Dentro de cada sección puedes añadir compases individuales.</li>
            <li><strong>Estructura:</strong> Es el "mapa" de la canción. Arrastra y suelta (o usa el menú) para definir el orden en que se tocan las secciones (Intro, Estrofa, Estribillo, etc.).</li>
          </ul>
        </section>

        <section class="help-section">
          <h3><AppIcon name="music_note" /> Acordes y Notación</h3>
          <p>El editor y el exportador MusicXML soportan nomenclatura estándar avanzada y Jazz:</p>
          <ul>
            <li><strong>Mayor / Menor:</strong> Usa <code>maj</code>, <code>M</code> para acordes mayores, y <code>m</code>, <code>-</code> para menores (ej. <code>Cmaj7</code>, <code>A-7</code>).</li>
            <li><strong>Extensiones:</strong> Soporta <code>7</code>, <code>9</code>, <code>11</code>, <code>13</code>, así como <code>sus2</code> y <code>sus4</code>.</li>
            <li><strong>Disminuidos:</strong> Usa <code>dim</code> u <code>o</code> para disminuidos, y <code>m7b5</code> o <code>ø</code> para semidisminuidos.</li>
            <li><strong>Aumentados:</strong> Usa <code>aug</code> o <code>+</code>.</li>
            <li><strong>Bajos e Inversiones:</strong> Utiliza la barra <code>/</code> o contrabarra <code>\</code> seguida de la nota del bajo (ej. <code>D/F#</code>, <code>G\B</code>).</li>
          </ul>
        </section>

        <section class="help-section">
          <h3><AppIcon name="lyrics" /> Letras</h3>
          <p>Si activas la página de letras en configuración, podrás escribir la letra de la canción. El sistema sincroniza automáticamente los nombres de las secciones para ayudarte a organizarte.</p>
        </section>

        <section class="help-section">
          <h3><AppIcon name="download" /> Exportación y Backup</h3>
          <ul>
            <li><strong>PDF:</strong> Genera un documento listo para imprimir. La app limpiará automáticamente los controles de edición.</li>
            <li><strong>EPUB:</strong> Optimizado para lectores electrónicos tipo Kindle.</li>
            <li><strong>Biblioteca y Backup:</strong> Guarda cada canción para activar el autoguardado. En la versión web se conserva en este navegador; en escritorio, en tu carpeta de trabajo. Usa «Exportar → Copia de seguridad» para guardar un archivo .backup y «Importar → Copia de seguridad» para recuperarlo. Elige «Fusionar bibliotecas» para combinar el contenido o «Reemplazar biblioteca…» para sustituirlo. «Cancelar» cierra la importación sin hacer cambios.</li>
          </ul>
        </section>

        <section class="help-section script-help">
          <h3><AppIcon name="code" /> Modo Script (Modo Experto)</h3>
          <p>El modo Script permite representar y editar toda la canción (Cabecera, Acordes, Estructura y Letras) mediante un bloque de texto plano. Es la herramienta más potente para realizar cambios estructurales masivos.</p>
          
          <p>Ahora el script también soporta el bloque <code>Header:</code> para editar metadatos como título, autor, tempo, compás y tono.</p>

          <div class="help-subsection">
            <h4>1. Bloque de Cabecera (<code>Header:</code>)</h4>
            <p>Define los metadatos principales de la canción. Cada línea usa el formato <code>Campo=Valor</code>.</p>
            <p>Campos soportados: <code>Name</code>, <code>Author</code>, <code>Tempo</code>, <code>Signature</code> y <code>Tone</code>.</p>
          </div>

          <div class="help-subsection">
            <h4>2. Bloque de Secciones (<code>Sections:</code>)</h4>
            <p>Define el contenido rítmico y armónico de cada sección. Formato: <code>ID = |compás1|compás2|...|</code></p>
            <div class="syntax-ref">
              <ul>
                <li><strong>Barras <code>|</code>:</strong> Delimitan un compás.</li>
                <li><strong>Comas <code>,</code>:</strong> Separan acordes dentro de un compás.</li>
                <li><strong>Duraciones (Puntos):</strong>
                  <div class="duration-table">
                    <span><code>C</code> Redonda</span>
                    <span><code>C..</code> Blanca</span>
                    <span><code>C.</code> Negra</span>
                    <span><code>C...</code> Blanca con puntillo</span>
                  </div>
                </li>
                <li><strong>Símbolos Especiales:</strong>
                  <ul>
                    <li><code>%</code> : Repite el compás anterior.</li>
                    <li><code>_</code> : Silencio (Rest).</li>
                    <li><code>/</code> : Salto de línea visual en la partitura.</li>
                    <li><code>xN</code> : Repeticiones al final de la línea (ej. <code>x2</code>).</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>

          <div class="help-subsection">
            <h4>3. Bloque de Estructura (<code>Structure:</code>)</h4>
            <p>Lista de IDs de sección separados por comas que define el orden de la canción.</p>
            <p>Ejemplo: <code>INTRO, ESTROFA, CORO, / , ESTROFA, CORO, FIN</code> (El símbolo <code>/</code> inserta un salto de línea).</p>
          </div>

          <div class="help-subsection">
            <h4>4. Bloque de Letras (<code>Lyrics:</code>)</h4>
            <p>Define el texto literario asignado a cada aparición de una sección en la estructura.</p>
            <p>Formato: <code>ID = Texto</code>. Si una sección se repite varias veces en la estructura, el sistema consumirá las definiciones de letra en orden correlativo.</p>
          </div>

          <div class="script-example-box">
            <div class="example-header">Fragmento de Rockin’ Around The Christmas Tree:</div>
<pre><code>B=|Db|%|Cm|%|Fm..,Fm7+..|Fm7|Bb7|Eb7|</code></pre>
          </div>
          <p>Dos blancas comparten el quinto compás de B. El manual incluye las seis secciones, sus 72 compases y el script completo con las letras vacías.</p>
        </section>

        <section class="help-section shortcuts">
          <h3><AppIcon name="keyboard" /> Atajos de Teclado</h3>
          <div class="shortcut-grid">
            <span class="key">Ctrl + Z</span> <span>Deshacer cambios</span>
            <span class="key">Esc</span> <span>Cerrar modales</span>
          </div>
        </section>
      </div>
      <div class="modal-footer">
        <button class="primary" @click="$emit('close')">Entendido</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['close'])
const helpHref = new URL('./help.html', window.location.href).href
const exampleHref = new URL('./help/rockin-around-the-christmas-tree.txt', window.location.href).href
</script>

<style scoped>
.help-modal-overlay {
  z-index: 2000;
}

.help-modal-content {
  max-width: 800px;
  width: 90%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.help-body {
  overflow-y: auto;
  padding: 20px;
  text-align: left;
}

.help-section {
  margin-bottom: 25px;
}

.tutorial-links {
  margin-bottom: 28px;
}

.help-section h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ui-accent);
  margin-bottom: 12px;
  border-bottom: 1px solid var(--ui-border);
  padding-bottom: 5px;
  font-size: 1.2rem;
}

.help-section h3 .material-icons {
  font-size: 22px;
}

.help-subsection {
  margin-top: 15px;
  padding-left: 10px;
}

.help-subsection h4 {
  color: var(--ui-text-primary);
  margin-bottom: 8px;
  font-size: 1rem;
  border-left: 3px solid var(--ui-accent);
  padding-left: 10px;
}

.syntax-ref {
  background: var(--ms-surface-subtle);
  padding: 12px;
  border-radius: 8px;
  margin: 10px 0;
}

.duration-table {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 10px 0;
}

.duration-table span {
  background: var(--ms-surface-subtle);
  color: var(--ui-text-primary);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  border: 1px solid var(--ms-surface-subtle);
  display: flex;
  align-items: center;
  gap: 8px;
}

.duration-table code {
  color: var(--ui-accent-hover);
  font-family: 'Geist Mono', monospace;
  font-weight: bold;
}

.script-example-box {
  margin-top: 20px;
  background: var(--ms-surface-subtle);
  border-radius: 8px;
  border: 1px solid var(--ui-border);
  overflow: hidden;
}

.example-header {
  background: var(--ui-bg-surface);
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--ui-accent);
  border-bottom: 1px solid var(--ui-border);
}

.script-example-box pre {
  margin: 0;
  padding: 15px;
  overflow-x: auto;
}

.script-example-box code {
  font-family: 'Geist Mono', monospace;
  font-size: 0.9rem;
  color: var(--ms-text);
  line-height: 1.5;
}

.help-section p {
  line-height: 1.6;
  color: var(--ui-text-primary);
  margin-bottom: 10px;
}

.tutorial-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid var(--ms-surface-subtle);
  background: var(--ms-surface-subtle);
  color: var(--ui-accent);
  text-decoration: none;
  font-weight: 600;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.tutorial-link:hover {
  background: var(--ms-surface-subtle);
  border-color: var(--ms-surface-subtle);
  transform: translateY(-1px);
}

.tutorial-link .material-icons {
  font-size: 20px;
}

.help-section ul {
  padding-left: 20px;
  list-style-type: disc;
}

.help-section li {
  margin-bottom: 8px;
  line-height: 1.4;
  color: var(--ui-text-primary);
}

.icon-inline {
  font-size: 16px !important;
  vertical-align: middle;
  color: var(--ui-accent);
}

.alert-info {
  background: var(--ms-accent-soft);
  border-left: 4px solid var(--ui-accent);
  padding: 12px;
  margin-top: 15px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
}

.alert-info .material-icons {
  color: var(--ui-accent);
}

.shortcut-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px 20px;
  align-items: center;
  margin-top: 10px;
}

.key {
  background: var(--ms-surface-subtle);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-weight: bold;
  border: 1px solid var(--ui-border);
  color: var(--ui-accent);
  font-size: 0.85rem;
}

.title-icon {
  margin-right: 10px;
  color: var(--ui-accent);
}

</style>
