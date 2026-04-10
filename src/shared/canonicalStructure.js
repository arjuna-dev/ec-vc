import canonicalStructure from '../../docs/000-canonical-structure.json' with { type: 'json' }

export const CANONICAL_STRUCTURE_PATH = 'docs/000-canonical-structure.json'

export function loadCanonicalStructure() {
  return canonicalStructure
}

export default canonicalStructure
