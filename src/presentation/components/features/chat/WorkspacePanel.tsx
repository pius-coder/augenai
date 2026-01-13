// src/presentation/components/features/chat/WorkspacePanel.tsx
// Workspace panel showing job status and tools

import React from 'react';
import { JobStats } from '../jobs/JobStats';
import { QuickActions } from '../jobs/QuickActions';
import { VoiceSelector } from './VoiceSelector';
import { PromptTemplates } from './PromptTemplates';
import { Card } from '../../shared/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/Tabs';

export function WorkspacePanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900">Workspace</h3>
        <p className="text-sm text-gray-500">Manage your jobs and settings</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="jobs" className="h-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            <Card className="p-4">
              <JobStats />
            </Card>

            <Card className="p-4">
              <QuickActions />
            </Card>

            <Card className="p-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Recent Jobs</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-gray-700">Marketing Content</span>
                    </div>
                    <span className="text-xs text-gray-400">2h ago</span>
                  </div>
                  <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                      <span className="text-gray-700">Product Descriptions</span>
                    </div>
                    <span className="text-xs text-gray-400">Active</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="voice" className="space-y-4">
            <Card className="p-4">
              <VoiceSelector />
            </Card>

            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Voice Settings</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stability</label>
                      <input type="range" min="0" max="1" step="0.1" defaultValue="0.5" className="w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Similarity Boost</label>
                      <input type="range" min="0" max="1" step="0.1" defaultValue="0.75" className="w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                      <input type="range" min="0" max="1" step="0.1" defaultValue="0" className="w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="prompts" className="space-y-4">
            <Card className="p-4">
              <PromptTemplates />
            </Card>

            <Card className="p-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">System Prompt</h4>
                  <textarea
                    placeholder="You are a helpful AI assistant..."
                    className="w-full p-2 border border-gray-300 rounded text-sm h-20 resize-none"
                    defaultValue="You are a helpful AI assistant that helps users with audio generation tasks. Be concise and professional."
                  />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">User Prompt Template</h4>
                  <textarea
                    placeholder="Generate audio for: {{titre}}..."
                    className="w-full p-2 border border-gray-300 rounded text-sm h-20 resize-none"
                    defaultValue="Generate a professional audio description for the following product:\n\nTitle: {{titre}}\nDetails: {{details}}\nCategory: {{category}}"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-500">Need help? Ask the AI assistant!</span>
          </div>
          <button className="text-blue-600 hover:text-blue-800 font-medium">
            View Docs
          </button>
        </div>
      </div>
    </div>
  );
}