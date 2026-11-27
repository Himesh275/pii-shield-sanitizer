import { useEffect, useRef, useState } from 'react';
import { Copy, Check, Download, Eye, ShieldCheck } from 'lucide-react';
import { PII_TYPES } from '../utils/piiDetector.js';
import { REDACTION_MODES } from '../data/sampleData.js';

const TYPE_STYLES = {
  [PII_TYPES.EMAIL]: {
    label: 'EMAIL',
    chip: 'border-amber-500/50 bg-amber-500/15 text-amber-200',
  },
  [PII_TYPES.PHONE]: {
    label: 'PHONE',
    chip: 'border-sky-500/50 bg-sky-500/15 text-sky-200',
  },
  [PII_TYPES.PAN]: {
    label: 'PAN',
    chip: 'border-purple-500/50 bg-purple-500/15 text-purple-200',
  },
  [PII_TYPES.CREDIT_CARD]: {
    label: 'CREDIT_CARD',
    chip: 'border-rose-500/50 bg-rose-500/15 text-rose-200',
  },
  [PII_TYPES.AADHAAR]: {
    label: 'AADHAAR',
    chip: 'border-teal-500/50 bg-teal-500/15 text-teal-200',
  },
  [PII_TYPES.IP_ADDRESS]: {
    label: 'IP_ADDRESS',
    chip: 'border-slate-500/50 bg-slate-500/20 text-slate-200',
  },
};

function buildDownloadName(loadedFileName) {
  if (!loadedFileName) {
    return 'sanitized-output.txt';
  }
  const lower = loadedFileName.toLowerCase();
  if (lower.endsWith('.csv') || lower.endsWith('.txt')) {
    return `sanitized-${loadedFileName}`;
  }
  return 'sanitized-output.txt';
}

function renderHighlightedSegments(text, redactions, side, activeFilter) {
  if (!text) return null;
  if (!redactions || redactions.length === 0) {
    return text;
  }

  const nodes = [];
  let cursor = 0;

  redactions.forEach((item) => {
    const start = side === 'original' ? item.originalStart : item.sanitizedStart;
    const end = side === 'original' ? item.originalEnd : item.sanitizedEnd;
    const token = text.slice(start, end);

    if (start > cursor) {
      nodes.push(
        <span key={`plain-${side}-${item.id}-${cursor}`}>
          {text.slice(cursor, start)}
        </span>
      );
    }

    const typeMeta = TYPE_STYLES[item.type] || {
      label: item.type,
      chip: 'border-slate-500/50 bg-slate-500/20 text-slate-200',
    };

    const isFilteredOut = activeFilter && item.type !== activeFilter;

    const badgeClass = isFilteredOut
      ? 'border-[#1F2937] bg-[#090D16]/60 text-slate-500'
      : side === 'original'
      ? typeMeta.chip
      : 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300';

    const tooltipText =
      side === 'original'
        ? `Detected ${typeMeta.label}`
        : `Sanitized ${typeMeta.label}`;

    nodes.push(
      <span
        key={`pii-${side}-${item.id}`}
        title={tooltipText}
        className={`group relative mx-0.5 inline-block rounded border px-1 py-0.5 font-semibold leading-tight transition ${badgeClass}`}
      >
        {token}
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-[#1F2937] bg-[#090D16] px-2 py-0.5 font-mono text-[10px] font-medium text-[#F9FAFB] shadow-xl group-hover:block"
        >
          {tooltipText}
        </span>
      </span>
    );

    cursor = end;
  });

  if (cursor < text.length) {
    nodes.push(<span key={`tail-${side}-${cursor}`}>{text.slice(cursor)}</span>);
  }

  return nodes;
}

export default function DiffViewer({
  rawText,
  sanitizedText,
  appliedRedactions,
  redactionMode,
  onModeChange,
  loadedFileName,
  activeFilter = null,
}) {
  const [copied, setCopied] = useState(false);
  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);
  const syncSourceRef = useRef(null);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleSyncScroll = (source) => {
    if (syncSourceRef.current && syncSourceRef.current !== source) {
      return;
    }

    syncSourceRef.current = source;
    const fromEl = source === 'left' ? leftScrollRef.current : rightScrollRef.current;
    const toEl = source === 'left' ? rightScrollRef.current : leftScrollRef.current;

    if (fromEl && toEl) {
      toEl.scrollTop = fromEl.scrollTop;
    }

    requestAnimationFrame(() => {
      syncSourceRef.current = null;
    });
  };

  const hasPayload = rawText.length > 0;

  const handleCopy = async () => {
    if (!sanitizedText) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(sanitizedText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = sanitizedText;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    if (!sanitizedText) return;
    const filename = buildDownloadName(loadedFileName);
    const mimeType = filename.toLowerCase().endsWith('.csv')
      ? 'text/csv;charset=utf-8'
      : 'text/plain;charset=utf-8';

    const blob = new Blob([sanitizedText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="diff-viewer-heading" className="flex flex-col gap-3">
      {/* Segmented 3-Mode Switcher above Hero Diff */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 id="diff-viewer-heading" className="text-sm font-semibold text-[#F9FAFB]">
            Side-by-Side Sanitization Diff
          </h2>
          <span className="hidden font-mono text-[11px] text-slate-400 sm:inline">
            · Synced scroll · {activeFilter ? `Filtered: ${activeFilter}` : 'All PII types'}
          </span>
        </div>

        <div
          role="radiogroup"
          aria-label="Redaction Mode"
          className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-[#1F2937] bg-[#111827] p-1"
        >
          {REDACTION_MODES.map((mode) => {
            const isSelected = redactionMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onModeChange(mode.id)}
                title={`${mode.description} (e.g. ${mode.example})`}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${
                  isSelected
                    ? 'bg-[#10B981] text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-[#1F2937] hover:text-[#F9FAFB]'
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Wide 50/50 Split Diff View */}
      {hasPayload ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left Pane: Original Input */}
          <div
            ref={leftScrollRef}
            onScroll={() => handleSyncScroll('left')}
            className="h-[360px] overflow-y-auto rounded-xl border border-[#1F2937] bg-[#111827] shadow-lg shadow-black/30 xl:h-[400px] min-[1400px]:h-[450px]"
          >
            <div className="sticky top-0 z-10 flex h-11 items-center justify-between border-b border-[#1F2937] bg-[#090D16]/95 px-4 backdrop-blur">
              <span className="flex items-center gap-2 text-xs font-semibold text-[#F9FAFB]">
                <Eye className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                Original Input
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                Hover tokens for classification
              </span>
            </div>

            <pre className="whitespace-pre-wrap break-words p-4 font-mono text-xs leading-6 text-slate-200">
              {renderHighlightedSegments(
                rawText,
                appliedRedactions,
                'original',
                activeFilter
              )}
            </pre>
          </div>

          {/* Right Pane: Sanitized Output */}
          <div
            ref={rightScrollRef}
            onScroll={() => handleSyncScroll('right')}
            className="h-[360px] overflow-y-auto rounded-xl border border-emerald-500/30 bg-[#111827] shadow-lg shadow-black/30 xl:h-[400px] min-[1400px]:h-[450px]"
          >
            <div className="sticky top-0 z-10 flex h-11 items-center justify-between gap-2 border-b border-[#1F2937] bg-[#090D16]/95 px-4 backdrop-blur">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" />
                <span className="text-xs font-semibold text-[#10B981]">
                  Sanitized Output
                </span>
                <span className="hidden rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#10B981] sm:inline">
                  {appliedRedactions.length} masked
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${
                    copied
                      ? 'border-emerald-400 bg-emerald-500/20 text-[#10B981]'
                      : 'border-[#1F2937] bg-[#111827] text-[#F9FAFB] hover:border-emerald-500/40 hover:bg-[#1F2937]'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-[#10B981]" aria-hidden="true" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-slate-300" aria-hidden="true" />
                      Copy
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1 rounded-md bg-[#10B981] px-2.5 py-1 text-[11px] font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                >
                  <Download className="h-3 w-3" aria-hidden="true" />
                  Download
                </button>
              </div>
            </div>

            <pre className="whitespace-pre-wrap break-words p-4 font-mono text-xs leading-6 text-[#F9FAFB]">
              {renderHighlightedSegments(
                sanitizedText,
                appliedRedactions,
                'sanitized',
                activeFilter
              )}
            </pre>
          </div>
        </div>
      ) : (
        <div className="flex h-[340px] flex-col items-center justify-center rounded-xl border border-dashed border-[#1F2937] bg-[#111827] p-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[#10B981]">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-[#F9FAFB]">
            Client-Side Workspace Ready
          </h3>
          <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-400">
            Click <strong className="font-semibold text-[#10B981]">Load Sample Data</strong>{' '}
            or <strong className="font-semibold text-[#F9FAFB]">Upload .txt/.csv</strong> in the
            header, or paste raw text into the input buffer to inspect live PII redaction.
          </p>
        </div>
      )}

      {/* Copy-Success Toast Notification */}
      {copied && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-[#111827] px-4 py-2.5 text-xs font-semibold text-[#10B981] shadow-2xl shadow-black/60"
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Sanitized text copied to clipboard — zero network calls</span>
        </div>
      )}
    </section>
  );
}
