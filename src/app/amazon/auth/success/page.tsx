'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle, User, Building } from 'lucide-react';

export default function AmazonAuthSuccess() {
  const searchParams = useSearchParams();
  const [sellerId, setSellerId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');

  useEffect(() => {
    const sellerIdParam = searchParams.get('seller_id');
    const accountIdParam = searchParams.get('account_id');
    
    setSellerId(sellerIdParam || '');
    setAccountId(accountIdParam || '');
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Successful
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your Amazon account has been successfully connected to PacePivot.
          </p>
          
          {(sellerId || accountId) && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">Account Details:</h3>
              
              {sellerId && (
                <div className="flex items-center mb-2">
                  <User className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Seller ID:</span>
                  <span className="text-sm font-mono text-gray-900 ml-2">{sellerId}</span>
                </div>
              )}
              
              {accountId && (
                <div className="flex items-center">
                  <Building className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Account ID:</span>
                  <span className="text-sm font-mono text-gray-900 ml-2">{accountId}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/amazon'}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Amazon Dashboard
            </button>
            
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Return to Main Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
