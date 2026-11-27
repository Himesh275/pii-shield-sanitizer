import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, KeyRound } from 'lucide-react';
import { PII_TYPES } from '../utils/piiDetector.js';

const TYPE_CHIP_CLASSES = {
  [PII_TYPES.EMAIL]: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
  [PII_TYPES.PHONE]: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
  [PII_TYPES.PAN]: 'border-purple-500/40 bg-purple-500/15 text-purple-300',
  [PII_TYPES.CREDIT_CARD]: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
  [PII_TYPES.AADHAAR]: 'border-teal-500/40 bg-teal-500/15 text-teal-300',
  [PII_TYPES.IP_ADDRESS]: 'border-slate-500/40 bg-slate-500/15 text-slate-200',
};

export default function PseudonymTable({
  isActive,
  appliedRedactions = [],
  activeFilter = null,
}) {
  const [isOpen, setIsOpen] = useState(true);

  const mappings = useMemo(() => {
    const byPlaceholder = new Map();

    for (const item of appliedRedactions) {
      if (activeFilter && item.type !== activeFilter) {
        continue;
      }
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
  }, [appliedRedactions, activeFilter]);

  if (!isActive) {
    return null;
  }

  return (
    <section
      aria-labelledby="pseudonym-table-heading"
      className="rounded-xl border border-[#1F2937] bg-[#111827]"
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-[#1F2937]/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[#10B981]">
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="pseudonym-table-heading"
              className="text-xs font-semibold text-[#F9FAFB]"
            >
              Consistent Pseudonymization Mapping Table
            </h2>
            <p className="text-[11px] text-slate-400">
              {mappings.length}{' '}
              {mappings.length === 1 ? 'unique entity' : 'unique entities'} mapped
              deterministically{activeFilter ? ` (${activeFilter} filter active)` : ''}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-md border border-[#1F2937] bg-[#090D16] px-2.5 py-1 text-[11px] font-medium text-slate-300">
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
        <div className="border-t border-[#1F2937] p-3">
          {mappings.length === 0 ? (
            <p className="py-3 text-center text-xs text-slate-400">
              No matching PII entities detected yet — placeholders will appear here once text is analyzed.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#1F2937] bg-[#090D16]">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1F2937] bg-[#111827] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-2">Placeholder</th>
                    <th className="px-4 py-2">Entity Type</th>
                    <th className="px-4 py-2 text-right">Occurrences</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]">
                  {mappings.map((row) => {
                    const chipClass =
                      TYPE_CHIP_CLASSES[row.type] ||
                      'border-slate-500/40 bg-slate-500/15 text-slate-200';
                    return (
                      <tr key={row.placeholder} className="hover:bg-[#111827]/70">
                        <td className="px-4 py-2 font-mono font-semibold text-[#10B981]">
                          {row.placeholder}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold ${chipClass}`}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right font-mono font-medium text-slate-200">
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
