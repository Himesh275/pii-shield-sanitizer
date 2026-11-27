import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, KeyRound } from 'lucide-react';
import { PII_TYPES } from '../utils/piiDetector.js';

const CRITICAL_TYPES = new Set([
  PII_TYPES.CREDIT_CARD,
  PII_TYPES.AADHAAR,
  PII_TYPES.PAN,
]);

export default function PseudonymTable({
  isActive,
  appliedRedactions = [],
}) {
  const [isOpen, setIsOpen] = useState(true);

  const mappings = useMemo(() => {
    const byPlaceholder = new Map();

    for (const item of appliedRedactions) {
      const existing = byPlaceholder.get(item.replacement);
      if (existing) {
        existing.occurrences += 1;
      } else {
        byPlaceholder.set(item.replacement, {
          placeholder: item.replacement,
          type: item.type,
          occurrences: 1,
        });
      }
    }

    return Array.from(byPlaceholder.values());
  }, [appliedRedactions]);

  if (!isActive) {
    return null;
  }

  return (
    <section
      aria-labelledby="pseudonym-table-heading"
      className="rounded-2xl border border-emerald-500/30 bg-slate-900/70 shadow-xl shadow-slate-950/60"
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-900/90 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 rounded-2xl"
      >
        <div className="flex items-center gap-2.5">
          <KeyRound className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <div>
            <h2
              id="pseudonym-table-heading"
              className="text-sm font-semibold text-slate-100"
            >
              4. Consistent Pseudonymization Mapping Table
            </h2>
            <p className="text-xs text-slate-400">
              Session-scoped deterministic alias audit ({mappings.length}{' '}
              {mappings.length === 1 ? 'unique entity' : 'unique entities'})
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300">
          {isOpen ? (
            <>
              Collapse <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </>
          ) : (
            <>
              Expand <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </>
          )}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-slate-800/80 px-5 pb-5 pt-3">
          {mappings.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">
              No PII entities detected yet — placeholders will appear here once text is analyzed.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-2.5 font-semibold">Placeholder</th>
                    <th className="px-4 py-2.5 font-semibold">Entity Type</th>
                    <th className="px-4 py-2.5 font-semibold text-right">
                      Occurrences Mapped
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {mappings.map((row) => {
                    const isCritical = CRITICAL_TYPES.has(row.type);
                    return (
                      <tr key={row.placeholder} className="hover:bg-slate-900/50">
                        <td className="px-4 py-2.5 font-mono font-semibold text-emerald-300">
                          {row.placeholder}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold ${
                              isCritical
                                ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                                : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                            }`}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-300">
                          {row.occurrences}×
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
