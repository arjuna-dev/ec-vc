import { buildSelectSurfaceColumn } from 'src/utils/tokenSurfaceContract'

export const TOKEN_GOVERNANCE_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Datetime' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'rich_text', label: 'Rich Text' },
  { value: 'select_single', label: 'Single Select' },
  { value: 'select_multi', label: 'Multi Select' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'url', label: 'URL' },
]

export const TOKEN_GOVERNANCE_OPTION_SOURCE_OPTIONS = [
  { value: 'table_field', label: 'Table Field' },
  { value: 'live_entity', label: 'Live Entity' },
  { value: 'option_list', label: 'Option List' },
  { value: 'shared_file_universe', label: 'Shared File Universe' },
  { value: 'manual', label: 'Manual' },
]

export const TOKEN_GOVERNANCE_FIELD_CLASS_OPTIONS = [
  { value: 'owned', label: 'Owned' },
  { value: 'directional', label: 'Directional' },
  { value: 'ldb_relationship', label: 'LDB Relationship' },
  { value: 'system', label: 'System' },
]

export function buildTokenGovernanceColumns({
  labelCellClass,
  dataHeaderClass,
  dataCellClass,
  optionEntityOptions = [],
}) {

  return [
    { key: 'label', label: 'Label', width: 180, cellClass: labelCellClass, editable: true, kind: 'text' },
    buildSelectSurfaceColumn(
      {
        key: 'tokenType',
        label: 'Type',
        width: 112,
        headerClass: dataHeaderClass,
        cellClass: dataCellClass,
        editable: true,
      },
      TOKEN_GOVERNANCE_TYPE_OPTIONS,
    ),
    buildSelectSurfaceColumn(
      {
        key: 'optionSource',
        label: 'Option Source',
        width: 150,
        headerClass: dataHeaderClass,
        cellClass: dataCellClass,
        editable: true,
      },
      TOKEN_GOVERNANCE_OPTION_SOURCE_OPTIONS,
    ),
    buildSelectSurfaceColumn(
      {
        key: 'optionEntity',
        label: 'Option Entity',
        width: 160,
        headerClass: dataHeaderClass,
        cellClass: dataCellClass,
        editable: true,
      },
      optionEntityOptions,
    ),
    { key: 'optionList', label: 'Option List', width: 140, headerClass: dataHeaderClass, cellClass: dataCellClass, editable: true, kind: 'text' },
    { key: 'definition', label: 'Definition', width: 280, headerClass: dataHeaderClass, cellClass: dataCellClass, editable: true, kind: 'textarea' },
    { key: 'dbWriteField', label: 'DB Write Field', width: 180, headerClass: dataHeaderClass, cellClass: dataCellClass, editable: true, kind: 'text' },
    buildSelectSurfaceColumn(
      {
        key: 'fieldClass',
        label: 'Field Class',
        width: 140,
        headerClass: dataHeaderClass,
        cellClass: dataCellClass,
        editable: true,
      },
      TOKEN_GOVERNANCE_FIELD_CLASS_OPTIONS,
    ),
    { key: 'required', label: 'Required', width: 84, headerClass: dataHeaderClass, cellClass: dataCellClass, kind: 'checkbox' },
  ]
}
