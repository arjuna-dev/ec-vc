<template>
  <q-page class="q-pa-md tokenz-page">
    <section class="tokenz-shell">
      <div class="tokenz-shell__hero">
        <div class="tokenz-shell__copy">
          <div class="tokenz-shell__eyebrow">Tokenz Market</div>
          <h2 class="tokenz-shell__title">Markets</h2>
          <p class="tokenz-shell__text">
            This space will hold the markets layer, where token movement, signals, and future trading
            or watch activity can be modeled.
          </p>
        </div>
      </div>
    </section>
  </q-page>
</template>

<style scoped>
.tokenz-shell { display: flex; flex-direction: column; gap: 24px; }
.tokenz-shell__hero { padding: 28px; background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,246,255,0.94)); border: 1px solid rgba(17,17,17,0.08); border-radius: 28px; box-shadow: 0 18px 42px rgba(17,17,17,0.05); }
.tokenz-shell__copy { display: flex; flex-direction: column; gap: 10px; }
.tokenz-shell__eyebrow { color: #6b7280; font-size: 0.74rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
.tokenz-shell__title { margin: 0; color: #111827; font-family: var(--font-title); font-size: clamp(2rem, 3vw, 2.7rem); font-weight: var(--font-weight-black); line-height: 0.96; }
.tokenz-shell__text { color: #4b5563; font-family: var(--font-body); line-height: 1.55; }
</style>
