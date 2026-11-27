import { useRef } from 'react';
import { ShieldCheck, Lock, Sparkles, Upload, FileText, X } from 'lucide-react';

export default function Header({
  onLoadSample,
  onFileSelect,
  loadedFileName,
  onClearFile,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    event.target.value = '';
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#1F2937] bg-[#090D16]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        {/* Left: Brand + Verified 100% Client-Side Emerald Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/15 text-[#10B981] shadow-sm shadow-emerald-950/40">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-base font-bold tracking-tight text-[#F9FAFB]">
                PII Shield
              </h1>
              <span className="hidden font-mono text-[11px] font-medium uppercase tracking-wider text-slate-400 sm:inline">
                Zero-Leakage Sanitizer
              </span>
            </div>
          </div>

          <div
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-[#10B981]"
            role="status"
            aria-label="100% Client-Side • Zero Data Leaves Your Browser"
            title="All detection and redaction runs strictly in local browser memory"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10B981]" />
            </span>
            <Lock className="h-3 w-3" aria-hidden="true" />
            <span>100% Client-Side</span>
          </div>

          {loadedFileName && (
            <div className="inline-flex max-w-[210px] items-center gap-1.5 rounded-full border border-[#1F2937] bg-[#111827] px-2.5 py-1 text-[11px] font-medium text-slate-200">
              <FileText className="h-3 w-3 shrink-0 text-[#10B981]" aria-hidden="true" />
              <span className="truncate font-mono">{loadedFileName}</span>
              <button
                type="button"
                onClick={onClearFile}
                className="rounded-full p-0.5 text-slate-400 transition hover:bg-[#1F2937] hover:text-[#F9FAFB]"
                aria-label="Clear loaded filename"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Load Sample Data + Upload .txt/.csv */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#10B981] px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Load Sample Data</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1F2937] bg-[#111827] px-3 py-1.5 text-xs font-semibold text-[#F9FAFB] transition hover:border-emerald-500/40 hover:bg-[#1F2937] focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          >
            <Upload className="h-3.5 w-3.5 text-[#10B981]" aria-hidden="true" />
            <span>Upload .txt/.csv</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,text/plain,text/csv"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload a .txt or .csv file"
          />
        </div>
      </div>
    </header>
  );
}
