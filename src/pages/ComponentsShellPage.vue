<template>
  <q-page class="components-shell-page q-pa-md">
    <section class="components-shell-page__hero">
      <div class="components-shell-page__eyebrow">Shared Controls</div>
      <h1 class="components-shell-page__title">Components Shell</h1>
      <div class="components-shell-page__copy">
        A living board for the reusable controls we want to copy literally across shells.
      </div>
    </section>

    <section class="components-shell-page__board">
      <article class="components-shell-page__card">
        <div class="components-shell-page__card-head">
          <div class="components-shell-page__card-title">Plus Icon</div>
          <div class="components-shell-page__card-tag">Control 01</div>
        </div>
        <div class="components-shell-page__card-stage">
          <button type="button" class="components-shell-page__plus-icon-button" aria-label="Add">
            <q-icon name="add" />
          </button>
        </div>
      </article>

      <article class="components-shell-page__card">
        <div class="components-shell-page__card-head">
          <div class="components-shell-page__card-title">Plus With Label</div>
          <div class="components-shell-page__card-tag">Control 02</div>
        </div>
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
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.components-shell-page__hero {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 28px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(243, 247, 255, 0.94)),
    linear-gradient(180deg, rgba(47, 107, 255, 0.08), transparent);
}

.components-shell-page__eyebrow {
  color: #2f6bff;
  font-family: var(--font-title);
  font-size: 0.76rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
}

.components-shell-page__title {
  margin: 0;
  color: #0f172a;
  font-family: var(--font-title);
  font-size: clamp(1.8rem, 3.1vw, 2.8rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.components-shell-page__copy {
  max-width: 760px;
  color: rgba(15, 23, 42, 0.72);
  font-family: var(--font-body);
  font-size: 0.98rem;
  line-height: 1.55;
}

.components-shell-page__board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
  align-items: start;
}

.components-shell-page__card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 220px;
  padding: 22px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
}

.components-shell-page__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.components-shell-page__card-title {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.components-shell-page__card-tag {
  padding: 6px 9px;
  color: #fff;
  background: #111827;
  border-radius: 999px;
  font-family: var(--font-title);
  font-size: 0.66rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
}

.components-shell-page__card-stage {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 1px dashed rgba(15, 23, 42, 0.12);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.9));
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
  .components-shell-page__hero,
  .components-shell-page__card {
    padding: 20px;
  }
}
</style>
