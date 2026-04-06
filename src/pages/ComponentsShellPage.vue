<template>
  <q-page class="components-shell-page q-pa-md">
    <section class="components-shell-page__board">
      <article
        v-for="component in componentTiles"
        :key="component.id"
        class="components-shell-page__card"
        :class="`components-shell-page__card--${component.size}`"
      >
        <div class="components-shell-page__card-stage">
          <button
            v-if="component.kind === 'plus-icon'"
            type="button"
            class="components-shell-page__plus-icon-button"
            aria-label="Add"
          >
            <q-icon name="add" />
          </button>

          <button
            v-else-if="component.kind === 'plus-label'"
            type="button"
            class="components-shell-page__plus-label-button"
          >
            <q-icon name="add" />
            <span>{{ component.label }}</span>
          </button>
        </div>
      </article>
    </section>
  </q-page>
</template>

<script setup>
const componentTiles = [
  {
    id: 'plus-icon',
    kind: 'plus-icon',
    size: 'sm',
  },
  {
    id: 'plus-label',
    kind: 'plus-label',
    size: 'md',
    label: 'Add',
  },
]
</script>

<style scoped>
.components-shell-page {
  min-height: 100%;
}

.components-shell-page__board {
  display: grid;
  grid-template-columns: repeat(auto-fill, 120px);
  grid-auto-rows: 120px;
  grid-auto-flow: dense;
  gap: 18px;
  justify-content: start;
  align-items: start;
}

.components-shell-page__card {
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  min-width: 0;
  min-height: 0;
  padding: 20px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
}

.components-shell-page__card--sm {
  grid-column: span 1;
  grid-row: span 1;
}

.components-shell-page__card--md {
  grid-column: span 2;
  grid-row: span 1;
}

.components-shell-page__card--tall {
  grid-column: span 1;
  grid-row: span 2;
}

.components-shell-page__card--lg {
  grid-column: span 2;
  grid-row: span 2;
}

.components-shell-page__card-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.components-shell-page__plus-icon-button,
.components-shell-page__plus-label-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 14px;
  color: #ffffff;
  background: #2f6bff;
  border: 1px solid #2f6bff;
  border-radius: 999px;
  box-shadow: 0 10px 24px rgba(47, 107, 255, 0.28);
  cursor: pointer;
}

.components-shell-page__plus-icon-button {
  width: 36px;
  padding: 0;
}

.components-shell-page__plus-icon-button :deep(.q-icon),
.components-shell-page__plus-label-button :deep(.q-icon) {
  font-size: 16px;
}

.components-shell-page__plus-label-button span {
  font-family: var(--font-title);
  font-size: 0.82rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
  letter-spacing: 0.01em;
}

@media (max-width: 900px) {
  .components-shell-page__board {
    grid-template-columns: repeat(auto-fill, 100px);
    grid-auto-rows: 100px;
    gap: 14px;
  }

  .components-shell-page__card {
    padding: 16px;
  }
}
</style>
