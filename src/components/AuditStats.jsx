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
  RotateCcw,
} from 'lucide-react';
import { PII_TYPES } from '../utils/piiDetector.js';

const CATEGORY_META = [
  {
    type: PII_TYPES.EMAIL,
    label: 'Email',
    icon: Mail,
    badgeClass: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    activeRing: 'ring-2 ring-amber-400/70 border-amber-400',
    iconClass: 'text-amber-400',
  },
  {
    type: PII_TYPES.PHONE,
    label: 'Phone',
    icon: Phone,
    badgeClass: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
    activeRing: 'ring-2 ring-sky-400/70 border-sky-400',
    iconClass: 'text-sky-400',
  },
  {
    type: PII_TYPES.IP_ADDRESS,
    label: 'IP',
    icon: Globe,
    badgeClass: 'border-slate-500/40 bg-slate-500/15 text-slate-200',
    activeRing: 'ring-2 ring-slate-400/70 border-slate-400',
    iconClass: 'text-slate-300',
  },
  {
    type: PII_TYPES.PAN,
    label: 'PAN',
    icon: FileBadge2,
    badgeClass: 'border-purple-500/40 bg-purple-500/15 text-purple-300',
    activeRing: 'ring-2 ring-purple-400/70 border-purple-400',
    iconClass: 'text-purple-400',
  },
  {
    type: PII_TYPES.AADHAAR,
    label: 'Aadhaar',
    icon: Fingerprint,
    badgeClass: 'border-teal-500/40 bg-teal-500/15 text-teal-300',
    activeRing: 'ring-2 ring-teal-400/70 border-teal-400',
    iconClass: 'text-teal-400',
  },
  {
    type: PII_TYPES.CREDIT_CARD,
    label: 'Credit Card',
    icon: CreditCard,
    badgeClass: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
    activeRing: 'ring-2 ring-rose-400/70 border-rose-400',
    iconClass: 'text-rose-400',
  },
];

function getRiskLevel(total, hasPayload) {
  if (!hasPayload || total === 0) {
    return {
      label: 'Low',
      classes: 'border-emerald-500/40 bg-emerald-500/15 text-[#10B981]',
    };
  }
  if (total <= 4) {
    return {
      label: 'Low',
      classes: 'border-emerald-500/40 bg-emerald-500/15 text-[#10B981]',
    };
  }
  if (total <= 14) {
    return {
      label: 'Medium',
      classes: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
    };
  }
  return {
    label: 'High',
    classes: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
  };
}

export default function AuditStats({
  entityCounts,
  ignoredNonLuhnCount = 0,
  hasPayload = false,
  activeFilter = null,
  onFilterChange,
}) {
  const total = entityCounts?.total || 0;
  const risk = getRiskLevel(total, hasPayload);

  return (
    <section
      aria-labelledby="audit-stats-heading"
      className="rounded-xl border border-[#1F2937] bg-[#111827] px-4 py-2.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Total Redactions + Risk Level + Luhn-Rejected False Positives */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            {total === 0 ? (
              <ShieldCheck className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-rose-400" aria-hidden="true" />
            )}
            <h2
              id="audit-stats-heading"
              className="text-[11px] font-semibold uppercase tracking-wider text-slate-400"
            >
              Privacy Audit Bar
            </h2>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#1F2937] bg-[#090D16] px-2.5 py-1 text-xs">
            <span className="text-slate-400">Total Redactions:</span>
            <span className="font-mono font-bold text-[#F9FAFB]">{total}</span>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${risk.classes}`}
          >
            <span className="text-[11px] uppercase tracking-wide opacity-80">Risk:</span>
            <span>{risk.label}</span>
          </div>

          <div
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-[#10B981]"
            title="16-digit numbers failing Luhn checksum (e.g., Order IDs) are safely preserved"
          >
            <Filter className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="font-mono font-bold">{ignoredNonLuhnCount}</span>
            <span>Luhn-Rejected False Positives</span>
          </div>
        </div>

        {/* Right: Clickable Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORY_META.map(
            ({ type, label, icon: Icon, badgeClass, activeRing, iconClass }) => {
              const count = entityCounts?.[type] || 0;
              const isSelected = activeFilter === type;
              const isDimmed = activeFilter && !isSelected;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onFilterChange(isSelected ? null : type)}
                  aria-pressed={isSelected}
                  title={
                    isSelected
                      ? `Clear ${label} filter`
                      : `Filter diff & table to ${label}`
                  }
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${
                    count > 0 || isSelected
                      ? badgeClass
                      : 'border-[#1F2937] bg-[#090D16] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  } ${isSelected ? activeRing : ''} ${
                    isDimmed ? 'opacity-45 hover:opacity-90' : ''
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      count > 0 || isSelected ? iconClass : 'text-slate-500'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{label}</span>
                  <span className="rounded bg-[#090D16]/70 px-1.5 py-0.5 font-mono text-[11px] font-bold leading-none text-[#F9FAFB]">
                    {count}
                  </span>
                </button>
              );
            }
          )}

          {activeFilter && (
            <button
              type="button"
              onClick={() => onFilterChange(null)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#1F2937] bg-[#090D16] px-2 py-1 text-[11px] font-medium text-slate-300 transition hover:border-emerald-500/40 hover:text-[#10B981]"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              All
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
