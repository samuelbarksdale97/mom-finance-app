'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDropzone } from 'react-dropzone';
import { processFile } from '@/lib/fileParser';
import { getUncategorizedTransactions } from '@/lib/firestore';
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { CSVMapping, Transaction } from '@/types';

interface ProcessingState {
  status: 'idle' | 'processing' | 'success' | 'error' | 'manual-mapping' | 'checking-duplicates';
  message?: string;
  transactions?: Omit<Transaction, 'id' | 'categoryId' | 'createdAt' | 'updatedAt'>[];
  uncategorizedTransactions?: Omit<Transaction, 'id' | 'categoryId' | 'createdAt' | 'updatedAt'>[];
  mapping?: CSVMapping | null;
  headers?: string[];
  errors?: string[];
  totalCount?: number;
  newCount?: number;
  existingCount?: number;
}

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      setProcessingState({
        status: 'error',
        message: 'Please upload a CSV or Excel file. This looks like a different type of file.',
      });
      return;
    }

    setProcessingState({ status: 'processing', message: 'Reading your file...' });

    try {
      const result = await processFile(file);
      
      if (!result.mapping) {
        setProcessingState({
          status: 'manual-mapping',
          message: 'We need help identifying the columns in your file.',
          headers: result.headers,
          errors: result.errors,
        });
        return;
      }

      if (result.errors.length > 0) {
        setProcessingState({
          status: 'error',
          message: 'There were some issues processing your file:',
          errors: result.errors,
        });
        return;
      }

      // Check for duplicates
      setProcessingState({ 
        status: 'checking-duplicates', 
        message: 'Checking for duplicate transactions...' 
      });

      const duplicateCheck = await getUncategorizedTransactions(user!.uid, result.transactions);
      
      if (duplicateCheck.newCount === 0) {
        setProcessingState({
          status: 'success',
          message: `All ${duplicateCheck.existingCount} transactions have already been categorized! There are no new transactions to process.`,
          transactions: result.transactions,
          uncategorizedTransactions: [],
          mapping: result.mapping,
          totalCount: result.transactions.length,
          newCount: 0,
          existingCount: duplicateCheck.existingCount,
        });
      } else {
        setProcessingState({
          status: 'success',
          message: duplicateCheck.existingCount > 0 
            ? `Found ${result.transactions.length} transactions: ${duplicateCheck.newCount} are new and ${duplicateCheck.existingCount} already exist.`
            : `Successfully processed ${result.transactions.length} new transactions!`,
          transactions: result.transactions,
          uncategorizedTransactions: duplicateCheck.uncategorizedTransactions,
          mapping: result.mapping,
          totalCount: result.transactions.length,
          newCount: duplicateCheck.newCount,
          existingCount: duplicateCheck.existingCount,
        });
      }

    } catch (error) {
      setProcessingState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong processing your file.',
      });
    }
  }, [user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv', '.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  });

  const handleContinueToCategories = () => {
    if (processingState.uncategorizedTransactions && processingState.uncategorizedTransactions.length > 0) {
      // Store only new/uncategorized transactions in session storage for the categorization wizard
      sessionStorage.setItem('uncategorizedTransactions', JSON.stringify(processingState.uncategorizedTransactions));
      router.push('/categorize');
    }
  };

  const resetUpload = () => {
    setProcessingState({ status: 'idle' });
  };

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-green-50">
      {/* Warm, welcoming header */}
      <header className="bg-gradient-to-r from-amber-50 via-orange-50 to-green-50 border-b-2 border-amber-200 relative overflow-hidden shadow-lg">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-4 right-4 w-32 h-32 bg-green-300 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-4 left-4 w-40 h-40 bg-amber-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-6 py-8 relative">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-4 bg-white/60 hover:bg-white/80 rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-105"
              aria-label="Go back to dashboard"
            >
              <ArrowLeft size={28} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 bg-clip-text text-transparent mb-2 drop-shadow-sm">
                Welcome! Let's sort your finances.
              </h1>
              <p className="text-xl text-gray-700 leading-relaxed font-medium">This is simple and safe - let's get started together! 🌟</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {processingState.status === 'idle' && (
          <div className="max-w-2xl mx-auto">
            {/* Main upload area - single, centered panel */}
            <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-green-50/80 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-amber-200 p-8 text-center mb-8 relative overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
              {/* Subtle background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full opacity-40 blur-2xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-200 rounded-full opacity-40 blur-2xl animate-pulse delay-1000"></div>
              
              <div
                {...getRootProps()}
                className={`border-4 border-dashed rounded-3xl p-16 transition-all duration-500 cursor-pointer relative transform ${
                  isDragActive
                    ? 'border-green-400 bg-green-100/80 scale-105 shadow-2xl rotate-1' 
                    : 'border-amber-400 hover:border-green-400 hover:bg-green-50/60 hover:scale-[1.02] hover:shadow-xl hover:-rotate-1'
                }`}
              >
                <input {...getInputProps()} />
                <div className="text-center relative z-10">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl mx-auto mb-6 transform transition-all duration-300 ${
                    isDragActive 
                      ? 'bg-gradient-to-br from-green-400 to-green-500 animate-bounce scale-110' 
                      : 'bg-gradient-to-br from-green-500 to-green-600 hover:scale-110 hover:rotate-12'
                  }`}>
                    <Upload size={40} className="text-white" />
                  </div>
                  
                  <h2 className="text-3xl font-bold text-gray-800 mb-4 transform transition-all duration-300">
                    {isDragActive ? '🎉 Perfect! Drop it right here' : '📄 Upload Your Bank Statement'}
                  </h2>
                  
                  <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-lg mx-auto font-medium">
                    {isDragActive
                      ? 'Just release to get started on your financial journey!'
                      : 'This is the CSV or Excel file you downloaded from your bank. Don\'t worry - we\'ll guide you through everything step by step! ✨'}
                  </p>
                  
                  {!isDragActive && (
                    <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-12 py-6 rounded-2xl font-bold text-xl shadow-xl hover:from-green-600 hover:to-green-700 hover:shadow-2xl hover:scale-105 hover:-translate-y-1 transform transition-all duration-300 mb-6">
                      📁 Choose Your CSV or Excel File
                    </button>
                  )}
                  
                  <p className="text-lg text-gray-500 mt-4 font-medium">
                    💡 Or, you can drag your CSV or Excel file here
                  </p>
                </div>
              </div>
            </div>

            {/* Reassuring information with visual appeal */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-amber-200 p-8 text-center relative overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
              {/* Background decoration */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-64 h-64 bg-gradient-to-br from-green-200 to-amber-200 rounded-full opacity-30 blur-3xl animate-pulse"></div>
              
              <div className="relative z-10">
                <h3 className="text-3xl font-bold text-gray-700 mb-8">🚀 Here's what happens next:</h3>
                <div className="space-y-8">
                  <div className="flex items-start gap-6 text-left transform hover:scale-105 transition-transform duration-300">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-lg shadow-lg flex-shrink-0">
                      <span>1</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-2">🔒 We'll read your file safely</h4>
                      <p className="text-gray-600 text-lg leading-relaxed">Your information stays private and secure on your device - we never send it anywhere!</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-6 text-left transform hover:scale-105 transition-transform duration-300">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-lg shadow-lg flex-shrink-0">
                      <span>2</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-2">🎯 Sort one transaction at a time</h4>
                      <p className="text-gray-600 text-lg leading-relaxed">No rush - we'll go through each one together at your own pace</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-6 text-left transform hover:scale-105 transition-transform duration-300">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-lg shadow-lg flex-shrink-0">
                      <span>3</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-2">📊 See your organized finances</h4>
                      <p className="text-gray-600 text-lg leading-relaxed">Everything neatly sorted into your custom buckets - you'll love how clear it all becomes!</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 shadow-lg">
                  <p className="text-lg text-green-700 font-bold">💚 Remember: You can always undo anything if you change your mind!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {(processingState.status === 'processing' || processingState.status === 'checking-duplicates') && (
          <div className="max-w-2xl mx-auto">
            <div className="card-warm text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[--color-secondary-400] to-[--color-secondary-500] rounded-full flex items-center justify-center">
                <Loader size={40} className="text-white animate-spin" />
              </div>
              <h2 className="heading-section mb-4">Perfect! We're reading your file</h2>
              <p className="text-xl text-gray-600 leading-relaxed">{processingState.message}</p>
              <div className="mt-8">
                <div className="progress-bar">
                  <div className="progress-fill w-2/3"></div>
                </div>
                <p className="text-lg text-gray-500 mt-3">This will just take a moment...</p>
              </div>
            </div>
          </div>
        )}

        {processingState.status === 'success' && (
          <div className="max-w-2xl mx-auto">
            <div className="card-warm text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                <CheckCircle size={40} className="text-white" />
              </div>
              <h2 className="heading-section mb-4">Wonderful! Your file is ready</h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">{processingState.message}</p>
              
              {/* Show detailed breakdown if there are existing transactions */}
              {processingState.existingCount! > 0 && processingState.newCount! > 0 && (
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-8 text-left">
                  <h3 className="font-bold text-green-800 mb-3 text-lg">Transaction Breakdown:</h3>
                  <div className="space-y-2 text-green-700">
                    <div className="flex justify-between">
                      <span>✅ Already categorized:</span>
                      <span className="font-bold">{processingState.existingCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🆕 New transactions to sort:</span>
                      <span className="font-bold">{processingState.newCount}</span>
                    </div>
                    <div className="border-t border-green-300 pt-2 mt-2 flex justify-between font-bold">
                      <span>Total in file:</span>
                      <span>{processingState.totalCount}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {processingState.newCount! > 0 ? (
                  <button
                    onClick={handleContinueToCategories}
                    className="btn-primary text-xl px-12 py-5 w-full sm:w-auto"
                  >
                    Sort {processingState.newCount} New Transaction{processingState.newCount !== 1 ? 's' : ''} →
                  </button>
                ) : (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
                    <p className="text-lg text-amber-800 font-medium">
                      All transactions in this file have already been categorized! 🎉
                    </p>
                  </div>
                )}
                <div>
                  <button
                    onClick={resetUpload}
                    className="btn-secondary text-lg px-8 py-3"
                  >
                    Upload Different File
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {processingState.status === 'error' && (
          <div className="max-w-2xl mx-auto">
            <div className="card-warm text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                <AlertCircle size={40} className="text-white" />
              </div>
              <h2 className="heading-section mb-4">No worries! Let's try that again</h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {processingState.message === 'Please upload a CSV file. This looks like a different type of file.'
                  ? "This doesn't look like the right type of file. Please choose a file that ends in .CSV or .XLSX."
                  : processingState.message || "We had a little trouble reading this file. Could you please double-check that it's your standard bank statement and try again?"}
              </p>

              {processingState.errors && processingState.errors.length > 0 && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 mb-8 text-left">
                  <h3 className="font-semibold text-orange-800 mb-3 text-lg">What we noticed:</h3>
                  <ul className="space-y-2 text-orange-700">
                    {processingState.errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={resetUpload}
                className="btn-primary text-xl px-12 py-5"
              >
                Let's Try Again
              </button>
              
              <p className="text-lg text-gray-500 mt-6">
                Don't worry - this happens sometimes. We're here to help!
              </p>
            </div>
          </div>
        )}

        {processingState.status === 'manual-mapping' && (
          <div className="card">
            <div className="text-center mb-6">
              <AlertCircle size={64} className="mx-auto text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Manual Column Mapping Needed</h2>
              <p className="text-xl text-gray-600">{processingState.message}</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-800 mb-2">Columns found in your file:</h3>
              <div className="flex flex-wrap gap-2">
                {processingState.headers?.map((header, index) => (
                  <span
                    key={index}
                    className="bg-white px-3 py-1 rounded border text-sm"
                  >
                    {header}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Manual column mapping will be available in the next version. 
                For now, please make sure your CSV or Excel file has columns named "Date", "Description", and "Amount".
              </p>
              <button
                onClick={resetUpload}
                className="btn-primary"
              >
                Upload Different File
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}