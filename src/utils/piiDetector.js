import { isValidLuhn } from './luhn.js';

export const PII_TYPES = Object.freeze({
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  IP_ADDRESS: 'IP_ADDRESS',
  PAN: 'PAN',
  AADHAAR: 'AADHAAR',
  CREDIT_CARD: 'CREDIT_CARD',
});

// Higher rank wins when two overlapping matches have equal span length.
const TYPE_PRIORITY = Object.freeze({
  [PII_TYPES.CREDIT_CARD]: 6,
  [PII_TYPES.EMAIL]: 5,
  [PII_TYPES.IP_ADDRESS]: 4,
  [PII_TYPES.AADHAAR]: 3,
  [PII_TYPES.PAN]: 2,
  [PII_TYPES.PHONE]: 1,
});

const EMAIL_REGEX =
  /(?<![A-Za-z0-9._%+-])[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}(?![A-Za-z0-9_%+-]|\.[A-Za-z0-9])/g;

const IPV4_REGEX =
  /(?<![\d.])(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}(?![\d.])/g;

const IPV6_CANDIDATE_REGEX =
  /(?<![0-9A-Fa-f:])(?:[0-9A-Fa-f]{0,4}:){2,7}[0-9A-Fa-f]{0,4}(?:\/\d{1,3})?(?![0-9A-Fa-f:])/g;

const PAN_REGEX = /(?<![A-Za-z0-9])[A-Z]{5}[0-9]{4}[A-Z](?![A-Za-z0-9])/g;

const AADHAAR_REGEX =
  /(?<!\d)(?<!\d[ -])(?:[2-9]\d{3}(?:([ -])\d{4}\1\d{4}|\d{8}))(?!\d)(?![ -]\d{4}(?!\d))/g;

const CREDIT_CARD_REGEX =
  /(?<!\d)(?<!\d-)(?:\d{13,19}|(?:\d{4}[ -]){2,4}\d{1,4}|\d{4}[ -]\d{6}[ -]\d{5})(?!\d)(?!-\d)/g;

const NON_LUHN_16_REGEX =
  /(?<!\d)(?<!\d-)(?:\d{16}|(?:\d{4}[ -]){3}\d{4})(?!\d)(?!-\d)/g;

const PHONE_INTL_REGEX =
  /(?<![\dA-Za-z+])\+(?:91[ -]?[6-9]\d{4}[ -]?\d{5}|[1-9]\d{0,2}(?:[ -]?\(?\d{2,5}\)?){2,4})(?!\d)(?![ -]\d)/g;

const PHONE_LOCAL_REGEX =
  /(?<!\d)(?<!\d[ -])(?<!\+)(?:[6-9]\d{9}|[6-9]\d{4}[ -]\d{5}|[6-9]\d{2}[ -]\d{3}[ -]\d{4}|\(\d{3}\)[ -]?\d{3}[ -]\d{4}|\d{3}-\d{3}-\d{4})(?!\d)(?![ -]\d)/g;

/**
 * Validates an IPv6 candidate string (supports full 8-group and :: compressed forms).
 *
 * @param {string} candidate
 * @returns {boolean}
 */
function isValidIPv6(candidate) {
  const addr = candidate.split('/')[0];
  if (!addr || addr === '::' || addr.includes(':::')) {
    return false;
  }

  const doubleColonParts = addr.split('::');
  if (doubleColonParts.length > 2) {
    return false;
  }

  const hexGroup = /^[0-9A-Fa-f]{1,4}$/;

  if (doubleColonParts.length === 1) {
    const groups = addr.split(':');
    return groups.length === 8 && groups.every((g) => hexGroup.test(g));
  }

  const [leftRaw, rightRaw] = doubleColonParts;
  const leftGroups = leftRaw ? leftRaw.split(':') : [];
  const rightGroups = rightRaw ? rightRaw.split(':') : [];
  const totalGroups = leftGroups.length + rightGroups.length;

  if (totalGroups === 0 || totalGroups >= 8) {
    return false;
  }

  return (
    leftGroups.every((g) => hexGroup.test(g)) &&
    rightGroups.every((g) => hexGroup.test(g))
  );
}

function collectRegexMatches(text, regex, type, validator = null) {
  const results = [];
  regex.lastIndex = 0;

  let match;
  while ((match = regex.exec(text)) !== null) {
    const value = match[0];
    if (validator && !validator(value)) {
      continue;
    }
    results.push({
      type,
      value,
      start: match.index,
      end: match.index + value.length,
    });
  }

  return results;
}

function isValidEmail(email) {
  const [localPart] = email.split('@');
  return Boolean(localPart) && !localPart.includes('..');
}

function isValidCreditCard(candidate) {
  // Prevent mixed spaces and hyphens in the same card token.
  if (candidate.includes(' ') && candidate.includes('-')) {
    return false;
  }
  const digits = candidate.replace(/[\s-]/g, '');
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }
  return isValidLuhn(digits);
}

function isValidPhone(candidate) {
  const digits = candidate.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Resolves overlapping candidates deterministically:
 * longer spans win first, then higher type specificity, then earlier start index.
 *
 * @param {Array<{type: string, value: string, start: number, end: number}>} candidates
 * @returns {Array<{type: string, value: string, start: number, end: number}>}
 */
function resolveOverlaps(candidates) {
  const ranked = [...candidates].sort((a, b) => {
    const lenDiff = b.end - b.start - (a.end - a.start);
    if (lenDiff !== 0) return lenDiff;

    const prioDiff = (TYPE_PRIORITY[b.type] ?? 0) - (TYPE_PRIORITY[a.type] ?? 0);
    if (prioDiff !== 0) return prioDiff;

    return a.start - b.start;
  });

  const accepted = [];

  for (const candidate of ranked) {
    const overlaps = accepted.some(
      (existing) => candidate.start < existing.end && candidate.end > existing.start
    );
    if (!overlaps) {
      accepted.push(candidate);
    }
  }

  return accepted.sort((a, b) => a.start - b.start || a.end - b.end);
}

/**
 * Detects and classifies PII entities in raw text with exact start/end indices.
 *
 * @param {string} text - Raw input text to inspect locally.
 * @returns {Array<{type: string, value: string, start: number, end: number}>}
 */
export function detectPII(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return [];
  }

  const candidates = [
    ...collectRegexMatches(text, EMAIL_REGEX, PII_TYPES.EMAIL, isValidEmail),
    ...collectRegexMatches(text, IPV4_REGEX, PII_TYPES.IP_ADDRESS),
    ...collectRegexMatches(text, IPV6_CANDIDATE_REGEX, PII_TYPES.IP_ADDRESS, isValidIPv6),
    ...collectRegexMatches(text, PAN_REGEX, PII_TYPES.PAN),
    ...collectRegexMatches(text, CREDIT_CARD_REGEX, PII_TYPES.CREDIT_CARD, isValidCreditCard),
    ...collectRegexMatches(text, AADHAAR_REGEX, PII_TYPES.AADHAAR),
    ...collectRegexMatches(text, PHONE_INTL_REGEX, PII_TYPES.PHONE, isValidPhone),
    ...collectRegexMatches(text, PHONE_LOCAL_REGEX, PII_TYPES.PHONE, isValidPhone),
  ];

  return resolveOverlaps(candidates);
}

/**
 * Counts 16-digit numeric strings (continuous or 4x4 grouped) that fail Luhn validation
 * and were therefore safely ignored as non-card identifiers (e.g. Order IDs).
 *
 * @param {string} text
 * @returns {number}
 */
export function countIgnoredNonLuhn16DigitStrings(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return 0;
  }

  let ignoredCount = 0;
  NON_LUHN_16_REGEX.lastIndex = 0;

  let match;
  while ((match = NON_LUHN_16_REGEX.exec(text)) !== null) {
    const candidate = match[0];
    if (candidate.includes(' ') && candidate.includes('-')) {
      continue;
    }
    if (!isValidLuhn(candidate)) {
      ignoredCount += 1;
    }
  }

  return ignoredCount;
}
