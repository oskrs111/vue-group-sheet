<template>
  <section class="panel">
    <div class="panel-heading">
      <p class="eyebrow">Canción de Referencia</p>
      <h2>Dark End Of Street</h2>
      <p class="panel-lead">
        Este submódulo usa el archivo real incluido en la carpeta para construir el objetivo del agente y la narrativa del tutorial.
      </p>
    </div>

    <div class="reference-grid">
      <article class="reference-card">
        <h3>Secciones</h3>
        <ul>
          <li v-for="section in reference.sections" :key="section.id">
            <strong>{{ section.id }}</strong>
            <span>{{ section.measureCount }} compases</span>
          </li>
        </ul>
      </article>

      <article class="reference-card">
        <h3>Estructura</h3>
        <p>{{ reference.structure.join(", ") }}</p>
      </article>

      <article class="reference-card">
        <h3>Letras</h3>
        <ul>
          <li v-for="entry in reference.lyrics" :key="`${entry.id}-${entry.index}`">
            <strong>{{ entry.id }}</strong>
            <span>{{ entry.preview || "(vacío)" }}</span>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>

<script setup>
defineProps({
  reference: {
    type: Object,
    required: true,
  },
});
</script>
