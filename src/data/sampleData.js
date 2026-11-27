export const REDACTION_MODES = [
  {
    id: 'Full Mask',
    label: 'Full Mask',
    badge: 'Maximum Privacy',
    description: 'Replaces every detected sensitive token with a uniform redaction marker.',
    example: '[REDACTED]',
  },
  {
    id: 'Partial Mask',
    label: 'Partial Mask',
    badge: 'Audit Friendly',
    description: 'Preserves minimal edge characters for verification while masking sensitive digits.',
    example: 'a***@finserve-demo.in',
  },
  {
    id: 'Consistent Pseudonymization',
    label: 'Consistent Pseudonymization',
    badge: 'LLM & Log Safe',
    description: 'Maps recurring entities to deterministic session aliases so thread context stays intact.',
    example: 'EMAIL_01',
  },
];

export const SAMPLE_NOISY_DATA = `[2026-11-27T09:14:22Z] TICKET #INC-8492 | Priority: HIGH | Source IP: 192.168.14.88
Reporter: ananya.sharma@finserve-demo.in | Alt Contact: +91 98765 43210
Summary: Customer Ananya reported failed KYC verification during card checkout.
Submitted PAN: BXPPM4821K | Aadhaar: 4829 1038 4715
Payment Card Attempt: 4532-0151-1283-0366 | Merchant Order ID: 9048112233445561
Escalated to: sec-ops@finserve-demo.in from gateway node 10.24.199.12

[2026-11-27T09:19:05Z] TICKET #INC-8493 | Priority: MEDIUM | Source IP: 203.0.113.45
Reporter: rohit.verma92@mail-example.org | Phone: 9123456780 | Secondary: +91-9820112233
Summary: Follow-up on corporate onboarding documents for partner account.
Entity PAN: AAKCS9104D | Authorized Signatory Aadhaar: 7391 0482 6198
CC'd on thread: ananya.sharma@finserve-demo.in, sec-ops@finserve-demo.in

[2026-11-27T09:26:41Z] AUTH_AUDIT_LOG | Client IP: 192.168.14.88
actor=ananya.sharma@finserve-demo.in action="DOWNLOAD_STATEMENT" order_ref="9048112233445561" status="200_OK"
reviewer=rohit.verma92@mail-example.org note="Verified callback to +91 98765 43210; no card data stored"`;
