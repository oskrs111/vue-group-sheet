<template>
  <div class="center-section">
    <TopName />
    <BottomAuthor />
  </div>
</template>

<script setup>
import TopName from './@Name.vue'
import BottomAuthor from './@Author.vue'
</script>

<style scoped>
.center-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  text-align: center;
}
</style>
