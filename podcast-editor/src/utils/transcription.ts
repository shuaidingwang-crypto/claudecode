import { AudioSegment } from '../types';

// Transcribe audio using Web Speech API (Chrome/Edge only)
// In production, you'd want to use a more robust service like OpenAI Whisper
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  // Check if browser supports Speech Recognition
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn('Speech Recognition not supported, using placeholder');
    return 'Transcription not available in this browser. Please use Chrome or Edge, or integrate with an external transcription service.';
  }

  return new Promise((resolve, reject) => {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    let transcript = '';

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript + ' ';
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      reject(new Error(`Speech recognition error: ${event.error}`));
    };

    recognition.onend = () => {
      resolve(transcript.trim() || 'Unable to transcribe audio');
    };

    // Create an audio element to play the blob (required for speech recognition)
    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.onplay = () => {
      recognition.start();
    };

    audio.onended = () => {
      recognition.stop();
    };

    audio.play().catch(err => {
      console.error('Error playing audio:', err);
      reject(err);
    });
  });
}

// Mock transcription for demonstration (when Web Speech API is not available or for testing)
export async function mockTranscribeAudio(audioBlob: Blob, segmentIndex: number): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockTranscripts = [
    "Welcome to this podcast episode. Today we're going to discuss the fascinating world of audio processing.",
    "In the realm of digital audio, there are many techniques we can use to enhance and manipulate sound.",
    "One of the most important aspects is understanding how audio waveforms work and how we can segment them intelligently.",
    "Let's dive deeper into the technical details of what makes audio editing both an art and a science.",
    "Thank you for listening to this segment. In the next part, we'll explore more advanced topics.",
  ];

  return mockTranscripts[segmentIndex % mockTranscripts.length];
}

// Generate summary using simple extraction (first sentence + keywords)
// In production, you'd want to use an AI service like OpenAI GPT for better summaries
export async function generateSummary(transcript: string): Promise<string> {
  if (!transcript || transcript.length < 10) {
    return 'No summary available';
  }

  // Simple summarization: take first sentence
  const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [transcript];
  const firstSentence = sentences[0]?.trim() || transcript.substring(0, 100);

  // Extract key words (simple approach: longer words that appear frequently)
  const words = transcript.toLowerCase().match(/\b\w{5,}\b/g) || [];
  const wordFreq = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const keywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);

  if (keywords.length > 0) {
    return `${firstSentence} [Key topics: ${keywords.join(', ')}]`;
  }

  return firstSentence;
}

// Process all segments for transcription and summary
export async function processSegmentTranscripts(
  segments: Omit<AudioSegment, 'transcript' | 'summary'>[]
): Promise<AudioSegment[]> {
  const processedSegments: AudioSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    try {
      // Use mock transcription for now (more reliable cross-browser)
      // In production, replace with actual transcription service
      const transcript = await mockTranscribeAudio(segment.audioBlob, i);
      const summary = await generateSummary(transcript);

      processedSegments.push({
        ...segment,
        transcript,
        summary,
      });
    } catch (error) {
      console.error(`Error processing segment ${i}:`, error);
      processedSegments.push({
        ...segment,
        transcript: 'Transcription failed',
        summary: 'Summary not available',
      });
    }
  }

  return processedSegments;
}
