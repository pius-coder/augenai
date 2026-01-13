// src/app/(routes)/settings/page.tsx
// User settings and configuration page

import { SettingsPanel } from '@/presentation/components/features/settings/SettingsPanel';
import { PromptManager } from '@/presentation/components/features/settings/PromptManager';
import { VoicePreferences } from '@/presentation/components/features/settings/VoicePreferences';
import { PageHeader } from '@/presentation/components/shared/PageHeader';
import { Card } from '@/presentation/components/shared/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/shared/Tabs';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <PageHeader 
        title="Settings"
        subtitle="Configure your preferences and manage custom prompts"
      />

      <div className="mt-6">
        <Card className="p-6">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid grid-cols-4 max-w-md">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <SettingsPanel />
            </TabsContent>

            <TabsContent value="voice">
              <VoicePreferences />
            </TabsContent>

            <TabsContent value="prompts">
              <PromptManager />
            </TabsContent>

            <TabsContent value="advanced">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Advanced Settings</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Configure advanced options for text generation and audio processing.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700">
                        Max Tokens
                      </label>
                      <div className="mt-1">
                        <input
                          id="maxTokens"
                          name="maxTokens"
                          type="number"
                          min="10"
                          max="4096"
                          defaultValue="2048"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                        Temperature
                      </label>
                      <div className="mt-1">
                        <input
                          id="temperature"
                          name="temperature"
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                          defaultValue="0.7"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="maxChunkSize" className="block text-sm font-medium text-gray-700">
                        Max Chunk Size (chars)
                      </label>
                      <div className="mt-1">
                        <input
                          id="maxChunkSize"
                          name="maxChunkSize"
                          type="number"
                          min="100"
                          max="5000"
                          defaultValue="2000"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="silenceBetweenChunks" className="block text-sm font-medium text-gray-700">
                        Silence Between Chunks (ms)
                      </label>
                      <div className="mt-1">
                        <input
                          id="silenceBetweenChunks"
                          name="silenceBetweenChunks"
                          type="number"
                          min="0"
                          max="5000"
                          defaultValue="500"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Advanced Settings
                  </button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Export/Import Settings */}
      <div className="mt-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Export/Import Settings</h3>
              <p className="mt-1 text-sm text-gray-600">
                Backup your configuration or transfer settings between devices.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Settings
              </button>
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Import Settings
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}