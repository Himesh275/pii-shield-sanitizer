import { useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import InputPanel from './components/InputPanel.jsx';
import AuditStats from './components/AuditStats.jsx';
import DiffViewer from './components/DiffViewer.jsx';
import PseudonymTable from './components/PseudonymTable.jsx';
import { REDACTION_MODES, SAMPLE_NOISY_DATA } from './data/sampleData.js';
import { redactPII, REDACTION_MODE } from './utils/redactor.js';
import { countIgnoredNonLuhn16DigitStrings } from './utils/piiDetector.js';

const ALLOWED_EXTENSIONS = ['.txt', '.csv'];

function isSupportedTextFile(fileName) {
  const lower = fileName.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export default function App() {
  const [rawText, setRawText] = useState('');
  const [loadedFileName, setLoadedFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [redactionMode, setRedactionMode] = useState(REDACTION_MODES[0].id);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState(null);

  const handleFileSelect = (file) => {
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
      const content =
        typeof event.target?.result === 'string' ? event.target.result : '';
      setRawText(content);
      setLoadedFileName(file.name);
      setActiveCategoryFilter(null);
    };

    reader.onerror = () => {
      setFileError(`Failed to read "${file.name}" in browser memory.`);
    };

    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setFileError('');
    setRawText(SAMPLE_NOISY_DATA);
    setLoadedFileName('');
    setActiveCategoryFilter(null);
  };

  const handleClearAll = () => {
    setFileError('');
    setRawText('');
    setLoadedFileName('');
    setActiveCategoryFilter(null);
  };

  const { sanitizedText, entityCounts, appliedRedactions } = useMemo(
    () => redactPII(rawText, redactionMode),
    [rawText, redactionMode]
  );

  const ignoredNonLuhnCount = useMemo(
    () => countIgnoredNonLuhn16DigitStrings(rawText),
    [rawText]
  );

  const hasPayload = rawText.trim().length > 0;
  const isPseudonymMode = redactionMode === REDACTION_MODE.PSEUDONYMIZE;

  return (
    <div className="flex min-h-screen flex-col bg-[#090D16] text-[#F9FAFB]">
      <Header
        onLoadSample={handleLoadSample}
        onFileSelect={handleFileSelect}
        loadedFileName={loadedFileName}
        onClearFile={() => setLoadedFileName('')}
      />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3.5 px-4 py-4 sm:px-6">
        <AuditStats
          entityCounts={entityCounts}
          ignoredNonLuhnCount={ignoredNonLuhnCount}
          hasPayload={hasPayload}
          activeFilter={activeCategoryFilter}
          onFilterChange={setActiveCategoryFilter}
        />

        <InputPanel
          rawText={rawText}
          onTextChange={setRawText}
          onFileDrop={handleFileSelect}
          fileError={fileError}
          onDismissError={() => setFileError('')}
          onClearAll={handleClearAll}
        />

        <DiffViewer
          rawText={rawText}
          sanitizedText={sanitizedText}
          appliedRedactions={appliedRedactions}
          redactionMode={redactionMode}
          onModeChange={setRedactionMode}
          loadedFileName={loadedFileName}
          activeFilter={activeCategoryFilter}
        />

        <PseudonymTable
          isActive={isPseudonymMode}
          appliedRedactions={appliedRedactions}
          activeFilter={activeCategoryFilter}
        />
      </main>
    </div>
  );
}
