<template>
  <q-page class="q-pa-md world-page">
    <section class="world-shell">
      <div class="world-shell__hero">
        <div class="world-shell__copy">
          <div class="world-shell__eyebrow">Dealz World</div>
          <h2 class="world-shell__title">Regions</h2>
          <p class="world-shell__text">
            Define the regional map your node operates in so opportunities, companies, and artifacts
            can be organized consistently.
          </p>
        </div>

        <div class="world-shell__panel">
          <div class="world-shell__panel-label">Current Focus</div>
          <div class="world-shell__panel-value">Build the geographic backbone for the workspace.</div>
          <div class="world-shell__panel-caption">This page is ready for the next schema and UX pass.</div>
        </div>
      </div>

      <div class="world-card-grid row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-card flat bordered class="world-card">
            <q-card-section>
              <div class="world-card__eyebrow">Purpose</div>
              <div class="world-card__title">Regional structure</div>
              <div class="world-card__copy">
                Use this space to model the regions that matter to your investment and operating
                footprint.
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-6">
          <q-card flat bordered class="world-card">
            <q-card-section>
              <div class="world-card__eyebrow">Next Step</div>
              <div class="world-card__title">Connect to intake</div>
              <div class="world-card__copy">
                Once regions are formalized here, we can route incoming records and artifacts through
                them cleanly.
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </section>
  </q-page>
</template>

<style scoped>
.world-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.world-shell__hero {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.9fr);
  gap: 18px;
  padding: 28px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(244, 247, 252, 0.95));
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 28px;
  box-shadow: 0 18px 42px rgba(17, 17, 17, 0.05);
}

.world-shell__copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.world-shell__eyebrow,
.world-card__eyebrow {
  color: #6b7280;
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.world-shell__title,
.world-card__title {
  color: #111827;
  font-family: var(--font-title);
  font-weight: var(--font-weight-black);
}

.world-shell__title {
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.7rem);
  line-height: 0.96;
}

.world-shell__text,
.world-card__copy,
.world-shell__panel-caption,
.world-shell__panel-value {
  color: #4b5563;
  font-family: var(--font-body);
  line-height: 1.55;
}

.world-shell__panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 22px;
}

.world-shell__panel-label {
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.world-shell__panel-value,
.world-card__title {
  font-size: 1.05rem;
}

.world-card {
  height: 100%;
  border-radius: 22px;
  border-color: rgba(17, 17, 17, 0.08);
  background: linear-gradient(180deg, #ffffff, #f8f6f2);
  box-shadow: 0 14px 30px rgba(17, 17, 17, 0.04);
}

@media (max-width: 900px) {
  .world-shell__hero {
    grid-template-columns: 1fr;
  }
}
</style>
