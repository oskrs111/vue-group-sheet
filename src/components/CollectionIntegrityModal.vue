<template>
  <div v-dialog class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content integrity-modal">
      <div class="modal-header">Integridad de las colecciones</div>
      <div class="modal-body">
        <section v-if="check.phase !== 'idle'" class="integrity-progress" :aria-busy="check.running">
          <div class="integrity-progress-heading">
            <h3 id="integrity-progress-label">{{ check.running ? 'Comprobando biblioteca…' : check.error ? 'Error en la comprobación' : `Comprobación ${check.run} completada` }}</h3>
            <span v-if="check.phase !== 'refresh'">{{ progress }}%</span>
          </div>
          <progress aria-labelledby="integrity-progress-label" :value="check.phase === 'refresh' ? undefined : progress" max="100" />
          <p class="integrity-progress-detail" role="status">{{ check.detail }}</p>
          <p v-if="check.phase !== 'refresh'" class="integrity-progress-detail">Colecciones: {{ check.checkedCollections }} / {{ check.totalCollections }} · Referencias: {{ check.checkedReferences }} / {{ check.totalReferences }} · Ausentes: {{ check.missingReferences }}</p>
          <p v-if="check.finishedAt" class="integrity-progress-detail">Finalizada a las {{ finishedTime }}</p>
          <p v-if="check.error" class="integrity-error" role="alert">{{ check.error }}</p>
        </section>
        <template v-if="!check.running && !check.error">
          <div class="integrity-summary" :class="{ incomplete: issues.length }" role="status">
            <AppIcon :name="issues.length ? 'warning' : 'check_circle'" />
            <p v-if="issues.length">{{ issues.length }} {{ issues.length === 1 ? 'colección incompleta' : 'colecciones incompletas' }} · {{ missingCount }} {{ missingCount === 1 ? 'referencia ausente' : 'referencias ausentes' }}</p>
            <p v-else>Todas las colecciones tienen sus canciones disponibles.</p>
          </div>
          <template v-if="issues.length">
            <p class="integrity-help">Las referencias se conservan. Importa las canciones que faltan para recuperar los enlaces. La exportación de estas colecciones estará pendiente hasta que estén completas.</p>
            <section v-for="issue in issues" :key="issue.collectionId" class="integrity-collection">
              <h3>{{ issue.name }}</h3>
              <ul>
                <li v-for="song in issue.missingSongs" :key="song.position">
                  <span>Posición {{ song.position }} · Canción no encontrada</span>
                  <code>{{ song.id }}</code>
                </li>
              </ul>
            </section>
          </template>
        </template>
        <p v-if="isDesktop" class="integrity-help">También puedes copiar los archivos a Songs y pulsar «Volver a comprobar». Los nombres de archivo pueden cambiar; los enlaces usan el ID interno.</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="secondary" :disabled="check.running" @click="$emit('recheck')">{{ check.running ? 'Comprobando…' : 'Volver a comprobar' }}</button>
        <button type="button" class="primary" @click="$emit('close')">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { createIntegrityCheck, useCollectionStore } from '../stores/collectionStore'
defineEmits(['close', 'recheck'])
const store = useCollectionStore()
store.$state.integrityCheck ??= createIntegrityCheck()
const check = computed(() => store.$state.integrityCheck)
const progress = computed(() => Math.floor(check.value.completed / Math.max(1, check.value.total) * 100))
const finishedTime = computed(() => new Date(check.value.finishedAt).toLocaleTimeString('es-ES'))
const issues = computed(() => store.integrityIssues)
const missingCount = computed(() => issues.value.reduce((total, issue) => total + issue.missingSongs.length, 0))
const isDesktop = Boolean(window.electronAPI?.storage)
</script>

<style scoped>
.integrity-modal { width: min(640px, calc(100vw - 32px)); }
.integrity-progress { padding: 16px; margin-bottom: 20px; border: 1px solid var(--ms-border); border-radius: var(--ms-radius-sm); background: var(--ms-surface-subtle); }
.integrity-progress-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.integrity-progress-heading h3 { margin: 0; font-size: 13px; color: var(--ms-text); }
.integrity-progress-heading span { font-size: 12px; color: var(--ms-accent); font-variant-numeric: tabular-nums; }
.integrity-progress progress { display: block; width: 100%; height: 8px; border: 0; border-radius: 4px; overflow: hidden; accent-color: var(--ms-accent); background: var(--ms-border); }
.integrity-progress progress::-webkit-progress-bar { background: var(--ms-border); }
.integrity-progress progress::-webkit-progress-value { background: var(--ms-accent); }
.integrity-progress progress::-moz-progress-bar { background: var(--ms-accent); }
.integrity-progress-detail { margin: 10px 0 0; color: var(--ms-text-muted); font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
.integrity-error { margin: 10px 0 0; color: var(--ms-danger); font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
.integrity-summary { display: flex; align-items: center; gap: 12px; color: var(--ms-success); margin-bottom: 16px; font-weight: 600; }
.integrity-summary.incomplete { color: var(--ms-warning); }
.integrity-summary p { margin: 0; line-height: 1.5; }
.integrity-help { font-size: 12px; line-height: 1.6; color: var(--ms-text-muted); margin: 0 0 16px; }
.integrity-collection { margin-bottom: 20px; }
.integrity-collection h3 { font-size: 14px; margin-bottom: 8px; }
.integrity-collection ul { list-style: none; padding: 0; }
.integrity-collection li { display: flex; flex-direction: column; gap: 6px; padding: 10px 0; border-bottom: 1px solid var(--ms-border); font-size: 12px; }
.integrity-collection code { color: var(--ms-text-muted); overflow-wrap: anywhere; font-size: 11px; }
</style>
