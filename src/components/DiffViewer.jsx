import { useEffect, useState } from 'react';
import {
  Copy,
  Check,
  Download,
  Eye,
  ShieldCheck,
  ArrowLeftRight,
} from 'lucide-react';
import { PII_TYPES } from '../utils/piiDetector.js';

const TYPE_LABELS = {
  [PII_TYPES.EMAIL]: 'EMAIL',
  [PII_TYPES.PHONE]: 'PHONE',
  [PII_TYPES.IP_ADDRESS]: 'IP_ADDRESS',
  [PII_TYPES.PAN]: 'PAN',
  [PII_TYPES.AADHAAR]: 'AADHAAR',
  [PII_TYPES.CREDIT_CARD]: 'CREDIT_CARD',
};

const CRITICAL_TYPES = new Set([
  PII_TYPES.CREDIT_CARD,
  PII_TYPES.AADHAAR,
  PII_TYPES.PAN,
]);

function buildDownloadName(loadedFileName) {
  if (!loadedFileName) {
    return 'sanitized-output.txt';
  }
  const lower = loadedFileName.toLowerCase();
  if (lower.endsWith('.csv')) {
    return `sanitized-${loadedFileName}`;
  }
  if (lower.endsWith('.txt')) {
    return `sanitized-${loadedFileName}`;
  }
  return 'sanitized-output.txt';
}

function renderHighlightedSegments(text, redactions, side) {
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

    const isCritical = CRITICAL_TYPES.has(item.type);
    const badgeClass =
      side === 'original'
        ? isCritical
          ? 'border-rose-500/60 bg-rose-500/20 text-rose-200'
          : 'border-amber-500/60 bg-amber-500/20 text-amber-200'
        : 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300';

    const label = TYPE_LABELS[item.type] || item.type;
    const tooltipText =
      side === 'original'
        ? `Detected ${label}`
        : `Sanitized ${label} token`;

    nodes.push(
      <span
        key={`pii-${side}-${item.id}`}
        title={tooltipText}
        className={`group relative mx-0.5 inline-block rounded border px-1 py-0.5 font-semibold leading-tight transition ${badgeClass}`}
      >
        {token}
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-100 shadow-lg group-hover:block"
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
  loadedFileName,
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

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
    <section
      aria-labelledby="diff-viewer-heading"
      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/60"
    >
      {/* Header + Export Controls */}
      <div className="flex flex-col gap-3 border-b border-slate-800/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            <h2
              id="diff-viewer-heading"
              className="text-base font-semibold text-slate-100"
            >
              3. Live Side-by-Side Diff & Sanitized Export
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Hover highlighted tokens on the left to inspect PII classification. Active mode:{' '}
            <span className="font-mono font-semibold text-emerald-300">
              {redactionMode}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!hasPayload}
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-40 ${
              copied
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Copy Sanitized Text
              </>
            )}
          </button>

          <button
            type="button"
            disabled={!hasPayload}
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download Sanitized File
          </button>
        </div>
      </div>

      {/* Side-by-Side Panes */}
      {hasPayload ? (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left Pane: Original with Highlights */}
          <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-950/90">
            <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Eye className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                Original Input (Detected PII Highlighted)
              </span>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="inline-flex items-center gap-1 text-rose-300">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  High Risk
                </span>
                <span className="inline-flex items-center gap-1 text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Contact/Net
                </span>
              </div>
            </div>
            <pre className="max-h-[26rem] min-h-[14rem] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed text-slate-300">
              {renderHighlightedSegments(rawText, appliedRedactions, 'original')}
            </pre>
          </div>

          {/* Right Pane: Sanitized Output */}
          <div className="flex flex-col rounded-xl border border-emerald-500/25 bg-slate-950/90">
            <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                Sanitized Output (Share-Safe)
              </span>
              <span className="font-mono text-[10px] text-emerald-400/90">
                {appliedRedactions.length} replacements applied
              </span>
            </div>
            <pre className="max-h-[26rem] min-h-[14rem] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed text-slate-200">
              {renderHighlightedSegments(sanitizedText, appliedRedactions, 'sanitized')}
            </pre>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/70 p-6 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">
            No Payload Loaded Yet
          </h3>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-400">
            Paste raw logs, upload a .txt or .csv file, or click{' '}
            <span className="font-semibold text-amber-300">Load Sample Noisy Data</span>{' '}
            above to view live side-by-side PII highlighting and sanitized export.
          </p>
        </div>
      )}
    </section>
  );
}
