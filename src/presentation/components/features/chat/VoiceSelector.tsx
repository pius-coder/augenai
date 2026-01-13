// src/presentation/components/features/chat/VoiceSelector.tsx
// Voice selection component

import React, { useState } from 'react';
import { Button } from '../../shared/Button';

const voices = [
  { id: 'rachel', name: 'Rachel', gender: 'female', accent: 'American' },
  { id: 'dave', name: 'Dave', gender: 'male', accent: 'American' },
  { id: 'james', name: 'James', gender: 'male', accent: 'British' },
  { id: 'emma', name: 'Emma', gender: 'female', accent: 'British' },
  { id: 'antoine', name: 'Antoine', gender: 'male', accent: 'French' },
  { id: 'marie', name: 'Marie', gender: 'female', accent: 'French' },
];

export function VoiceSelector() {
  const [selectedVoice, setSelectedVoice] = useState('rachel');
  const [isPlaying, setIsPlaying] = useState(false);

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoice(voiceId);
  };

  const handlePreview = async () => {
    setIsPlaying(true);
    // In a real app, this would call the preview API
    console.log(`Previewing voice: ${selectedVoice}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsPlaying(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-gray-900 mb-2">Select Voice</h3>
        <div className="grid grid-cols-2 gap-2">
          {voices.map((voice) => (
            <button
              key={voice.id}
              onClick={() => handleVoiceSelect(voice.id)}
              className={`p-2 rounded border text-sm transition-colors ${
                selectedVoice === voice.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{voice.name}</div>
              <div className="text-xs text-gray-500">
                {voice.gender} • {voice.accent}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-2">Preview</h3>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePreview}
            disabled={isPlaying}
            className="flex-1"
          >
            {isPlaying ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Playing...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                Preview Voice
              </>
            )}
          </Button>
          <Button variant="secondary" size="sm" className="flex-shrink-0">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share
          </Button>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-2">Current Selection</h3>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{voices.find(v => v.id === selectedVoice)?.name}</div>
              <div className="text-sm text-gray-500">
                {voices.find(v => v.id === selectedVoice)?.gender} • {voices.find(v => v.id === selectedVoice)?.accent}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">ID: {selectedVoice}</span>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}