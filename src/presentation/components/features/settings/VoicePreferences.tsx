// src/presentation/components/features/settings/VoicePreferences.tsx
// Voice preferences settings panel

import React from 'react';
import { Button } from '../../shared/Button';
import { Spinner } from '../../shared/Spinner';

export function VoicePreferences() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [voiceSettings, setVoiceSettings] = React.useState({
    defaultVoiceId: 'rachel',
    defaultStability: 0.5,
    defaultSimilarityBoost: 0.75,
    defaultStyle: 0,
    defaultUseSpeakerBoost: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setVoiceSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Voice settings saved:', voiceSettings);
      
      // Show success message
      alert('Voice settings saved successfully!');
    } catch (error) {
      console.error('Failed to save voice settings:', error);
      alert('Failed to save voice settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Voice Preferences</h3>
        <p className="mt-1 text-sm text-gray-600">
          Configure default voice settings for your audio generation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="defaultVoiceId" className="block text-sm font-medium text-gray-700 mb-1">
            Default Voice
          </label>
          <select
            id="defaultVoiceId"
            name="defaultVoiceId"
            value={voiceSettings.defaultVoiceId}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="rachel">Rachel (Female, American)</option>
            <option value="dave">Dave (Male, American)</option>
            <option value="james">James (Male, British)</option>
            <option value="emma">Emma (Female, British)</option>
            <option value="antoine">Antoine (Male, French)</option>
            <option value="marie">Marie (Female, French)</option>
          </select>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="defaultStability" className="block text-sm font-medium text-gray-700 mb-1">
              Stability
            </label>
            <div className="flex items-center space-x-3">
              <input
                id="defaultStability"
                name="defaultStability"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={voiceSettings.defaultStability}
                onChange={handleChange}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12 text-right">{voiceSettings.defaultStability}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Lower values are more expressive. Higher values are more stable.
            </p>
          </div>

          <div>
            <label htmlFor="defaultSimilarityBoost" className="block text-sm font-medium text-gray-700 mb-1">
              Similarity Boost
            </label>
            <div className="flex items-center space-x-3">
              <input
                id="defaultSimilarityBoost"
                name="defaultSimilarityBoost"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={voiceSettings.defaultSimilarityBoost}
                onChange={handleChange}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12 text-right">{voiceSettings.defaultSimilarityBoost}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Higher values make voice more similar to original speaker.
            </p>
          </div>

          <div>
            <label htmlFor="defaultStyle" className="block text-sm font-medium text-gray-700 mb-1">
              Style
            </label>
            <div className="flex items-center space-x-3">
              <input
                id="defaultStyle"
                name="defaultStyle"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={voiceSettings.defaultStyle}
                onChange={handleChange}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12 text-right">{voiceSettings.defaultStyle}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Higher values add more emphasis and emotion.
            </p>
          </div>

          <div className="flex items-start">
            <div className="flex h-5 items-center">
              <input
                id="defaultUseSpeakerBoost"
                name="defaultUseSpeakerBoost"
                type="checkbox"
                checked={voiceSettings.defaultUseSpeakerBoost}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="defaultUseSpeakerBoost" className="font-medium text-gray-700">
                Use Speaker Boost
              </label>
              <p className="text-gray-500">Enhance speaker consistency for longer audio.</p>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button 
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              'Save Voice Settings'
            )}
          </Button>
        </div>
      </form>

      <div className="pt-4">
        <Button variant="secondary" size="sm" onClick={() => {
          // Reset to defaults
          setVoiceSettings({
            defaultVoiceId: 'rachel',
            defaultStability: 0.5,
            defaultSimilarityBoost: 0.75,
            defaultStyle: 0,
            defaultUseSpeakerBoost: false,
          });
        }}>
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}