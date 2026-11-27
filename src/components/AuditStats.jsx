import {
  Mail,
  Phone,
  Globe,
  FileBadge2,
  Fingerprint,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  Filter,
} from 'lucide-react';
import { PII_TYPES } from '../utils/piiDetector.js';

const CATEGORY_META = [
  {
    type: PII_TYPES.EMAIL,
    label: 'Email',
    icon: Mail,
    tier: 'amber',
  },
  {
    type: PII_TYPES.PHONE,
    label: 'Phone',
    icon: Phone,
    tier: 'amber',
  },
  {
    type: PII_TYPES.IP_ADDRESS,
    label: 'IP',
    icon: Globe,
    tier: 'amber',
  },
  {
    type: PII_TYPES.PAN,
    label: 'PAN',
    icon: FileBadge2,
    tier: 'rose',
  },
  {
    type: PII_TYPES.AADHAAR,
    label: 'Aadhaar',
    icon: Fingerprint,
    tier: 'rose',
  },
  {
    type: PII_TYPES.CREDIT_CARD,
    label: 'Credit Card',
    icon: CreditCard,
    tier: 'rose',
  },
];

export default function AuditStats({
  entityCounts,
  ignoredNonLuhnCount = 0,
  hasPayload = false,
}) {
  const total = entityCounts?.total || 0;
  const hasCriticalPII =
    (entityCounts?.[PII_TYPES.CREDIT_CARD] || 0) > 0 ||
    (entityCounts?.[PII_TYPES.AADHAAR] || 0) > 0 ||
    (entityCounts?.[PII_TYPES.PAN] || 0) > 0;

  const summaryStyle = !hasPayload
    ? 'border-slate-800 bg-slate-900/70 text-slate-300'
    : total === 0
    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
    : hasCriticalPII
    ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
    : 'border-amber-500/40 bg-amber-500/10 text-amber-300';

  return (
    <section
      aria-labelledby="audit-stats-heading"
      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-slate-950/60 sm:p-5"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Total PII Card */}
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${summaryStyle}`}
        >
          {total === 0 ? (
            <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-400" aria-hidden="true" />
          ) : (
            <ShieldAlert
              className={`h-6 w-6 shrink-0 ${
                hasCriticalPII ? 'text-rose-400' : 'text-amber-400'
              }`}
              aria-hidden="true"
            />
          )}
          <div>
            <h2
              id="audit-stats-heading"
              className="text-[11px] font-semibold uppercase tracking-wider text-slate-400"
            >
              Total PII Detected
            </h2>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold leading-none">
                {total}
              </span>
              <span className="text-xs font-medium">
                {!hasPayload
                  ? 'Awaiting input'
                  : total === 0
                  ? 'Clean payload'
                  : total === 1
                  ? 'entity redacted'
                  : 'entities redacted'}
              </span>
            </div>
          </div>
        </div>

        {/* 6 Category Count Badges */}
        <div className="grid flex-1 grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
          {CATEGORY_META.map(({ type, label, icon: Icon, tier }) => {
            const count = entityCounts?.[type] || 0;
            const activeClasses =
              count > 0
                ? tier === 'rose'
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                : 'border-slate-800 bg-slate-950/80 text-slate-400';

            const iconColor =
              count > 0
                ? tier === 'rose'
                  ? 'text-rose-400'
                  : 'text-amber-400'
                : 'text-slate-500';

            return (
              <div
                key={type}
                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition ${activeClasses}`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} aria-hidden="true" />
                  <span className="truncate text-xs font-medium">{label}</span>
                </div>
                <span className="rounded-md bg-slate-950/80 px-2 py-0.5 font-mono text-xs font-bold">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Non-Luhn False-Positive Prevention Indicator */}
      {ignoredNonLuhnCount > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs text-emerald-300">
          <Filter className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <span>
            <strong className="font-mono font-bold text-emerald-200">
              {ignoredNonLuhnCount}
            </strong>{' '}
            {ignoredNonLuhnCount === 1
              ? 'non-Luhn 16-digit string safely ignored'
              : 'non-Luhn 16-digit strings safely ignored'}{' '}
            (false-positive prevention active — e.g. Order IDs preserved intact).
          </span>
        </div>
      )}
    </section>
  );
}
