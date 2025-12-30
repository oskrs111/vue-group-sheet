<template>
  <div class="left-section">
    <TopTempo />
    <BottomSignature />
  </div>
</template>

<script setup>
import TopTempo from './@Tempo.vue'
import BottomSignature from './@Signature.vue'
</script>

<style scoped>
.left-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 120px;
}
</style>
