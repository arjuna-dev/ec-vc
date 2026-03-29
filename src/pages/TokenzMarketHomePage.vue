<template>
  <q-page class="q-pa-md tokenz-page">
    <section class="tokenz-shell">
      <div class="tokenz-shell__hero">
        <div class="tokenz-shell__copy">
          <div class="tokenz-shell__eyebrow">Tokenz Market</div>
          <h2 class="tokenz-shell__title">Home</h2>
          <p class="tokenz-shell__text">
            This is the home base for the Tokenz Market layer, where wallets, markets, and vehicles
            can later connect into one token-facing operating surface.
          </p>
        </div>

        <div class="tokenz-shell__panel">
          <div class="tokenz-shell__panel-label">Current Focus</div>
          <div class="tokenz-shell__panel-value">Shape the token market structure before deeper flows.</div>
          <div class="tokenz-shell__panel-caption">This page is ready for the next token-system pass.</div>
        </div>
      </div>
    </section>
  </q-page>
</template>

<style scoped>
.tokenz-shell { display: flex; flex-direction: column; gap: 24px; }
.tokenz-shell__hero { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.9fr); gap: 18px; padding: 28px; background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,246,255,0.94)); border: 1px solid rgba(17,17,17,0.08); border-radius: 28px; box-shadow: 0 18px 42px rgba(17,17,17,0.05); }
.tokenz-shell__copy { display: flex; flex-direction: column; gap: 10px; }
.tokenz-shell__eyebrow { color: #6b7280; font-size: 0.74rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
.tokenz-shell__title { margin: 0; color: #111827; font-family: var(--font-title); font-size: clamp(2rem, 3vw, 2.7rem); font-weight: var(--font-weight-black); line-height: 0.96; }
.tokenz-shell__text, .tokenz-shell__panel-caption, .tokenz-shell__panel-value { color: #4b5563; font-family: var(--font-body); line-height: 1.55; }
.tokenz-shell__panel { display: flex; flex-direction: column; gap: 8px; padding: 18px; background: rgba(255,255,255,0.82); border: 1px solid rgba(17,17,17,0.08); border-radius: 22px; }
.tokenz-shell__panel-label { color: #6b7280; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
@media (max-width: 900px) { .tokenz-shell__hero { grid-template-columns: 1fr; } }
</style>
