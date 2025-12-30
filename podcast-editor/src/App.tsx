import { useState } from 'react';
import { AudioUpload } from './components/AudioUpload';
import { TimelineEditor } from './components/TimelineEditor';
import type { AudioSegment } from './types';
import './App.css';

function App() {
  const [segments, setSegments] = useState<AudioSegment[] | null>(null);

  const handleSegmentsReady = (processedSegments: AudioSegment[]) => {
    setSegments(processedSegments);
  };

  const handleBack = () => {
    setSegments(null);
  };

  return (
    <div className="App">
      {!segments ? (
        <AudioUpload onSegmentsReady={handleSegmentsReady} />
      ) : (
        <TimelineEditor initialSegments={segments} onBack={handleBack} />
      )}
    </div>
  );
}

export default App;
