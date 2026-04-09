<template>
  <q-card class="dialog-shell-frame" :class="cardClass" :style="cardStyle">
    <q-card-section v-if="$slots.header" class="dialog-shell-frame__header" :class="headerClass">
      <slot name="header" />
    </q-card-section>

    <q-card-section
      v-if="$slots.default"
      class="dialog-shell-frame__body"
      :class="[bodyClass, { 'dialog-shell-frame__body--scrollable': bodyScrollable }]"
    >
      <slot />
    </q-card-section>

    <q-card-actions v-if="$slots.footer" :align="footerAlign" class="dialog-shell-frame__footer" :class="footerClass">
      <slot name="footer" />
    </q-card-actions>

    <slot name="overlay" />
  </q-card>
</template>

<script setup>
defineProps({
  cardClass: { type: [String, Array, Object], default: '' },
  headerClass: { type: [String, Array, Object], default: '' },
  bodyClass: { type: [String, Array, Object], default: '' },
  footerClass: { type: [String, Array, Object], default: '' },
  cardStyle: { type: [String, Array, Object], default: '' },
  bodyScrollable: { type: Boolean, default: false },
  footerAlign: { type: String, default: 'right' },
})
</script>

<style scoped>
.dialog-shell-frame {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-shell-frame__header,
.dialog-shell-frame__body,
.dialog-shell-frame__footer {
  min-width: 0;
}

.dialog-shell-frame__body {
  flex: 1 1 auto;
}

.dialog-shell-frame__body--scrollable {
  min-height: 0;
  overflow: auto;
}
</style>
