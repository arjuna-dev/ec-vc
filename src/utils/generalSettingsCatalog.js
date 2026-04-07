export const GENERAL_SETTINGS_FONT_SAMPLES = Object.freeze([
  {
    key: 'title',
    label: 'Title Font',
    token: '--ds-font-family-title',
    fontFamily: 'var(--ds-font-family-title)',
    sample: 'Neue Machina keeps shell titles crisp and structural.',
  },
  {
    key: 'body',
    label: 'Body Font',
    token: '--ds-font-family-body',
    fontFamily: 'var(--ds-font-family-body)',
    sample: 'Sequel Sans handles labels, body copy, and utility text.',
  },
])

export const GENERAL_SETTINGS_TYPE_SCALE_SAMPLES = Object.freeze([
  { key: '4xl', label: '4XL / Hero', token: '--ds-font-size-4xl', size: 'var(--ds-font-size-4xl)' },
  { key: 'base', label: 'Base', token: '--ds-font-size-base-regular', size: 'var(--ds-font-size-base-regular)' },
  { key: 'sm', label: 'Small', token: '--ds-font-size-sm-regular', size: 'var(--ds-font-size-sm-regular)' },
  { key: 'xs', label: 'XS', token: '--ds-font-size-xs-regular', size: 'var(--ds-font-size-xs-regular)' },
])

export const GENERAL_SETTINGS_FONT_WEIGHT_SAMPLES = Object.freeze([
  { key: 'light', label: 'Light', token: '--ds-font-weight-light', weight: 'var(--ds-font-weight-light)' },
  { key: 'regular', label: 'Regular', token: '--ds-font-weight-regular', weight: 'var(--ds-font-weight-regular)' },
  { key: 'medium', label: 'Medium', token: '--ds-font-weight-medium', weight: 'var(--ds-font-weight-medium)' },
  { key: 'black', label: 'Black', token: '--ds-font-weight-black', weight: 'var(--ds-font-weight-black)' },
])

export const GENERAL_SETTINGS_COLOR_SWATCHES = Object.freeze([
  { key: 'brand-blue', label: 'Brand Blue', token: '--ds-color-brand-blue', color: 'var(--ds-color-brand-blue)' },
  { key: 'brand-black', label: 'Brand Black', token: '--ds-color-brand-black', color: 'var(--ds-color-brand-black)' },
  { key: 'brand-dark-grey', label: 'Brand Dark_Grey', token: '--ds-color-brand-dark-grey', color: 'var(--ds-color-brand-dark-grey)' },
  { key: 'brand-white', label: 'Brand White', token: '--ds-color-brand-white', color: 'var(--ds-color-brand-white)' },
  { key: 'brand-light-grey', label: 'Brand Light_Grey', token: '--ds-color-brand-light-grey', color: 'var(--ds-color-brand-light-grey)' },
])

export const GENERAL_SETTINGS_SURFACE_SAMPLES = Object.freeze([
  { key: 'base', label: 'Base', token: '--ds-color-surface-base', background: 'var(--ds-color-surface-base)' },
  { key: 'subtle', label: 'Subtle', token: '--ds-color-surface-subtle', background: 'var(--ds-color-surface-subtle)' },
  { key: 'overlay-84', label: 'Overlay 84', token: '--ds-color-surface-overlay-84', background: 'var(--ds-color-surface-overlay-84)' },
  { key: 'overlay-96', label: 'Overlay 96', token: '--ds-color-surface-overlay-96', background: 'var(--ds-color-surface-overlay-96)' },
])

export const GENERAL_SETTINGS_BORDER_SAMPLES = Object.freeze([
  { key: 'soft', label: 'Soft', token: '--ds-color-border-soft', border: '1px solid var(--ds-color-border-soft)' },
  { key: 'default', label: 'Default', token: '--ds-color-border-default', border: '1px solid var(--ds-color-border-default)' },
  { key: 'strong', label: 'Strong', token: '--ds-color-border-strong', border: '1px solid var(--ds-color-border-strong)' },
  { key: 'dashed', label: 'Dashed', token: '--ds-color-border-dashed', border: '1px dashed var(--ds-color-border-dashed)' },
])

export const GENERAL_SETTINGS_RADIUS_SAMPLES = Object.freeze([
  { key: 'sm', label: '6px', token: '--ds-radius-sm', radius: 'var(--ds-radius-sm)' },
  { key: 'md', label: '8px', token: '--ds-radius-md', radius: 'var(--ds-radius-md)' },
  { key: 'lg', label: '12px', token: '--ds-radius-lg', radius: 'var(--ds-radius-lg)' },
  { key: 'xl', label: '18px', token: '--ds-radius-xl', radius: 'var(--ds-radius-xl)' },
  { key: 'pill', label: 'Pill', token: '--ds-radius-pill', radius: 'var(--ds-radius-pill)' },
])

export const GENERAL_SETTINGS_SHADOW_SAMPLES = Object.freeze([
  { key: 'label', label: 'Floating Label', token: '--ds-shadow-floating-label', shadow: 'var(--ds-shadow-floating-label)' },
  { key: 'card-soft', label: 'Card Soft', token: '--ds-shadow-card-soft', shadow: 'var(--ds-shadow-card-soft)' },
  { key: 'card-medium', label: 'Card Medium', token: '--ds-shadow-card-medium', shadow: 'var(--ds-shadow-card-medium)' },
  { key: 'control', label: 'Control', token: '--ds-control-shadow', shadow: 'var(--ds-control-shadow)' },
])

export const GENERAL_SETTINGS_SPACING_SAMPLES = Object.freeze([
  { key: 'space-4', label: '4', token: '--ds-space-4', width: 'var(--ds-space-4)' },
  { key: 'space-8', label: '8', token: '--ds-space-8', width: 'var(--ds-space-8)' },
  { key: 'space-12', label: '12', token: '--ds-space-12', width: 'var(--ds-space-12)' },
  { key: 'space-16', label: '16', token: '--ds-space-16', width: 'var(--ds-space-16)' },
  { key: 'space-20', label: '20', token: '--ds-space-20', width: 'var(--ds-space-20)' },
  { key: 'space-24', label: '24', token: '--ds-space-24', width: 'var(--ds-space-24)' },
  { key: 'space-32', label: '32', token: '--ds-space-32', width: 'var(--ds-space-32)' },
])

export const GENERAL_SETTINGS_ICON_SIZE_SAMPLES = Object.freeze([
  { key: 'small', label: '16px', token: '--ds-button-icon-size', size: 'var(--ds-button-icon-size)' },
  { key: 'icon-button', label: '20px', token: '--ds-icon-button-icon-size', size: 'var(--ds-icon-button-icon-size)' },
  { key: 'chip', label: '24px', token: 'shell-icon-md', size: '24px' },
  { key: 'hero', label: '32px', token: 'shell-icon-lg', size: '32px' },
])

export const GENERAL_SETTINGS_FORMATTING_SAMPLES = Object.freeze([
  { key: 'int', label: 'Integer', value: '1,248' },
  { key: 'currency', label: 'Currency', value: '$2.4M' },
  { key: 'percent', label: 'Percent', value: '93%' },
  { key: 'date', label: 'Date', value: 'Apr 6, 2026' },
  { key: 'time', label: 'Time', value: '09:41 AM' },
])

export const GENERAL_SETTINGS_MOTION_SAMPLES = Object.freeze([
  { key: 'fast', label: 'Fast', detail: '120ms ease-out', transform: 'translateY(-2px)' },
  { key: 'standard', label: 'Standard', detail: '180ms ease', transform: 'translateY(-4px)' },
  { key: 'emphasis', label: 'Emphasis', detail: '280ms ease', transform: 'translateY(-6px)' },
])
