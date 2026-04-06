<template>
  <q-page class="components-shell-page q-pa-md">
    <section class="components-shell-page__panel">
      <div class="components-shell-page__title">Components Shell</div>
      <div class="components-shell-page__copy">
        Reusable button and control patterns will live here.
      </div>
    </section>
  </q-page>
</template>

<style scoped>
.components-shell-page {
  min-height: 100%;
}

.components-shell-page__panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 24px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.86);
}

.components-shell-page__title {
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 1.5rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.components-shell-page__copy {
  color: rgba(15, 23, 42, 0.7);
  font-family: var(--font-body);
  font-size: 0.95rem;
  line-height: 1.5;
}
</style>
