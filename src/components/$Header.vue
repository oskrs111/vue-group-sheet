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
  margin-bottom: 0px;
  padding-bottom: 20px;
}
</style>
