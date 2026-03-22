<template>
  <div class="app-shell">
    <header class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Vue Group Sheet Tutorial Builder</p>
        <h1>Tutorial animado, guiado por agente</h1>
        <p class="hero-text">
          Este submódulo genera un tutorial HTML con GIFs a partir de una exploración autónoma de la aplicación. El flujo de ejemplo enseña a montar
          <strong>Dark End Of Street</strong> en tres etapas: secciones, estructura y letras.
        </p>
      </div>

      <div class="hero-stats">
        <div class="stat-card">
          <span class="stat-label">Secciones</span>
          <strong>{{ reference.summary.sectionCount }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Bloques de letra</span>
          <strong>{{ reference.summary.lyricCount }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">Fases del tutorial</span>
          <strong>{{ phases.length }}</strong>
        </div>
      </div>
    </header>

    <main class="content-grid">
      <div class="content-column">
        <ReferenceSongPanel :reference="reference" />
        <PhaseTimeline :phases="phases" />
        <RunChecklist />
      </div>

      <aside class="content-column">
        <section class="panel">
          <div class="panel-heading">
            <p class="eyebrow">Visor</p>
            <h2>Previsualizar un tutorial generado</h2>
            <p class="panel-lead">
              Carga el fichero <code>tutorial-data.json</code> producido por el runner para revisar los pasos desde esta interfaz Vue.
            </p>
          </div>

          <label class="upload-box">
            <input type="file" accept=".json" @change="handleTutorialUpload" />
            <span>Selecciona un <code>tutorial-data.json</code></span>
          </label>

          <p v-if="uploadError" class="error-text">{{ uploadError }}</p>

          <div class="viewer-summary">
            <div>
              <span class="viewer-label">Fases cargadas</span>
              <strong>{{ phaseCount }}</strong>
            </div>
            <div>
              <span class="viewer-label">Pasos cargados</span>
              <strong>{{ stepCount }}</strong>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-heading">
            <p class="eyebrow">Prompts</p>
            <h2>Resumen de decisión</h2>
            <p class="panel-lead">
              El sistema pasa al modelo un resumen del estado actual, el objetivo global, la fase activa, el historial de pasos y las acciones recientes.
            </p>
          </div>

          <pre class="prompt-preview">{{ goal }}</pre>
        </section>

        <section class="panel" v-if="uploadedTutorial">
          <div class="panel-heading">
            <p class="eyebrow">Pasos</p>
            <h2>{{ uploadedTutorial.meta?.title || "Tutorial cargado" }}</h2>
          </div>

          <div class="steps-list">
            <StepCard v-for="step in uploadedTutorial.steps || []" :key="step.id" :step="step" />
          </div>
        </section>
      </aside>
    </main>
  </div>
</template>

<script setup>
import referenceSongRaw from "../Dark End Of Street.txt?raw";
import PhaseTimeline from "./components/PhaseTimeline.vue";
import ReferenceSongPanel from "./components/ReferenceSongPanel.vue";
import RunChecklist from "./components/RunChecklist.vue";
import StepCard from "./components/StepCard.vue";
import { useTutorialData } from "./composables/useTutorialData";
import { parseReferenceSongText } from "../shared/referenceSongParser.js";
import { buildTutorialGoal, buildTutorialPhases } from "../shared/tutorialPhases.js";

const reference = parseReferenceSongText(referenceSongRaw);
const phases = buildTutorialPhases(reference);
const goal = buildTutorialGoal(reference);

const { uploadedTutorial, uploadError, phaseCount, stepCount, loadTutorialFile } = useTutorialData();

const handleTutorialUpload = async (event) => {
  await loadTutorialFile(event.target.files?.[0]);
};
</script>
