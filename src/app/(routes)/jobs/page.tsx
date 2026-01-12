// src/app/(routes)/jobs/page.tsx
// Jobs list page

'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { JobsList } from '@/presentation/components/jobs/JobsList';
import Link from 'next/link';

export default function JobsPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') || undefined;
  const offset = parseInt(searchParams.get('offset') || '0');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Audio Generation Jobs</h1>
        <Link
          href="/jobs/new"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Job
        </Link>
      </div>

      <div className="mb-6 flex gap-2">
        <Link
          href="/jobs"
          className={`px-4 py-2 rounded ${
            !status ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          All
        </Link>
        <Link
          href="/jobs?status=DRAFT"
          className={`px-4 py-2 rounded ${
            status === 'DRAFT'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Draft
        </Link>
        <Link
          href="/jobs?status=PROCESSING"
          className={`px-4 py-2 rounded ${
            status === 'PROCESSING'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Processing
        </Link>
        <Link
          href="/jobs?status=COMPLETED"
          className={`px-4 py-2 rounded ${
            status === 'COMPLETED'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Completed
        </Link>
        <Link
          href="/jobs?status=FAILED"
          className={`px-4 py-2 rounded ${
            status === 'FAILED'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Failed
        </Link>
      </div>

      <JobsList status={status} offset={offset} />
    </div>
  );
}
