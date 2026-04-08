<template>
  <div class="hero-3col-overlay">
    <div class="hero-3col-overlay__grid">
      <section class="hero-3col-overlay__column">
        <slot name="left" />
      </section>
      <section class="hero-3col-overlay__column hero-3col-overlay__column--middle">
        <slot name="middle" />
      </section>
      <section class="hero-3col-overlay__column">
        <slot name="right" />
      </section>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'Hero3ColOverlay' })
</script>

<style scoped>
.hero-3col-overlay {
  position: absolute;
  inset: 0;
  padding: 5px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
  z-index: 1;
  border-radius: inherit;
}

.hero-3col-overlay__grid {
  display: grid;
  grid-template-columns: minmax(0, 0.25fr) minmax(0, 0.375fr) minmax(0, 0.375fr);
  gap: 24px;
  width: 100%;
  height: 100%;
}

.hero-3col-overlay__column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  min-width: 0;
  min-height: 100%;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: var(--ds-radius-md);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.hero-3col-overlay__column--middle {
  min-height: 0;
}

@media (max-width: 900px) {
  .hero-3col-overlay__grid {
    grid-template-columns: 1fr;
  }
}
</style>
