<template>
  <article class="step-card">
    <div class="step-card-header">
      <span class="step-pill">Paso {{ step.stepNumber }}</span>
      <span class="step-phase">{{ step.phaseTitle }}</span>
    </div>
    <h3>{{ step.title || step.description }}</h3>
    <p>{{ step.description }}</p>

    <div v-if="step.gifPath" class="step-media">
      <img :src="step.gifPath" :alt="step.description" />
    </div>

    <dl class="step-meta">
      <div>
        <dt>Acción</dt>
        <dd>{{ step.action }}</dd>
      </div>
      <div>
        <dt>Selector</dt>
        <dd>{{ step.selector || "Automático" }}</dd>
      </div>
    </dl>
  </article>
</template>

<script setup>
defineProps({
  step: {
    type: Object,
    required: true,
  },
});
</script>
