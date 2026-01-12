// src/app/(routes)/jobs/new/page.tsx
// Create new job page

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateJob } from '@/presentation/state/queries/useJobs';

export default function NewJobPage() {
  const router = useRouter();
  const createJob = useCreateJob();
  const [formData, setFormData] = useState({
    name: '',
    voiceId: '',
    systemPrompt: '',
    userPromptTemplate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createJob.mutateAsync(formData);
      router.push('/jobs');
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Create New Job</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Job Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="My Audio Generation Job"
          />
        </div>

        <div>
          <label htmlFor="voiceId" className="block text-sm font-medium text-gray-700 mb-2">
            Voice ID (Optional)
          </label>
          <input
            type="text"
            id="voiceId"
            name="voiceId"
            value={formData.voiceId}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="voice_12345..."
          />
        </div>

        <div>
          <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 mb-2">
            System Prompt (Optional)
          </label>
          <textarea
            id="systemPrompt"
            name="systemPrompt"
            rows={4}
            value={formData.systemPrompt}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="You are a helpful assistant that generates audio content..."
          />
        </div>

        <div>
          <label htmlFor="userPromptTemplate" className="block text-sm font-medium text-gray-700 mb-2">
            User Prompt Template (Optional)
          </label>
          <textarea
            id="userPromptTemplate"
            name="userPromptTemplate"
            rows={4}
            value={formData.userPromptTemplate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Generate content about: {{'{{'}}details{{'}}'}}"
          />
          <p className="text-sm text-gray-500 mt-1">
            Use variables: {'{'}}{'{'}titre{'}'}{'}'}, {'{'}}{'{'}details{'}'}{'}'}, {'{'}}{'{'}category{'}'}{'}'}, {'{'}}{'{'}reference{'}'}{'}'}'
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={createJob.isPending}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createJob.isPending ? 'Creating...' : 'Create Job'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>

        {createJob.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p>Error: {createJob.error.message}</p>
          </div>
        )}
      </form>
    </div>
  );
}
