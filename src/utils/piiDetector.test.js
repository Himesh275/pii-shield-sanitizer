import { describe, it, expect } from 'vitest';
import { isValidLuhn } from './luhn.js';
import {
  detectPII,
  PII_TYPES,
  countIgnoredNonLuhn16DigitStrings,
} from './piiDetector.js';
import { SAMPLE_NOISY_DATA } from '../data/sampleData.js';

describe('isValidLuhn', () => {
  it('validates real/test credit card numbers with or without separators', () => {
    expect(isValidLuhn('4532015112830366')).toBe(true);
    expect(isValidLuhn('4532-0151-1283-0366')).toBe(true);
    expect(isValidLuhn('4111 1111 1111 1111')).toBe(true);
    expect(isValidLuhn('3782 822463 10005')).toBe(true);
  });

  it('rejects non-Luhn numbers, all-zeros, and malformed inputs', () => {
    expect(isValidLuhn('9048112233445561')).toBe(false);
    expect(isValidLuhn('4532-0151-1283-0367')).toBe(false);
    expect(isValidLuhn('0000000000000000')).toBe(false);
    expect(isValidLuhn('abcd123456789012')).toBe(false);
    expect(isValidLuhn('')).toBe(false);
    expect(isValidLuhn(null)).toBe(false);
  });
});

describe('detectPII', () => {
  it('returns empty array for empty or non-string inputs', () => {
    expect(detectPII('')).toEqual([]);
    expect(detectPII(null)).toEqual([]);
    expect(detectPII(undefined)).toEqual([]);
  });

  it('detects EMAIL addresses with exact start/end indices', () => {
    const input = 'Contact ananya.sharma@finserve-demo.in or sec-ops+alert@corp.co.in.';
    const matches = detectPII(input);

    expect(matches).toHaveLength(2);
    expect(matches[0]).toMatchObject({
      type: PII_TYPES.EMAIL,
      value: 'ananya.sharma@finserve-demo.in',
    });
    expect(matches[1]).toMatchObject({
      type: PII_TYPES.EMAIL,
      value: 'sec-ops+alert@corp.co.in',
    });

    for (const m of matches) {
      expect(input.slice(m.start, m.end)).toBe(m.value);
    }
  });

  it('detects Indian (+91 / 10-digit) and international PHONE formats without false positives', () => {
    const input =
      'Call +91 98765 43210, +91-9820112233, 9123456780, or +1 (555) 234-5678. Date: 2026-11-27.';
    const matches = detectPII(input);

    expect(matches.map((m) => [m.type, m.value])).toEqual([
      [PII_TYPES.PHONE, '+91 98765 43210'],
      [PII_TYPES.PHONE, '+91-9820112233'],
      [PII_TYPES.PHONE, '9123456780'],
      [PII_TYPES.PHONE, '+1 (555) 234-5678'],
    ]);
  });

  it('detects valid IPv4 and IPv6 addresses while ignoring invalid octets and timestamps', () => {
    const input =
      'Allowed: 192.168.14.88, 2001:0db8:85a3:0000:0000:8a2e:0370:7334, fe80::1. Ignored: 999.168.1.1 and 09:14:22.';
    const matches = detectPII(input);

    expect(matches.map((m) => [m.type, m.value])).toEqual([
      [PII_TYPES.IP_ADDRESS, '192.168.14.88'],
      [PII_TYPES.IP_ADDRESS, '2001:0db8:85a3:0000:0000:8a2e:0370:7334'],
      [PII_TYPES.IP_ADDRESS, 'fe80::1'],
    ]);
  });

  it('detects Indian PAN numbers and ignores lowercase or malformed strings', () => {
    const input = 'Valid PANs: BXPPM4821K, AAKCS9104D. Invalid: bxppm4821k, ABCD12345F, BXPPM4821KX.';
    const matches = detectPII(input);

    expect(matches.map((m) => [m.type, m.value])).toEqual([
      [PII_TYPES.PAN, 'BXPPM4821K'],
      [PII_TYPES.PAN, 'AAKCS9104D'],
    ]);
  });

  it('detects 12-digit Aadhaar in spaced, hyphenated, and continuous forms starting with 2-9', () => {
    const input =
      'Aadhaar1: 4829 1038 4715 | Aadhaar2: 7391-0482-6198 | Aadhaar3: 298765432109 | Invalid: 1234 5678 9012';
    const matches = detectPII(input);

    expect(matches.map((m) => [m.type, m.value])).toEqual([
      [PII_TYPES.AADHAAR, '4829 1038 4715'],
      [PII_TYPES.AADHAAR, '7391-0482-6198'],
      [PII_TYPES.AADHAAR, '298765432109'],
    ]);
  });

  it('detects valid Luhn CREDIT_CARD numbers and ignores non-Luhn 16-digit strings', () => {
    const input =
      'Card: 4532-0151-1283-0366 | Amex: 3782 822463 10005 | Order ID: 9048112233445561 | Spaced ID: 9048 1122 3344 5561';
    const matches = detectPII(input);

    expect(matches.map((m) => [m.type, m.value])).toEqual([
      [PII_TYPES.CREDIT_CARD, '4532-0151-1283-0366'],
      [PII_TYPES.CREDIT_CARD, '3782 822463 10005'],
    ]);
  });

  it('resolves overlaps deterministically so longer CREDIT_CARD never splits into AADHAAR or PHONE', () => {
    // Starts with 6 (valid Aadhaar/Phone prefix) and passes Luhn as 16-digit card
    const input = 'Card 6011000990139424 and email user9876543210@example.com';
    const matches = detectPII(input);

    expect(matches.map((m) => [m.type, m.value])).toEqual([
      [PII_TYPES.CREDIT_CARD, '6011000990139424'],
      [PII_TYPES.EMAIL, 'user9876543210@example.com'],
    ]);
  });

  it('accurately parses SAMPLE_NOISY_DATA with exact indices and zero false positives on the non-Luhn Order ID', () => {
    const matches = detectPII(SAMPLE_NOISY_DATA);

    for (const m of matches) {
      expect(SAMPLE_NOISY_DATA.slice(m.start, m.end)).toBe(m.value);
    }

    const values = matches.map((m) => m.value);
    expect(values).toContain('4532-0151-1283-0366');
    expect(values).not.toContain('9048112233445561');
    expect(values).toContain('4829 1038 4715');
    expect(values).toContain('7391 0482 6198');
    expect(values).toContain('BXPPM4821K');
    expect(values).toContain('AAKCS9104D');
    expect(values).toContain('192.168.14.88');
    expect(values).toContain('+91 98765 43210');
    expect(values).toContain('ananya.sharma@finserve-demo.in');
  });

  it('counts ignored non-Luhn 16-digit identifiers accurately', () => {
    expect(countIgnoredNonLuhn16DigitStrings('')).toBe(0);
    expect(
      countIgnoredNonLuhn16DigitStrings(
        'Card: 4532-0151-1283-0366 | Order1: 9048112233445561 | Order2: 9048 1122 3344 5561'
      )
    ).toBe(2);
    expect(countIgnoredNonLuhn16DigitStrings(SAMPLE_NOISY_DATA)).toBe(2);
  });
});
