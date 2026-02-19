import { boot } from 'quasar/wrappers'
import vueGrabScriptUrl from 'vue-grab/dist/index.global.js?url'

const VUE_GRAB_SCRIPT_ID = 'vue-grab-script'

export default boot(() => {
  if (!process.env.DEV || typeof document === 'undefined') {
    return
  }

  if (document.getElementById(VUE_GRAB_SCRIPT_ID)) {
    return
  }

  const script = document.createElement('script')
  script.id = VUE_GRAB_SCRIPT_ID
  script.src = vueGrabScriptUrl
  script.crossOrigin = 'anonymous'
  script.dataset.enabled = 'true'
  script.dataset.hotkey = 'Meta,G'
  script.dataset.keyHoldDuration = '300'

  document.head.appendChild(script)
})
