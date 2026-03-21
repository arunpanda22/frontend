/**
 * ASIN Validation Utilities
 *
 * Amazon ASIN formats:
 *   - Standard:  B + 9 uppercase alphanumeric  (e.g. B009GCTZWC)
 *   - Book ISBN: 10 digits                     (e.g. 0306406152)
 */

// Matches B + 9 alphanumeric (standard) OR 10 digits (book ISBN)
const ASIN_REGEX = /^(B[A-Z0-9]{9}|[0-9]{10})$/

export function isValidAsin(value: string): boolean {
  return ASIN_REGEX.test(value.trim().toUpperCase())
}

/**
 * Looks like an ASIN but is being used in a keyword/text field.
 * Used to detect accidental cross-paste (PT data pasted into KW section).
 */
export function looksLikeAsin(value: string): boolean {
  return ASIN_REGEX.test(value.trim().toUpperCase())
}

export type AsinValidationResult = {
  valid:   boolean
  reason?: 'empty' | 'too_short' | 'too_long' | 'invalid_format'
}

export function validateAsin(value: string): AsinValidationResult {
  const v = value.trim().toUpperCase()
  if (!v)          return { valid: false, reason: 'empty' }
  if (v.length < 10) return { valid: false, reason: 'too_short' }
  if (v.length > 10) return { valid: false, reason: 'too_long' }
  if (!ASIN_REGEX.test(v)) return { valid: false, reason: 'invalid_format' }
  return { valid: true }
}

export function asinValidationMessage(result: AsinValidationResult): string {
  switch (result.reason) {
    case 'empty':          return 'ASIN is required'
    case 'too_short':      return 'ASINs are 10 characters long'
    case 'too_long':       return 'ASINs are 10 characters long'
    case 'invalid_format': return 'Invalid ASIN — must start with B followed by 9 alphanumeric characters'
    default:               return ''
  }
}