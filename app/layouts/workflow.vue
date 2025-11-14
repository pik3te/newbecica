<script setup lang="ts">
import { computed } from 'vue'

const colorMode = useColorMode()

const containerClasses = computed(() =>
  colorMode.value === 'dark'
    ? 'bg-slate-950 text-slate-100'
    : 'bg-white text-slate-900'
)
</script>

<template>
  <div :class="['min-h-screen w-screen transition-colors', containerClasses]">
    <slot />
  </div>
</template>
