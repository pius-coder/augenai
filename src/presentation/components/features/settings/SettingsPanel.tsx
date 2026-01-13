// src/presentation/components/features/settings/SettingsPanel.tsx
// General settings panel

import React from 'react';
import { useUserSettings } from '@/presentation/hooks/settings/useUserSettings';
import { useUpdateUserSettings } from '@/presentation/hooks/settings/useUpdateUserSettings';
import { Button } from '../../shared/Button';
import { Spinner } from '../../shared/Spinner';

export function SettingsPanel() {
  const { settings, isLoading, error } = useUserSettings();
  const { updateSettings, isUpdating } = useUpdateUserSettings();

  const [formData, setFormData] = React.useState({
    theme: 'system',
    language: 'en',
    showAdvancedOptions: false,
  });

  React.useEffect(() => {
    if (settings) {
      setFormData({
        theme: settings.theme || 'system',
        language: settings.language || 'en',
        showAdvancedOptions: settings.showAdvancedOptions || false,
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateSettings({
        uiPreferences: {
          theme: formData.theme as 'light' | 'dark' | 'system',
          language: formData.language,
          showAdvancedOptions: formData.showAdvancedOptions,
        },
      });
      
      // Show success message
      alert('Settings updated successfully!');
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('Failed to update settings. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-red-600">
        <p>Failed to load settings: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
        <p className="mt-1 text-sm text-gray-600">
          Configure your general preferences and interface settings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
              Theme
            </label>
            <select
              id="theme"
              name="theme"
              value={formData.theme}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="system">System Default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700">
              Language
            </label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex h-5 items-center">
            <input
              id="showAdvancedOptions"
              name="showAdvancedOptions"
              type="checkbox"
              checked={formData.showAdvancedOptions}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="showAdvancedOptions" className="font-medium text-gray-700">
              Show Advanced Options
            </label>
            <p className="text-gray-500">Display advanced settings and options in the UI.</p>
          </div>
        </div>

        <div className="pt-4">
          <Button 
            type="submit"
            variant="primary"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}