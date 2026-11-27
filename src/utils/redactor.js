import { detectPII, PII_TYPES } from './piiDetector.js';

export const REDACTION_MODE = Object.freeze({
  FULL_MASK: 'Full Mask',
  PARTIAL_MASK: 'Partial Mask',
  PSEUDONYMIZE: 'Consistent Pseudonymization',
});

const PSEUDONYM_PREFIX = Object.freeze({
  [PII_TYPES.EMAIL]: 'EMAIL',
  [PII_TYPES.PHONE]: 'PHONE',
  [PII_TYPES.IP_ADDRESS]: 'IP',
  [PII_TYPES.PAN]: 'PAN',
  [PII_TYPES.AADHAAR]: 'AADHAAR',
  [PII_TYPES.CREDIT_CARD]: 'CARD',
});

function normalizeMode(mode) {
  if (!mode || typeof mode !== 'string') {
    return REDACTION_MODE.FULL_MASK;
  }

  const key = mode.trim().toLowerCase();
  if (key === 'full' || key === 'full mask' || key === 'full_mask') {
    return REDACTION_MODE.FULL_MASK;
  }
  if (key === 'partial' || key === 'partial mask' || key === 'partial_mask') {
    return REDACTION_MODE.PARTIAL_MASK;
  }
  if (
    key === 'pseudonym' ||
    key === 'pseudonymize' ||
    key === 'pseudonymization' ||
    key === 'consistent pseudonymization' ||
    key === 'consistent_pseudonymization'
  ) {
    return REDACTION_MODE.PSEUDONYMIZE;
  }

  throw new Error(`Unsupported redaction mode: "${mode}"`);
}

function createEmptyEntityCounts() {
  return {
    [PII_TYPES.EMAIL]: 0,
    [PII_TYPES.PHONE]: 0,
    [PII_TYPES.IP_ADDRESS]: 0,
    [PII_TYPES.PAN]: 0,
    [PII_TYPES.AADHAAR]: 0,
    [PII_TYPES.CREDIT_CARD]: 0,
    total: 0,
  };
}

/**
 * Masks all digits in a card or Aadhaar string except the trailing 4 digits,
 * preserving existing space or hyphen separators.
 */
function maskKeepLast4Digits(value) {
  let seenDigits = 0;
  const totalDigits = (value.match(/\d/g) || []).length;
  const maskUntil = Math.max(0, totalDigits - 4);

  return value.replace(/\d/g, (digit) => {
    seenDigits += 1;
    return seenDigits <= maskUntil ? 'X' : digit;
  });
}

function partialMaskEmail(value) {
  const atIndex = value.indexOf('@');
  if (atIndex <= 0) return '[REDACTED]';
  const local = value.slice(0, atIndex);
  const domain = value.slice(atIndex + 1);
  return `${local[0]}***@${domain}`;
}

function partialMaskPhone(value) {
  const digitsOnly = value.replace(/\D/g, '');
  const last4 = digitsOnly.slice(-4);
  const trimmed = value.trim();

  if (trimmed.startsWith('+')) {
    const ccMatch = trimmed.match(/^\+(\d{1,3})/);
    const countryCode = ccMatch ? ccMatch[1] : '';
    const subscriberLen = Math.max(0, digitsOnly.length - countryCode.length - 4);
    const maskedMid = 'X'.repeat(Math.max(4, subscriberLen));
    return `+${countryCode}-${maskedMid}-${last4}`;
  }

  const maskedPrefix = 'X'.repeat(Math.max(4, digitsOnly.length - 4));
  return `${maskedPrefix}${last4}`;
}

function partialMaskPan(value) {
  if (value.length < 4) return 'X'.repeat(value.length);
  return `${value.slice(0, 2)}${'*'.repeat(value.length - 3)}${value.slice(-1)}`;
}

function partialMaskIp(value) {
  // IPv4: mask last two octets -> 192.168.*.*
  if (value.includes('.')) {
    const octets = value.split('.');
    if (octets.length === 4) {
      return `${octets[0]}.${octets[1]}.*.*`;
    }
  }

  // IPv6: preserve leading network prefix, mask host/interface groups
  const [addr, cidr] = value.split('/');
  const suffix = cidr ? `/${cidr}` : '';

  if (addr.includes('::')) {
    const [left] = addr.split('::');
    const leftGroups = left ? left.split(':').filter(Boolean) : [];
    const prefix = leftGroups.length > 0 ? leftGroups.slice(0, 2).join(':') : '';
    return prefix ? `${prefix}::*${suffix}` : `::*${suffix}`;
  }

  const groups = addr.split(':');
  if (groups.length >= 2) {
    const maskedRest = groups.slice(2).map(() => '*').join(':');
    return `${groups[0]}:${groups[1]}:${maskedRest}${suffix}`;
  }

  return '*';
}

function applyPartialMask(type, value) {
  switch (type) {
    case PII_TYPES.CREDIT_CARD:
    case PII_TYPES.AADHAAR:
      return maskKeepLast4Digits(value);
    case PII_TYPES.EMAIL:
      return partialMaskEmail(value);
    case PII_TYPES.PHONE:
      return partialMaskPhone(value);
    case PII_TYPES.PAN:
      return partialMaskPan(value);
    case PII_TYPES.IP_ADDRESS:
      return partialMaskIp(value);
    default:
      return '[REDACTED]';
  }
}

function applyFullMask(type, typeLabeledFullMask) {
  return typeLabeledFullMask ? `[REDACTED_${type}]` : '[REDACTED]';
}

/**
 * Redacts all detected PII in text using one of three strategies:
 * - "Full Mask"
 * - "Partial Mask"
 * - "Consistent Pseudonymization"
 *
 * @param {string} text - Raw input text.
 * @param {string} [mode="Full Mask"] - Redaction strategy.
 * @param {{ typeLabeledFullMask?: boolean }} [options]
 * @returns {{
 *   sanitizedText: string,
 *   entityCounts: Record<string, number>,
 *   appliedRedactions: Array<{
 *     id: number,
 *     type: string,
 *     original: string,
 *     replacement: string,
 *     originalStart: number,
 *     originalEnd: number,
 *     sanitizedStart: number,
 *     sanitizedEnd: number,
 *   }>,
 *   pseudonymMap: Record<string, string>,
 * }}
 */
export function redactPII(text, mode = REDACTION_MODE.FULL_MASK, options = {}) {
  const normalizedMode = normalizeMode(mode);
  const { typeLabeledFullMask = false } = options;

  const entityCounts = createEmptyEntityCounts();

  if (typeof text !== 'string' || text.length === 0) {
    return {
      sanitizedText: typeof text === 'string' ? text : '',
      entityCounts,
      appliedRedactions: [],
      pseudonymMap: {},
    };
  }

  const matches = detectPII(text);
  const appliedRedactions = [];
  const pseudonymMap = {};
  const typeCounters = {};
  const lookupCache = new Map();

  let cursor = 0;
  let sanitizedText = '';

  matches.forEach((match, idx) => {
    sanitizedText += text.slice(cursor, match.start);

    let replacement;
    if (normalizedMode === REDACTION_MODE.FULL_MASK) {
      replacement = applyFullMask(match.type, typeLabeledFullMask);
    } else if (normalizedMode === REDACTION_MODE.PARTIAL_MASK) {
      replacement = applyPartialMask(match.type, match.value);
    } else {
      const canonicalValue =
        match.type === PII_TYPES.EMAIL ? match.value.toLowerCase() : match.value;
      const cacheKey = `${match.type}::${canonicalValue}`;

      if (lookupCache.has(cacheKey)) {
        replacement = lookupCache.get(cacheKey);
      } else {
        const nextIndex = (typeCounters[match.type] || 0) + 1;
        typeCounters[match.type] = nextIndex;
        const prefix = PSEUDONYM_PREFIX[match.type] || match.type;
        replacement = `${prefix}_${String(nextIndex).padStart(2, '0')}`;
        lookupCache.set(cacheKey, replacement);
      }

      if (!Object.prototype.hasOwnProperty.call(pseudonymMap, match.value)) {
        pseudonymMap[match.value] = replacement;
      }
    }

    const sanitizedStart = sanitizedText.length;
    sanitizedText += replacement;
    const sanitizedEnd = sanitizedText.length;

    entityCounts[match.type] = (entityCounts[match.type] || 0) + 1;
    entityCounts.total += 1;

    appliedRedactions.push({
      id: idx,
      type: match.type,
      original: match.value,
      replacement,
      originalStart: match.start,
      originalEnd: match.end,
      sanitizedStart,
      sanitizedEnd,
    });

    cursor = match.end;
  });

  sanitizedText += text.slice(cursor);

  return {
    sanitizedText,
    entityCounts,
    appliedRedactions,
    pseudonymMap,
  };
}
