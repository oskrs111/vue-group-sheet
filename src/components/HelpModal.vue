<template>
  <div class="modal-overlay help-modal-overlay" @click.self="$emit('close')">
    <div class="modal-content help-modal-content glassmorphism">
      <div class="modal-header">
        <span class="material-icons title-icon">help_outline</span>
        Guía de Usuario - Group Sheet Editor
      </div>
      <div class="modal-body help-body">
        <section class="help-section tutorial-links">
          <h3><span class="material-icons">school</span> Tutoriales</h3>
          <p>Guías paso a paso para aprender flujos completos de edición sin perderte en la interfaz.</p>
          <a
            class="tutorial-link"
            :href="tutorialScriptHref"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="material-icons">slideshow</span>
            Tutorial #1: Crear una canción con Script
          </a>
        </section>

        <section class="help-section">
          <h3><span class="material-icons">architecture</span> Conceptos Básicos</h3>
          <p>Esta aplicación es un editor WYSIWYG (lo que ves es lo que tienes) diseñado para crear <strong>hojas de ruta musicales</strong> en formato A4 (210x297mm).</p>
          <div class="alert-info">
            <span class="material-icons">monitor_weight</span>
            <strong>Indicador A4:</strong> La hoja tiene un borde <strong>azul</strong> si el contenido cabe en una página, y cambiará a <strong>rojo discontinuo</strong> si excede el tamaño A4 real de impresión.
          </div>
        </section>

        <section class="help-section">
          <h3><span class="material-icons">edit_note</span> Edición y Contenido</h3>
          <ul>
            <li><strong>Cabecera:</strong> Haz clic en el icono <span class="material-icons icon-inline">edit</span> para editar Tempo, Compás, Nombre, Autor o Tono.</li>
            <li><strong>Cuerpo:</strong> Añade secciones principales con acordes. Dentro de cada sección puedes añadir compases individuales.</li>
            <li><strong>Estructura:</strong> Es el "mapa" de la canción. Arrastra y suelta (o usa el menú) para definir el orden en que se tocan las secciones (Intro, Estrofa, Estribillo, etc.).</li>
          </ul>
        </section>

        <section class="help-section">
          <h3><span class="material-icons">music_note</span> Acordes y Notación</h3>
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
          <h3><span class="material-icons">lyrics</span> Letras</h3>
          <p>Si activas la página de letras en configuración, podrás escribir la letra de la canción. El sistema sincroniza automáticamente los nombres de las secciones para ayudarte a organizarte.</p>
        </section>

        <section class="help-section">
          <h3><span class="material-icons">download</span> Exportación y Backup</h3>
          <ul>
            <li><strong>PDF:</strong> Genera un documento listo para imprimir. La app limpiará automáticamente los controles de edición.</li>
            <li><strong>EPUB:</strong> Optimizado para lectores electrónicos tipo Kindle.</li>
            <li><strong>Biblioteca y Backup:</strong> Todas las canciones se guardan automáticamente en tu navegador. Usa "Exportar Todo" para descargar un archivo de respaldo (.json) y "Cargar Backup" para recuperarlo en otro dispositivo.</li>
          </ul>
        </section>        <section class="help-section script-help">
          <h3><span class="material-icons">code</span> Modo Script (Modo Experto)</h3>
          <p>El modo Script permite representar y editar toda la canción (Acordes, Estructura y Letras) mediante un bloque de texto plano. Es la herramienta más potente para realizar cambios estructurales masivos.</p>
          
          <div class="help-subsection">
            <h4>1. Bloque de Secciones (<code>Sections:</code>)</h4>
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
                    <li><code>%</code> : Repite el acorde anterior.</li>
                    <li><code>_</code> : Silencio (Rest).</li>
                    <li><code>/</code> : Salto de línea visual en la partitura.</li>
                    <li><code>xN</code> : Repeticiones al final de la línea (ej. <code>x2</code>).</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>

          <div class="help-subsection">
            <h4>2. Bloque de Estructura (<code>Structure:</code>)</h4>
            <p>Lista de IDs de sección separados por comas que define el orden de la canción.</p>
            <p>Ejemplo: <code>INTRO, ESTROFA, CORO, / , ESTROFA, CORO, FIN</code> (El símbolo <code>/</code> inserta un salto de línea).</p>
          </div>

          <div class="help-subsection">
            <h4>3. Bloque de Letras (<code>Lyrics:</code>)</h4>
            <p>Define el texto literario asignado a cada aparición de una sección en la estructura.</p>
            <p>Formato: <code>ID = Texto</code>. Si una sección se repite varias veces en la estructura, el sistema consumirá las definiciones de letra en orden correlativo.</p>
          </div>

          <div class="script-example-box">
            <div class="example-header">Ejemplo completo de Script:</div>
<pre><code>Sections:
CORO = |C,G..|Am,F..|%|/|x2

Structure:
CORO, CORO

Lyrics:
CORO = Letra de la primera vuelta.
CORO = Letra de la segunda con variación.</code></pre>
          </div>
        </section>

        <section class="help-section shortcuts">
          <h3><span class="material-icons">keyboard</span> Atajos de Teclado</h3>
          <div class="shortcut-grid">
            <span class="key">Ctrl + Z</span> <span>Deshacer cambios</span>
            <span class="key">Ctrl + V</span> <span>Pegar compás (en editor)</span>
            <span class="key">Ctrl + S</span> <span>Guardar canción</span>
            <span class="key">Ctrl + P</span> <span>Exportar PDF</span>
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
const tutorialScriptHref = new URL('./vue-group-sheet-tutorial-script/output/tutorial.html', window.location.href).href
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
  background: rgba(255, 255, 255, 0.03);
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
  background: rgba(255, 255, 255, 0.05);
  color: var(--ui-text-primary);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
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
  background: #1e1e24;
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
  color: #d1d5db;
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
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: var(--ui-accent);
  text-decoration: none;
  font-weight: 600;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.tutorial-link:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.24);
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
  background: rgba(59, 130, 246, 0.1);
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
  background: rgba(255, 255, 255, 0.1);
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

/* Glassmorphism adjustment for modal */
.glassmorphism {
  background: rgba(18, 18, 21, 0.9) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
