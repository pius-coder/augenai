// src/app/(routes)/dashboard/page.tsx
// Main dashboard page with job list and overview

import { JobList } from '@/presentation/components/features/jobs/JobList';
import { JobStats } from '@/presentation/components/features/jobs/JobStats';
import { QuickActions } from '@/presentation/components/features/jobs/QuickActions';
import { PageHeader } from '@/presentation/components/shared/PageHeader';
import { Card } from '@/presentation/components/shared/Card';
import { Button } from '@/presentation/components/shared/Button';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <PageHeader 
        title="Dashboard"
        subtitle="Overview of your audio generation jobs"
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column - Stats and Quick Actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <JobStats />
          </Card>

          <Card className="p-6">
            <QuickActions />
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-600">Job "Marketing Content" completed</span>
                  </div>
                  <span className="text-xs text-gray-400">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-600">New job "Product Descriptions" started</span>
                  </div>
                  <span className="text-xs text-gray-400">5 hours ago</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column - Job List */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Your Jobs</h2>
              <Link href="/jobs/new">
                <Button variant="primary">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Job
                </Button>
              </Link>
            </div>

            <JobList />
          </Card>
        </div>
      </div>

      {/* Help section */}
      <div className="mt-8">
        <Card className="p-6 bg-blue-50">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Need help?</h3>
              <p className="mt-1 text-sm text-gray-600">
                Check out our documentation or contact support if you have any questions.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary" size="sm">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" />
                </svg>
                Documentation
              </Button>
              <Button variant="secondary" size="sm">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Support
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}