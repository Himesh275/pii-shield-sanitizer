import { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  X,
  ChevronUp,
  ChevronDown,
  Terminal,
} from 'lucide-react';

export default function InputPanel({
  rawText,
  onTextChange,
  onFileDrop,
  fileError,
  onDismissError,
  onClearAll,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (isCollapsed) setIsCollapsed(false);
      onFileDrop(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const lineCount = rawText ? rawText.split(/\r\n|\r|\n/).length : 0;
  const charCount = rawText.length;

  return (
    <section
      aria-labelledby="input-panel-heading"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`rounded-xl border bg-[#111827] px-4 py-2.5 transition ${
        isDragging ? 'border-[#10B981] ring-2 ring-emerald-500/30' : 'border-[#1F2937]'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Terminal className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" />
          <h2
            id="input-panel-heading"
            className="text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Input Buffer
          </h2>
          <span className="rounded border border-[#1F2937] bg-[#090D16] px-2 py-0.5 font-mono text-[11px] text-slate-400">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'} · {charCount.toLocaleString()} chars
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-md border border-[#1F2937] bg-[#090D16] px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:border-slate-600 hover:text-[#F9FAFB]"
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
                Show Input
              </>
            ) : (
              <>
                <ChevronUp className="h-3 w-3" aria-hidden="true" />
                Collapse Input
              </>
            )}
          </button>

          {rawText && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 rounded-md border border-[#1F2937] bg-[#090D16] px-2.5 py-1 text-[11px] font-medium text-slate-400 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      </div>

      {fileError && (
        <div
          role="alert"
          className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden="true" />
            <span>{fileError}</span>
          </div>
          <button
            type="button"
            onClick={onDismissError}
            className="rounded p-0.5 text-rose-300 hover:bg-rose-500/20"
            aria-label="Dismiss error"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {!isCollapsed && (
        <div className="mt-2.5">
          <label htmlFor="raw-pii-input" className="sr-only">
            Raw text input for PII sanitization
          </label>
          <textarea
            id="raw-pii-input"
            value={rawText}
            onChange={(event) => onTextChange(event.target.value)}
            rows={3}
            spellCheck={false}
            placeholder="Paste raw support tickets, logs, CSV rows, or drop a .txt / .csv file anywhere here..."
            className="w-full resize-y rounded-lg border border-[#1F2937] bg-[#090D16] px-3 py-2 font-mono text-xs leading-relaxed text-[#F9FAFB] placeholder-slate-500 transition focus:border-[#10B981] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      )}
    </section>
  );
}
