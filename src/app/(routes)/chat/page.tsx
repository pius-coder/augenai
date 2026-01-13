// src/app/(routes)/chat/page.tsx
// Chat interface for AI-assisted audio generation

import { ChatContainer } from '@/presentation/components/features/chat/ChatContainer';
import { WorkspacePanel } from '@/presentation/components/features/chat/WorkspacePanel';
import { PageHeader } from '@/presentation/components/shared/PageHeader';
import { Card } from '@/presentation/components/shared/Card';
import { Button } from '@/presentation/components/shared/Button';
import { useState } from 'react';

export default function ChatPage() {
  const [showWorkspace, setShowWorkspace] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="AI Chat Assistant"
        subtitle="Get help with audio generation, job management, and more"
      />

      <div className="p-6">
        <Card className="p-0 overflow-hidden">
          <div className="flex h-[calc(100vh-180px)]">
            {/* Chat Container */}
            <div className={`flex-1 transition-all duration-300 ${showWorkspace ? 'w-2/3' : 'w-full'}`}>
              <ChatContainer />
            </div>

            {/* Workspace Panel */}
            {showWorkspace && (
              <div className="w-1/3 border-l border-gray-200 bg-white">
                <WorkspacePanel />
              </div>
            )}
          </div>
        </Card>

        {/* Toggle Workspace Button */}
        <div className="mt-4 flex justify-end">
          <Button 
            variant="secondary"
            size="sm"
            onClick={() => setShowWorkspace(!showWorkspace)}
          >
            {showWorkspace ? (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Hide Workspace
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Show Workspace
              </>
            )}
          </Button>
        </div>

        {/* Help Tips */}
        <div className="mt-6">
          <Card className="p-4 bg-blue-50">
            <div className="flex items-center">
              <svg className="mr-3 h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-gray-900">Try asking:</p>
                <p className="text-gray-600">
                  "Create a new job from my product descriptions CSV", "What's the status of my jobs?", or "Help me configure voice settings"
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}