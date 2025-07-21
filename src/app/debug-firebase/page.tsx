'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function DebugFirebase() {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const addOutput = (message: string) => {
    setOutput(prev => prev + '\n' + message);
  };

  const testFirebaseConfig = () => {
    addOutput('=== Firebase Configuration Debug ===');
    addOutput(`API Key: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing'}`);
    addOutput(`Auth Domain: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`);
    addOutput(`Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
    addOutput(`App ID: ${process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'Set' : 'Missing'}`);
    addOutput('');
    addOutput('Firebase Auth object:');
    addOutput(JSON.stringify({
      app: auth.app.name,
      config: auth.config,
    }, null, 2));
  };

  const testAuth = async () => {
    setLoading(true);
    addOutput('\n=== Testing Authentication ===');
    
    try {
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'password123';
      
      addOutput(`Attempting to create user: ${testEmail}`);
      
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      addOutput('✅ SUCCESS: User created successfully');
      addOutput(`User ID: ${userCredential.user.uid}`);
      addOutput(`Email: ${userCredential.user.email}`);
      
    } catch (error: any) {
      addOutput('❌ ERROR:');
      addOutput(`Code: ${error.code}`);
      addOutput(`Message: ${error.message}`);
      addOutput(`Full error: ${JSON.stringify(error, null, 2)}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Firebase Debug</h1>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={testFirebaseConfig}
            className="btn-primary"
          >
            Check Firebase Config
          </button>
          
          <button
            onClick={testAuth}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Testing...' : 'Test Authentication'}
          </button>
        </div>

        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
          <pre>{output || 'Click a button above to start debugging...'}</pre>
        </div>
      </div>
    </div>
  );
}