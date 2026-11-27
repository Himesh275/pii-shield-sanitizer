import { describe, it, expect } from 'vitest';
import { redactPII, REDACTION_MODE } from './redactor.js';
import { PII_TYPES } from './piiDetector.js';
import { SAMPLE_NOISY_DATA } from '../data/sampleData.js';

describe('redactPII', () => {
  it('handles empty or clean input gracefully with zero counts', () => {
    const emptyRes = redactPII('', REDACTION_MODE.FULL_MASK);
    expect(emptyRes.sanitizedText).toBe('');
    expect(emptyRes.entityCounts.total).toBe(0);
    expect(emptyRes.appliedRedactions).toEqual([]);
    expect(emptyRes.pseudonymMap).toEqual({});

    const cleanText = 'System status OK. Order ID 9048112233445561 processed normally.';
    const cleanRes = redactPII(cleanText, REDACTION_MODE.FULL_MASK);
    expect(cleanRes.sanitizedText).toBe(cleanText);
    expect(cleanRes.entityCounts.total).toBe(0);
  });

  it('applies Full Mask mode with default [REDACTED] and optional type labels', () => {
    const input = 'Email: rohit@company.com | PAN: BXPPM4821K | IP: 192.168.14.88';
    const res = redactPII(input, REDACTION_MODE.FULL_MASK);

    expect(res.sanitizedText).toBe(
      'Email: [REDACTED] | PAN: [REDACTED] | IP: [REDACTED]'
    );
    expect(res.entityCounts).toEqual({
      [PII_TYPES.EMAIL]: 1,
      [PII_TYPES.PHONE]: 0,
      [PII_TYPES.IP_ADDRESS]: 1,
      [PII_TYPES.PAN]: 1,
      [PII_TYPES.AADHAAR]: 0,
      [PII_TYPES.CREDIT_CARD]: 0,
      total: 3,
    });
    expect(res.pseudonymMap).toEqual({});

    const labeledRes = redactPII(input, REDACTION_MODE.FULL_MASK, {
      typeLabeledFullMask: true,
    });
    expect(labeledRes.sanitizedText).toBe(
      'Email: [REDACTED_EMAIL] | PAN: [REDACTED_PAN] | IP: [REDACTED_IP_ADDRESS]'
    );
  });

  it('applies Partial Mask mode accurately across all 6 PII entity types', () => {
    const input = [
      'Email: rohit@company.com',
      'Phone: +91 98765 43210',
      'LocalPhone: 9123456780',
      'PAN: BXPPM4821K',
      'Aadhaar: 4829 1038 4715',
      'Card: 4532-0151-1283-0366',
      'IPv4: 192.168.14.88',
      'IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334',
    ].join('\n');

    const res = redactPII(input, REDACTION_MODE.PARTIAL_MASK);

    expect(res.sanitizedText).toBe(
      [
        'Email: r***@company.com',
        'Phone: +91-XXXXXX-3210',
        'LocalPhone: XXXXXX6780',
        'PAN: BX*******K',
        'Aadhaar: XXXX XXXX 4715',
        'Card: XXXX-XXXX-XXXX-0366',
        'IPv4: 192.168.*.*',
        'IPv6: 2001:0db8:*:*:*:*:*:*',
      ].join('\n')
    );

    expect(res.entityCounts.total).toBe(8);
    for (const span of res.appliedRedactions) {
      expect(input.slice(span.originalStart, span.originalEnd)).toBe(span.original);
      expect(res.sanitizedText.slice(span.sanitizedStart, span.sanitizedEnd)).toBe(
        span.replacement
      );
    }
  });

  it('applies Consistent Pseudonymization and maps repeated entities to identical placeholders', () => {
    const input = [
      '1: ananya.sharma@finserve-demo.in called from +91 98765 43210 (IP 192.168.14.88)',
      '2: Escalated to sec-ops@finserve-demo.in by ananya.sharma@finserve-demo.in',
      '3: Audit confirms ananya.sharma@finserve-demo.in on 192.168.14.88 via +91 98765 43210',
    ].join('\n');

    const res = redactPII(input, REDACTION_MODE.PSEUDONYMIZE);

    expect(res.sanitizedText).toBe(
      [
        '1: EMAIL_01 called from PHONE_01 (IP IP_01)',
        '2: Escalated to EMAIL_02 by EMAIL_01',
        '3: Audit confirms EMAIL_01 on IP_01 via PHONE_01',
      ].join('\n')
    );

    expect(res.pseudonymMap).toEqual({
      'ananya.sharma@finserve-demo.in': 'EMAIL_01',
      '+91 98765 43210': 'PHONE_01',
      '192.168.14.88': 'IP_01',
      'sec-ops@finserve-demo.in': 'EMAIL_02',
    });

    expect(res.entityCounts[PII_TYPES.EMAIL]).toBe(4);
    expect(res.entityCounts[PII_TYPES.PHONE]).toBe(2);
    expect(res.entityCounts[PII_TYPES.IP_ADDRESS]).toBe(2);
    expect(res.entityCounts.total).toBe(8);
  });

  it('keeps exact original and sanitized spans aligned on SAMPLE_NOISY_DATA', () => {
    const res = redactPII(SAMPLE_NOISY_DATA, REDACTION_MODE.PSEUDONYMIZE);

    expect(res.sanitizedText).not.toContain('ananya.sharma@finserve-demo.in');
    expect(res.sanitizedText).not.toContain('4532-0151-1283-0366');
    expect(res.sanitizedText).not.toContain('BXPPM4821K');
    expect(res.sanitizedText).not.toContain('4829 1038 4715');
    // Non-Luhn 16-digit Order ID must remain untouched
    expect(res.sanitizedText).toContain('9048112233445561');

    // Verify all 3 occurrences of ananya.sharma@finserve-demo.in got EMAIL_01
    const ananyaOccurrences = res.appliedRedactions.filter(
      (r) => r.original === 'ananya.sharma@finserve-demo.in'
    );
    expect(ananyaOccurrences).toHaveLength(3);
    expect(new Set(ananyaOccurrences.map((r) => r.replacement)).size).toBe(1);

    for (const span of res.appliedRedactions) {
      expect(SAMPLE_NOISY_DATA.slice(span.originalStart, span.originalEnd)).toBe(
        span.original
      );
      expect(res.sanitizedText.slice(span.sanitizedStart, span.sanitizedEnd)).toBe(
        span.replacement
      );
    }
  });

  it('throws a descriptive error for unsupported redaction modes', () => {
    expect(() => redactPII('test@example.com', 'Invalid Mode')).toThrow(
      /Unsupported redaction mode/
    );
  });
});
