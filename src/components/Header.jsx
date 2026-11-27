import { ShieldCheck, Lock, Cpu } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-inner shadow-emerald-500/10">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-100">
                PII Shield
              </h1>
              <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider text-slate-300">
                v1.0 Local
              </span>
            </div>
            <p className="text-xs text-slate-400 sm:text-sm">
              Client-Side Data Sanitization Tool
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-emerald-300 shadow-sm shadow-emerald-950/50"
            role="status"
            aria-label="Security guarantee: 100% Client-Side, Zero Data Leaves Your Browser"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <Lock className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            <span>100% Client-Side • Zero Data Leaves Your Browser</span>
          </div>

          <div className="hidden items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-400 md:inline-flex">
            <Cpu className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <span>In-Memory Only</span>
          </div>
        </div>
      </div>
    </header>
  );
}
