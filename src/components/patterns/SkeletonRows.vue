<script setup lang="ts">
const { rows = 5 } = defineProps<{ rows?: number }>()
</script>

<template>
  <div class="flex flex-col gap-2" aria-busy="true" aria-label="Memuat data">
    <div
      v-for="i in rows"
      :key="i"
      class="h-12 animate-pulse rounded-md bg-bg-subtle motion-reduce:animate-none"
    />
  </div>
</template>
