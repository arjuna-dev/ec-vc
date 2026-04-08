<template>
  <section
    ref="rootRef"
    class="hero-surface"
    :style="surfaceStyle"
    @pointermove="handlePointerMove"
    @pointerleave="handlePointerLeave"
  >
    <div class="hero-surface__base" />
    <slot />
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

defineOptions({ name: 'HeroSurface' })

const rootRef = ref(null)
const pointerX = ref('50%')
const pointerY = ref('50%')
const hoverOpacity = ref(0)

const surfaceStyle = computed(() => ({
  '--hero-surface-x': pointerX.value,
  '--hero-surface-y': pointerY.value,
  '--hero-surface-opacity': hoverOpacity.value,
}))

function handlePointerMove(event) {
  const element = rootRef.value
  if (!element) return
  const rect = element.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  pointerX.value = `${Math.max(0, Math.min(100, x))}%`
  pointerY.value = `${Math.max(0, Math.min(100, y))}%`
  hoverOpacity.value = 1
}

function handlePointerLeave() {
  hoverOpacity.value = 0
}
</script>

<style scoped>
.hero-surface {
  position: relative;
  width: 100%;
  min-height: 420px;
  overflow: hidden;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: var(--ds-radius-lg);
  background:
    radial-gradient(circle at 18% 22%, rgba(38, 71, 255, 0.18), transparent 30%),
    radial-gradient(circle at 80% 78%, rgba(17, 17, 17, 0.1), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(244, 240, 232, 0.94) 100%);
  box-shadow: 0 24px 64px rgba(17, 17, 17, 0.08);
  isolation: isolate;
}

.hero-surface::before {
  position: absolute;
  inset: 0;
  content: '';
  background:
    radial-gradient(circle at var(--hero-surface-x) var(--hero-surface-y), rgba(38, 71, 255, 0.24), transparent 24%),
    radial-gradient(circle at var(--hero-surface-x) var(--hero-surface-y), rgba(38, 71, 255, 0.12), transparent 42%);
  opacity: var(--hero-surface-opacity);
  transition: opacity 160ms ease;
  pointer-events: none;
  z-index: 0;
}

.hero-surface__base {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  z-index: 0;
}
</style>
