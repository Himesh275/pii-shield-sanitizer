/**
 * Validates a numeric string using the Luhn checksum algorithm (ISO/IEC 7812).
 * Strips spaces and hyphens before evaluating digits.
 *
 * @param {string} value - Candidate numeric/card string.
 * @returns {boolean} True if value contains only digits (after removing spaces/hyphens) and passes Luhn.
 */
export function isValidLuhn(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const digits = value.replace(/[\s-]/g, '');
  if (!/^\d{2,}$/.test(digits)) {
    return false;
  }

  // Reject degenerate all-zero strings even though 0 % 10 === 0.
  if (/^0+$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}
