export function buildFileStructureSessionSnapshot({
  sourceKey = '',
  sourceLabel = '',
  toolbarValue = '',
  sectionKey = '',
  viewRows = [],
  leafRows = [],
  selectedLeafKeys = [],
  requiredFieldKeys = [],
  deletedTokenKeys = [],
} = {}) {
  return {
    sourceKey: String(sourceKey || '').trim(),
    sourceLabel: String(sourceLabel || '').trim(),
    toolbarValue: String(toolbarValue || '').trim(),
    sectionKey: String(sectionKey || '').trim(),
    viewRows: Array.isArray(viewRows) ? viewRows.map((row) => ({ ...row })) : [],
    leafRows: Array.isArray(leafRows) ? leafRows.map((row) => ({ ...row })) : [],
    selectedLeafKeys: Array.isArray(selectedLeafKeys) ? [...selectedLeafKeys] : [],
    requiredFieldKeys: Array.isArray(requiredFieldKeys) ? [...requiredFieldKeys] : [],
    deletedTokenKeys: Array.isArray(deletedTokenKeys) ? [...deletedTokenKeys] : [],
  }
}
