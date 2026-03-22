<template>
  <section class="panel">
    <div class="panel-heading">
      <p class="eyebrow">Plan del Tutorial</p>
      <h2>Fases Guiadas</h2>
      <p class="panel-lead">
        El agente ejecuta las fases en orden fijo para producir un tutorial fácil de seguir: primero secciones, después estructura y al final letras.
      </p>
    </div>

    <div class="timeline">
      <article v-for="phase in phases" :key="phase.id" class="timeline-card">
        <div class="timeline-index">{{ phase.order }}</div>
        <div class="timeline-content">
          <h3>{{ phase.title }}</h3>
          <p>{{ phase.tutorialCopy }}</p>
          <small>Presupuesto: {{ phase.maxSteps }} pasos</small>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
defineProps({
  phases: {
    type: Array,
    required: true,
  },
});
</script>
