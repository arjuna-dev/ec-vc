import { ref } from 'vue'

const pendingIntakeShellRequest = ref(null)

export function setPendingIntakeShellRequest(request = null) {
  pendingIntakeShellRequest.value = request && typeof request === 'object'
    ? {
        initialArtifacts: Array.isArray(request.initialArtifacts)
          ? request.initialArtifacts.map((artifact) => ({
              ...artifact,
              id: String(artifact?.id || artifact?.artifactId || '').trim(),
              artifactId: String(artifact?.artifactId || artifact?.id || '').trim(),
              processedArtifactId: String(artifact?.processedArtifactId || '').trim(),
              name: String(artifact?.name || artifact?.label || '').trim(),
              path: String(artifact?.path || '').trim(),
              size: Number(artifact?.size || 0),
            }))
          : [],
        artifactContext: request.artifactContext && typeof request.artifactContext === 'object'
          ? { ...request.artifactContext }
          : null,
      }
    : null
}

export function getPendingIntakeShellRequest() {
  return pendingIntakeShellRequest.value
}

export function consumePendingIntakeShellRequest() {
  const pending = pendingIntakeShellRequest.value
  pendingIntakeShellRequest.value = null
  return pending
}
