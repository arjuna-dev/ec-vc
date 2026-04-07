<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="add-edit-bb-shell">
      <q-card-section class="add-edit-bb-shell__head">
        <div>
          <div class="add-edit-bb-shell__eyebrow">Add/Edit BB Shell</div>
          <div class="add-edit-bb-shell__title">{{ detail?.title || 'Building Block' }}</div>
        </div>
        <button
          type="button"
          class="add-edit-bb-shell__close"
          aria-label="Close details"
          @click="$emit('update:modelValue', false)"
        >
          <q-icon name="close" />
        </button>
      </q-card-section>

      <q-card-section class="add-edit-bb-shell__body">
        <div class="add-edit-bb-shell__meta">
          <div class="add-edit-bb-shell__label">ID</div>
          <div class="add-edit-bb-shell__value">{{ detail?.id || '' }}</div>
        </div>

        <div class="add-edit-bb-shell__meta">
          <div class="add-edit-bb-shell__label">Status</div>
          <div class="add-edit-bb-shell__status-row">
            <span
              class="add-edit-bb-shell__status"
              :class="detail?.status === 'canonical'
                ? 'add-edit-bb-shell__status--canonical'
                : 'add-edit-bb-shell__status--extract'"
            >
              {{ detail?.statusLabel || '' }}
            </span>
          </div>
        </div>

        <div v-if="detail?.source" class="add-edit-bb-shell__meta">
          <div class="add-edit-bb-shell__label">Shared Source</div>
          <div class="add-edit-bb-shell__value">{{ detail?.source }}</div>
        </div>

        <div class="add-edit-bb-shell__meta">
          <div class="add-edit-bb-shell__label">Use</div>
          <div class="add-edit-bb-shell__copy">{{ detail?.summary || '' }}</div>
        </div>

        <div class="add-edit-bb-shell__meta">
          <div class="add-edit-bb-shell__label">Where Used</div>
          <ul class="add-edit-bb-shell__list">
            <li v-for="item in detail?.usedIn || []" :key="item">{{ item }}</li>
          </ul>
        </div>

        <div v-if="(detail?.usedInShells || []).length" class="add-edit-bb-shell__meta">
          <div class="add-edit-bb-shell__label">Used In Shells</div>
          <ul class="add-edit-bb-shell__list">
            <li v-for="item in detail?.usedInShells || []" :key="item">{{ item }}</li>
          </ul>
        </div>

        <div class="add-edit-bb-shell__meta">
          <div class="add-edit-bb-shell__label">Anatomy</div>
          <ul class="add-edit-bb-shell__list">
            <li v-for="item in detail?.anatomy || []" :key="item">{{ item }}</li>
          </ul>
        </div>

        <div class="add-edit-bb-shell__meta">
          <div class="add-edit-bb-shell__label">Reconstruction Notes</div>
          <ul class="add-edit-bb-shell__list">
            <li v-for="item in detail?.reconstructionNotes || []" :key="item">{{ item }}</li>
          </ul>
        </div>

        <div v-if="detail?.nextStep" class="add-edit-bb-shell__meta">
          <div class="add-edit-bb-shell__label">Next Step</div>
          <div class="add-edit-bb-shell__copy">{{ detail?.nextStep }}</div>
        </div>

        <div class="add-edit-bb-shell__meta">
          <div class="add-edit-bb-shell__label">Prompt</div>
          <textarea
            readonly
            class="add-edit-bb-shell__prompt"
            :value="detail?.prompt || ''"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  detail: {
    type: Object,
    default: null,
  },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.add-edit-bb-shell {
  width: min(760px, calc(100vw - 32px));
  border-radius: 10px;
}

.add-edit-bb-shell__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.add-edit-bb-shell__eyebrow {
  color: rgba(15, 23, 42, 0.58);
  font-family: var(--font-title);
  font-size: 0.72rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
}

.add-edit-bb-shell__title {
  margin-top: 8px;
  color: #0f172a;
  font-family: var(--font-title);
  font-size: 1.35rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.add-edit-bb-shell__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: #111111;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.add-edit-bb-shell__body {
  display: grid;
  gap: 16px;
}

.add-edit-bb-shell__meta {
  display: grid;
  gap: 8px;
}

.add-edit-bb-shell__label {
  color: rgba(15, 23, 42, 0.58);
  font-family: var(--font-title);
  font-size: 0.72rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
}

.add-edit-bb-shell__value,
.add-edit-bb-shell__copy,
.add-edit-bb-shell__list {
  color: #0f172a;
  font-family: var(--font-body);
  font-size: 0.94rem;
  line-height: 1.5;
}

.add-edit-bb-shell__list {
  margin: 0;
  padding-left: 18px;
}

.add-edit-bb-shell__status-row {
  display: flex;
  align-items: center;
}

.add-edit-bb-shell__status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border: 1px solid transparent;
  font-family: var(--font-title);
  font-size: 0.66rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
}

.add-edit-bb-shell__status--canonical {
  color: #ffffff;
  background: #111111;
  border-color: #111111;
}

.add-edit-bb-shell__status--extract {
  color: #111111;
  background: #ffffff;
  border-color: rgba(15, 23, 42, 0.16);
}

.add-edit-bb-shell__prompt {
  width: 100%;
  min-height: 124px;
  padding: 12px 14px;
  color: #0f172a;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 0.92rem;
  line-height: 1.5;
  resize: vertical;
}
</style>
