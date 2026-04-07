<template>
  <div class="b10-logo" :class="`b10-logo--${size}`">
    <div v-if="!logoReady" class="b10-logo__fallback">B10</div>
    <div
      ref="logoContainer"
      class="b10-logo__lottie"
      :class="{ 'b10-logo__lottie--hidden': !logoReady }"
    />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import lottie from 'lottie-web'
import logoAnimationData from 'src/assets/lottie/animation-b10-firma.json'

defineProps({
  size: {
    type: String,
    default: 'header',
    validator: (value) => ['header', 'card'].includes(value),
  },
})

const logoContainer = ref(null)
const logoReady = ref(false)
let logoAnimation = null

function initLogoAnimation() {
  if (!logoContainer.value) return
  logoReady.value = false

  logoAnimation?.destroy()
  logoAnimation = lottie.loadAnimation({
    container: logoContainer.value,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    animationData: logoAnimationData,
    rendererSettings: {
      preserveAspectRatio: 'xMaxYMid meet',
    },
  })

  logoAnimation.addEventListener('DOMLoaded', () => {
    logoReady.value = true
  })
  logoAnimation.addEventListener('data_failed', () => {
    logoReady.value = false
  })
}

onMounted(() => {
  initLogoAnimation()
})

onBeforeUnmount(() => {
  logoAnimation?.destroy()
  logoAnimation = null
})
</script>

<style scoped>
.b10-logo {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  flex: 0 0 auto;
}

.b10-logo--card {
  width: 120px;
  height: 51px;
}

.b10-logo--header {
  width: 128px;
  height: 52px;
}

.b10-logo__lottie {
  display: block;
  width: 100%;
  max-width: 100%;
  height: 100%;
}

.b10-logo__lottie--hidden {
  opacity: 0;
}

.b10-logo__lottie :deep(svg) {
  width: 100%;
  height: 100%;
}

.b10-logo__fallback {
  color: var(--ds-color-brand-black);
  font-family: var(--ds-font-body);
  font-size: var(--ds-font-size-hero);
  font-weight: var(--ds-font-weight-bold);
  line-height: 1;
  letter-spacing: -0.06em;
}
</style>
