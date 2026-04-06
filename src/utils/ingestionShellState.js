import { ref } from 'vue'

const pendingIngestionShellRequest = ref(null)

export function setPendingIngestionShellRequest(request = null) {
  pendingIngestionShellRequest.value = request && typeof request === 'object'
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

export function consumePendingIngestionShellRequest() {
  const pending = pendingIngestionShellRequest.value
  pendingIngestionShellRequest.value = null
  return pending
}
