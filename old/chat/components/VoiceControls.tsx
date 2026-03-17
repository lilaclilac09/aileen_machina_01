'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface VoiceControlsProps {
  onTranscript: (text: string) => void;
}

export function VoiceControls({ onTranscript }: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcriptText = event.results[current][0].transcript;
          setTranscript(transcriptText);

          if (event.results[current].isFinal) {
            onTranscript(transcriptText);
            setTranscript('');
            setIsListening(false);
          }
        };

        recognition.onerror = (event: any) => {
          setError('Speech recognition error: ' + event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setError('Speech recognition not supported in this browser');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const playTTS = async (text: string) => {
    try {
      setIsSpeaking(true);
      const response = await fetch('/chat/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('TTS failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="mech-panel space-y-4">
      {/* Voice input */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleListening}
          className={`metal-button flex-1 flex items-center justify-center gap-2 ${
            isListening ? 'border-neon-cyan' : ''
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="text-neon-cyan" size={24} />
              <span className="neon-text">LISTENING...</span>
            </>
          ) : (
            <>
              <Mic size={24} />
              <span>TAP TO SPEAK</span>
            </>
          )}
        </button>

        {isSpeaking && (
          <div className="flex items-center gap-2 text-neon-cyan">
            <Volume2 size={20} className="animate-pulse" />
            <span className="text-sm">SPEAKING</span>
          </div>
        )}
      </div>

      {/* Transcript display */}
      {transcript && (
        <div className="text-sm text-gray-300 p-3 bg-metal-dark rounded border border-neon-cyan/30">
          {transcript}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="text-sm text-neon-red p-3 bg-metal-dark rounded border border-neon-red/30">
          {error}
        </div>
      )}

      {/* Waveform visualization (placeholder for Phase 2) */}
      {isListening && (
        <div className="flex items-center justify-center gap-1 h-8">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-neon-cyan rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 100}%`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
