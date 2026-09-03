import React, { useState, useEffect } from 'react';
import { Mic, MicOff, X, AlertCircle } from 'lucide-react';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpeechResult: (text: string) => void;
  langCode?: string;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  isOpen,
  onClose,
  onSpeechResult,
  langCode = 'en-US'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsListening(false);
      setTranscript('');
      setError(null);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please type your query.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = langCode;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);
      if (event.results[current].isFinal) {
        setIsListening(false);
        setTimeout(() => {
          onSpeechResult(text);
          onClose();
        }, 500);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech error:", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setError("Microphone permission denied. Please grant permission in browser settings.");
      } else {
        setError(`Speech error: ${event.error}. You can try speaking again or type.`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [isOpen, langCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
        >
          <X size={20} />
        </button>

        <div className="my-4 flex justify-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isListening ? 'bg-rose-50 text-rose-500 animate-pulse ring-8 ring-rose-100' : 'bg-slate-100 text-slate-400'
          }`}>
            {isListening ? <Mic size={36} /> : <MicOff size={36} />}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-slate-900">
          {isListening ? "Listening to your weather question..." : "Voice Input"}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Say e.g. "Will it rain tomorrow in Chennai?" or "Is it safe to travel today?"
        </p>

        {transcript && (
          <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-700 font-medium text-sm">
            "{transcript}"
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 text-left">
            <AlertCircle size={16} className="shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Cancel
          </button>
          {transcript && (
            <button
              onClick={() => {
                onSpeechResult(transcript);
                onClose();
              }}
              className="px-4 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition"
            >
              Use Transcript
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
