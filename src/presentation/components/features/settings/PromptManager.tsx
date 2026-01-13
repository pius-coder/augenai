// src/presentation/components/features/settings/PromptManager.tsx
// Prompt management component

import React from 'react';
import { Button } from '../../shared/Button';
import { Spinner } from '../../shared/Spinner';

export function PromptManager() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [prompts, setPrompts] = React.useState([
    {
      id: 'prompt-1',
      name: 'Product Description',
      content: 'Generate a detailed product description for {{titre}} with these features: {{details}}',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    },
    {
      id: 'prompt-2',
      name: 'Marketing Copy',
      content: 'Create engaging marketing copy for {{titre}} targeting {{category}} customers',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
  ]);

  const [newPrompt, setNewPrompt] = React.useState({
    name: '',
    content: '',
  });

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const createdPrompt = {
        id: `prompt-${Date.now()}`,
        name: newPrompt.name,
        content: newPrompt.content,
        createdAt: new Date(),
      };

      setPrompts([...prompts, createdPrompt]);
      setNewPrompt({ name: '', content: '' });

      // Show success message
      alert('Prompt created successfully!');
    } catch (error) {
      console.error('Failed to create prompt:', error);
      alert('Failed to create prompt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setPrompts(prompts.filter(p => p.id !== promptId));

      // Show success message
      alert('Prompt deleted successfully!');
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      alert('Failed to delete prompt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Prompt Manager</h3>
        <p className="mt-1 text-sm text-gray-600">
          Create and manage custom prompts for your audio generation tasks.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Your Prompts</h4>
          <span className="text-sm text-gray-500">{prompts.length} prompts</span>
        </div>

        {prompts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No custom prompts yet</p>
            <p className="text-sm mt-1">Create your first prompt below</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">{prompt.name}</div>
                    <div className="text-sm text-gray-600 mb-2 truncate">
                      {prompt.content}
                    </div>
                    <div className="text-xs text-gray-400">
                      Created {prompt.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="ml-3 flex flex-col space-y-2">
                    <button
                      onClick={() => {
                        // Copy to clipboard
                        navigator.clipboard.writeText(prompt.content);
                        alert('Prompt copied to clipboard!');
                      }}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title="Copy"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeletePrompt(prompt.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Delete"
                      disabled={isLoading}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h4 className="font-medium text-gray-900 mb-4">Create New Prompt</h4>

        <form onSubmit={handleCreatePrompt} className="space-y-4">
          <div>
            <label htmlFor="promptName" className="block text-sm font-medium text-gray-700 mb-1">
              Prompt Name
            </label>
            <input
              id="promptName"
              name="name"
              value={newPrompt.name}
              onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
              placeholder="e.g., Product Description"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="promptContent" className="block text-sm font-medium text-gray-700 mb-1">
              Prompt Content
            </label>
            <textarea
              id="promptContent"
              name="content"
              value={newPrompt.content}
              onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
              placeholder="e.g., Generate a detailed description for {{titre}}..."
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Use {{variable}} syntax for dynamic content. Available variables: titre, details, category, reference
            </p>
          </div>

          <div className="pt-2">
            <Button 
              type="submit"
              variant="primary"
              disabled={isLoading || !newPrompt.name.trim() || !newPrompt.content.trim()}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                'Create Prompt'
              )}
            </Button>
          </div>
        </form>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <svg className="mr-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-600">
              Prompts help standardize your audio generation workflow and ensure consistent results.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}