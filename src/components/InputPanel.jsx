import { useRef, useState } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Trash2,
  SlidersHorizontal,
  AlertTriangle,
  X,
} from 'lucide-react';
import { REDACTION_MODES } from '../data/sampleData.js';

const ALLOWED_EXTENSIONS = ['.txt', '.csv'];

function isSupportedTextFile(fileName) {
  const lower = fileName.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export default function InputPanel({
  rawText,
  onTextChange,
  loadedFileName,
  onFileLoaded,
  onClearFile,
  onLoadSample,
  redactionMode,
  onModeChange,
  onClearAll,
}) {
  const fileInputRef = useRef(null);
  const [fileError, setFileError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const readSelectedFile = (file) => {
    if (!file) return;

    if (!isSupportedTextFile(file.name)) {
      setFileError(
        `Unsupported file "${file.name}". Please upload a .txt or .csv file.`
      );
      return;
    }

    setFileError('');
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = typeof event.target?.result === 'string' ? event.target.result : '';
      onFileLoaded(content, file.name);
    };

    reader.onerror = () => {
      setFileError(`Failed to read "${file.name}" in browser memory.`);
    };

    reader.readAsText(file);
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0];
    readSelectedFile(file);
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    readSelectedFile(file);
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
      className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/60"
    >
      {/* Top Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-800/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="input-panel-heading"
            className="text-base font-semibold text-slate-100"
          >
            1. Raw Payload Input
          </h2>
          <p className="text-xs text-slate-400">
            Paste logs, tickets, or CSV text, or load a local .txt / .csv file.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFileError('');
              onLoadSample();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:border-amber-400/60 hover:bg-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Load Sample Noisy Data
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/50 hover:bg-slate-800/80 hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            Upload .txt / .csv
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,text/plain,text/csv"
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="Upload a .txt or .csv file"
          />

          {rawText && (
            <button
              type="button"
              onClick={() => {
                setFileError('');
                onClearAll();
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:border-rose-500/40 hover:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400/40"
              title="Clear input"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Loaded File Chip */}
      {loadedFileName && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
            <span className="truncate font-mono font-medium">
              Loaded file: {loadedFileName}
            </span>
          </div>
          <button
            type="button"
            onClick={onClearFile}
            className="rounded p-0.5 text-emerald-300/80 transition hover:bg-emerald-500/20 hover:text-emerald-200"
            aria-label="Dismiss loaded filename badge"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* File Validation Error */}
      {fileError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
            <span>{fileError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFileError('')}
            className="rounded p-0.5 text-rose-300/80 hover:bg-rose-500/20"
            aria-label="Dismiss error"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Raw Textarea + Drag-and-Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-xl transition ${
          isDragging ? 'ring-2 ring-emerald-400/70' : ''
        }`}
      >
        <label htmlFor="raw-pii-input" className="sr-only">
          Raw text input for PII sanitization
        </label>
        <textarea
          id="raw-pii-input"
          value={rawText}
          onChange={(event) => onTextChange(event.target.value)}
          rows={12}
          spellCheck={false}
          placeholder="Paste raw support tickets, application logs, CSV rows, or customer messages here — or drop a .txt / .csv file..."
          className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200 placeholder-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:text-[13px]"
        />
        <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>
            {lineCount} {lineCount === 1 ? 'line' : 'lines'} • {charCount.toLocaleString()} chars
          </span>
          <span className="text-slate-500">Processed strictly in local RAM</span>
        </div>
      </div>

      {/* Redaction Mode Selector */}
      <div className="border-t border-slate-800/80 pt-4">
        <div className="mb-3 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-slate-100">
            2. Select Redaction Mode
          </h3>
        </div>

        <div
          role="radiogroup"
          aria-label="Redaction Mode"
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
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
                className={`flex flex-col items-start justify-between rounded-xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-400/50 ${
                  isSelected
                    ? 'border-emerald-500/60 bg-emerald-500/10 shadow-sm shadow-emerald-950/60'
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="w-full">
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-emerald-300' : 'text-slate-200'
                      }`}
                    >
                      {mode.label}
                    </span>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        isSelected ? 'bg-emerald-400' : 'bg-slate-700'
                      }`}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] leading-snug text-slate-400">
                    {mode.description}
                  </p>
                </div>

                <code
                  className={`mt-2.5 block w-full truncate rounded border px-2 py-1 font-mono text-[10px] ${
                    isSelected
                      ? 'border-emerald-500/30 bg-slate-950/90 text-emerald-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400'
                  }`}
                >
                  {mode.example}
                </code>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
