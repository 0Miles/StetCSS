<template>
  <div class="box">
    basic
    <ServerCard />
    <LayerCard />
    <BaseCard />
    <p class="probe">scoped probe</p>
  </div>
</template>

<style scoped>
@reference "./app.css";

.probe {
  color: var(--color-probe);
}
</style>
