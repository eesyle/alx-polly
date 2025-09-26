'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { PollCreationForm } from '@/components/poll-creation-form';

/**
 * Create Poll Page
 * Protected route for authenticated users to create new polls
 */
export default function CreatePollPage() {
  const { user, isLoading, session } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login?redirectedFrom=/polls/create');
    }
  }, [user, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Return null while redirecting (user will be redirected by useEffect)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create a New Poll
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Engage your audience and gather valuable insights by creating interactive polls. 
            Ask questions, collect opinions, and make data-driven decisions.
          </p>
        </div>

        {/* Poll Creation Form */}
        <PollCreationForm />

        {/* Tips Section */}
        <div className="max-w-2xl mx-auto mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            💡 Tips for Creating Great Polls
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Keep your question clear and specific to get better responses</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Provide balanced options that cover all possible answers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Use descriptive option text to avoid confusion</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Consider setting an expiration date for time-sensitive polls</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Enable anonymous voting for sensitive topics</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}