<template>
  <div class="ec-toolbar-logo" aria-label="EC VC logo">
    <span class="ec-toolbar-logo-fallback">EC VC</span>
    <span
      ref="animationContainer"
      class="ec-toolbar-logo-lottie"
      :class="{ 'ec-toolbar-logo-lottie--visible': isAnimationReady }"
    />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import animationData from '../assets/lottie/project-b10-firma-1.json'

const animationContainer = ref(null)
const isAnimationReady = ref(false)

let animationInstance = null
let isUnmounted = false
let lottieLoaderPromise = null

function loadLottieRuntime() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window is not available'))
  if (window.lottie) return Promise.resolve(window.lottie)
  if (lottieLoaderPromise) return lottieLoaderPromise

  lottieLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-ecvc-lottie-runtime="true"]')
    const runtimeUrl = `${import.meta.env.BASE_URL}vendor/lottie.min.js`

    function onLoad() {
      if (window.lottie) resolve(window.lottie)
      else reject(new Error('Lottie runtime loaded but unavailable'))
    }

    function onError() {
      reject(new Error('Failed to load Lottie runtime'))
    }

    if (existingScript) {
      if (existingScript.dataset.loaded === 'true' && window.lottie) {
        resolve(window.lottie)
        return
      }
      existingScript.addEventListener('load', onLoad, { once: true })
      existingScript.addEventListener('error', onError, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = runtimeUrl
    script.async = true
    script.dataset.ecvcLottieRuntime = 'true'
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true'
        onLoad()
      },
      { once: true },
    )
    script.addEventListener('error', onError, { once: true })
    document.head.appendChild(script)
  })

  return lottieLoaderPromise
}

onMounted(() => {
  isAnimationReady.value = false
  if (!animationContainer.value) return

  loadLottieRuntime()
    .then((lottie) => {
      if (!lottie || typeof lottie.loadAnimation !== 'function') return
      if (isUnmounted || !animationContainer.value) return

      animationInstance?.destroy()
      animationInstance = lottie.loadAnimation({
        container: animationContainer.value,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
        },
      })

      animationInstance.addEventListener('DOMLoaded', () => {
        if (!isUnmounted) isAnimationReady.value = true
      })
      animationInstance.addEventListener('data_failed', () => {
        if (!isUnmounted) isAnimationReady.value = false
      })
    })
    .catch(() => {
      if (!isUnmounted) isAnimationReady.value = false
    })
})

onBeforeUnmount(() => {
  isUnmounted = true
  animationInstance?.destroy()
  animationInstance = null
})
</script>

<style scoped>
.ec-toolbar-logo {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  min-width: 220px;
  min-height: 44px;
}

.ec-toolbar-logo-fallback {
  font-family: var(--font-body);
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -2px;
  line-height: var(--lh-title);
}

.ec-toolbar-logo-lottie {
  display: block;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}

.ec-toolbar-logo-lottie--visible {
  width: 160px;
  height: 44px;
}

.ec-toolbar-logo-lottie--visible :deep(svg) {
  width: 100%;
  height: 100%;
}
</style>
