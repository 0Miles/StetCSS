<template>
  <p class="vue-badge">
    <span class="vue-dot"></span>
    Vue single-file component
  </p>
</template>

<style>
.vue-badge {
  @compose inline-flex items-center gap:10px px:16px py:6px r:999px font:semibold fg:slate-70;
}
</style>

<style scoped>
@reference "./style.css";

.vue-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--color-vue);
  @compose animate:pulse;
}
</style>
