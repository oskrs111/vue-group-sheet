<template>
  <div class="modal-overlay help-modal-overlay" @click.self="$emit('close')">
    <div class="modal-content help-modal-content glassmorphism">
      <div class="modal-header">
        <span class="material-icons title-icon">help_outline</span>
        Guía de Usuario - Group Sheet Editor
      </div>
      <div class="modal-body help-body">
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
        </section>

        <section class="help-section shortcuts">
          <h3><span class="material-icons">keyboard</span> Atajos de Teclado</h3>
          <div class="shortcut-grid">
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

.help-section p {
  line-height: 1.6;
  color: var(--ui-text-primary);
  margin-bottom: 10px;
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
