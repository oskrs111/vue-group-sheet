<template>
  <div class="header-container">
    <LeftSection />
    <CenterSection />
    <RightSection />
  </div>
</template>

<script setup>
import LeftSection from './$Left.vue'
import CenterSection from './$Center.vue'
import RightSection from './$Right.vue'
</script>

<style scoped>
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-shrink: 0;
  min-height: 50px;
  padding-bottom: 8px;
}

.header-container :deep(.left-section),
.header-container :deep(.center-section) {
  gap: 2px;
}

.header-container :deep(.center-section) {
  min-width: 0;
}

.header-container :deep(.editable-container) {
  padding: 0 4px;
}

.header-container :deep(.name-display) {
  font-size: 20px;
  line-height: 22px;
  overflow-wrap: anywhere;
}

.header-container :deep(.author-display) {
  font-size: 12px;
  line-height: 14px;
  overflow-wrap: anywhere;
}

.header-container :deep(.tempo-display),
.header-container :deep(.signature-display),
.header-container :deep(.tone-display) {
  font-size: 16px;
  line-height: 18px;
}
</style>
