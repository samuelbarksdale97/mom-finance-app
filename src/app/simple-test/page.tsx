'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function SimpleTest() {
  const { user } = useAuth();
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const addOutput = (message: string) => {
    setOutput(prev => prev + '\n' + message);
    console.log(message);
  };

  const testSimpleWrite = async () => {
    if (!user) {
      addOutput('❌ No user authenticated');
      return;
    }

    setLoading(true);
    addOutput('=== Testing Simple Write ===');

    try {
      // Simple test document
      const testDocRef = doc(db, 'users', user.uid);
      await setDoc(testDocRef, {
        email: user.email,
        testTimestamp: serverTimestamp(),
        message: 'Simple test successful'
      });
      
      addOutput('✅ Simple document write successful');

      // Read it back
      const docSnap = await getDoc(testDocRef);
      if (docSnap.exists()) {
        addOutput('✅ Document read successful');
        addOutput(`Data: ${JSON.stringify(docSnap.data(), null, 2)}`);
      } else {
        addOutput('❌ Document not found after write');
      }

    } catch (error: any) {
      addOutput('❌ Error:');
      addOutput(`Code: ${error.code}`);
      addOutput(`Message: ${error.message}`);
      addOutput(`Full error: ${JSON.stringify(error, null, 2)}`);
    }

    setLoading(false);
  };

  const testCategoryWrite = async () => {
    if (!user) {
      addOutput('❌ No user authenticated');
      return;
    }

    setLoading(true);
    addOutput('\n=== Testing Category Write ===');

    try {
      // Test category document
      const categoryDocRef = doc(db, 'users', user.uid, 'categories', 'test-category');
      await setDoc(categoryDocRef, {
        name: 'Test Category',
        color: '#3b82f6',
        isDefault: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      addOutput('✅ Category document write successful');

      // Read it back
      const docSnap = await getDoc(categoryDocRef);
      if (docSnap.exists()) {
        addOutput('✅ Category document read successful');
        addOutput(`Data: ${JSON.stringify(docSnap.data(), null, 2)}`);
      } else {
        addOutput('❌ Category document not found after write');
      }

    } catch (error: any) {
      addOutput('❌ Category write error:');
      addOutput(`Code: ${error.code}`);
      addOutput(`Message: ${error.message}`);
    }

    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Please sign in first</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Simple Firestore Test</h1>
        
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p><strong>User:</strong> {user.email}</p>
          <p><strong>UID:</strong> {user.uid}</p>
        </div>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={testSimpleWrite}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Testing...' : 'Test Simple Write'}
          </button>
          
          <button
            onClick={testCategoryWrite}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Testing...' : 'Test Category Write'}
          </button>
        </div>

        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
          <pre>{output || 'Click a button above to start testing...'}</pre>
        </div>
      </div>
    </div>
  );
}