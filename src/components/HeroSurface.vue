<template>
  <section
    ref="rootRef"
    class="hero-surface"
    :class="{ 'hero-surface--collapsed': collapsed }"
    :style="surfaceStyle"
    @pointermove="handlePointerMove"
    @pointerleave="handlePointerLeave"
  >
    <div class="hero-surface__base" />
    <button
      v-if="showCollapseToggle"
      type="button"
      class="hero-surface__collapse-toggle"
      :aria-label="collapsed ? expandAriaLabel : collapseAriaLabel"
      @click="$emit('toggle-collapse')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" class="hero-surface__collapse-icon">
        <path :d="collapsed ? 'M7 10L12 15L17 10' : 'M7 14L12 9L17 14'" />
      </svg>
    </button>
    <div v-if="collapsed" class="hero-surface__collapsed">
      <slot name="collapsed" />
    </div>
    <div v-else class="hero-surface__content">
      <slot />
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

defineOptions({ name: 'HeroSurface' })
defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
  showCollapseToggle: {
    type: Boolean,
    default: false,
  },
  collapseAriaLabel: {
    type: String,
    default: 'Collapse hero',
  },
  expandAriaLabel: {
    type: String,
    default: 'Expand hero',
  },
})
defineEmits(['toggle-collapse'])

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
  display: block;
  width: 100%;
  min-width: 100%;
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

.hero-surface--collapsed {
  min-height: 86px;
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

.hero-surface__content,
.hero-surface__collapsed {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}

.hero-surface__collapsed {
  display: flex;
  align-items: center;
  min-height: 86px;
  padding: 18px 56px 18px 20px;
}

.hero-surface__collapse-toggle {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: rgba(17, 17, 17, 0.72);
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  cursor: pointer;
  backdrop-filter: blur(10px);
}

.hero-surface__collapse-toggle:hover {
  color: rgba(17, 17, 17, 0.92);
  background: rgba(255, 255, 255, 0.92);
}

.hero-surface__collapse-icon {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
