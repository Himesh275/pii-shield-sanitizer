import { useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import InputPanel from './components/InputPanel.jsx';
import AuditStats from './components/AuditStats.jsx';
import DiffViewer from './components/DiffViewer.jsx';
import PseudonymTable from './components/PseudonymTable.jsx';
import { REDACTION_MODES, SAMPLE_NOISY_DATA } from './data/sampleData.js';
import { redactPII, REDACTION_MODE } from './utils/redactor.js';
import { countIgnoredNonLuhn16DigitStrings } from './utils/piiDetector.js';

export default function App() {
  const [rawText, setRawText] = useState('');
  const [loadedFileName, setLoadedFileName] = useState('');
  const [redactionMode, setRedactionMode] = useState(REDACTION_MODES[0].id);

  const handleTextChange = (nextText) => {
    setRawText(nextText);
  };

  const handleFileLoaded = (content, fileName) => {
    setRawText(content);
    setLoadedFileName(fileName);
  };

  const handleLoadSample = () => {
    setRawText(SAMPLE_NOISY_DATA);
    setLoadedFileName('');
  };

  const handleClearAll = () => {
    setRawText('');
    setLoadedFileName('');
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
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <InputPanel
          rawText={rawText}
          onTextChange={handleTextChange}
          loadedFileName={loadedFileName}
          onFileLoaded={handleFileLoaded}
          onClearFile={() => setLoadedFileName('')}
          onLoadSample={handleLoadSample}
          redactionMode={redactionMode}
          onModeChange={setRedactionMode}
          onClearAll={handleClearAll}
        />

        <AuditStats
          entityCounts={entityCounts}
          ignoredNonLuhnCount={ignoredNonLuhnCount}
          hasPayload={hasPayload}
        />

        <DiffViewer
          rawText={rawText}
          sanitizedText={sanitizedText}
          appliedRedactions={appliedRedactions}
          redactionMode={redactionMode}
          loadedFileName={loadedFileName}
        />

        <PseudonymTable
          isActive={isPseudonymMode}
          appliedRedactions={appliedRedactions}
        />
      </main>
    </div>
  );
}
