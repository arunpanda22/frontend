'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

export default function AmazonAuthError() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const errorMessage = searchParams.get('message');
    setMessage(errorMessage || 'An error occurred during Amazon authentication');
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Failed
          </h1>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
            
            <button
              onClick={() => window.location.href = '/amazon'}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Return to Amazon Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
