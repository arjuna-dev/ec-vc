<template>
  <q-page class="components-shell-page q-pa-md">
    <section class="components-shell-page__board">
      <article class="components-shell-page__card">
        <div class="components-shell-page__card-stage">
          <button type="button" class="components-shell-page__plus-icon-button" aria-label="Add">
            <q-icon name="add" />
          </button>
        </div>
      </article>

      <article class="components-shell-page__card">
        <div class="components-shell-page__card-stage">
          <button type="button" class="components-shell-page__plus-label-button">
            <q-icon name="add" />
            <span>Add</span>
          </button>
        </div>
      </article>
    </section>
  </q-page>
</template>

<style scoped>
.components-shell-page {
  min-height: 100%;
}

.components-shell-page__board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
  align-items: start;
}

.components-shell-page__card {
  min-height: 160px;
  padding: 20px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
}

.components-shell-page__card-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
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
  .components-shell-page__card {
    padding: 20px;
  }
}
</style>
