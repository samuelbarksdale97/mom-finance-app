'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function TestFirebase() {
  const { user, signIn, signUp, logout } = useAuth();
  const [testResults, setTestResults] = useState({
    auth: { status: 'pending', message: '' },
    firestore: { status: 'pending', message: '' },
  });
  const [email] = useState('test@example.com');
  const [password] = useState('testpassword123');

  const testAuth = async () => {
    try {
      setTestResults(prev => ({
        ...prev,
        auth: { status: 'testing', message: 'Testing authentication...' }
      }));

      // Try to sign up first (in case user doesn't exist)
      try {
        await signUp(email, password);
        setTestResults(prev => ({
          ...prev,
          auth: { status: 'success', message: 'Successfully created and authenticated user!' }
        }));
      } catch (signUpError: any) {
        // If user already exists, try to sign in
        if (signUpError.code === 'auth/email-already-in-use') {
          await signIn(email, password);
          setTestResults(prev => ({
            ...prev,
            auth: { status: 'success', message: 'Successfully authenticated existing user!' }
          }));
        } else {
          throw signUpError;
        }
      }
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        auth: { status: 'error', message: `Auth error: ${error.message}` }
      }));
    }
  };

  const testFirestore = async () => {
    if (!user) {
      setTestResults(prev => ({
        ...prev,
        firestore: { status: 'error', message: 'No authenticated user' }
      }));
      return;
    }

    try {
      setTestResults(prev => ({
        ...prev,
        firestore: { status: 'testing', message: 'Testing Firestore...' }
      }));

      // Test write
      const testDoc = {
        test: true,
        timestamp: new Date(),
        message: 'Firebase test successful!'
      };
      
      await setDoc(doc(db, 'users', user.uid, 'test', 'testDoc'), testDoc);

      // Test read
      const docSnap = await getDoc(doc(db, 'users', user.uid, 'test', 'testDoc'));
      
      if (docSnap.exists()) {
        setTestResults(prev => ({
          ...prev,
          firestore: { status: 'success', message: 'Firestore read/write successful!' }
        }));
      } else {
        throw new Error('Could not read test document');
      }
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        firestore: { status: 'error', message: `Firestore error: ${error.message}` }
      }));
    }
  };

  useEffect(() => {
    if (user && testResults.firestore.status === 'pending') {
      testFirestore();
    }
  }, [user]);

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'error':
        return <XCircle className="text-red-500" size={24} />;
      case 'testing':
        return <Loader className="text-blue-500 animate-spin" size={24} />;
      default:
        return <div className="w-6 h-6 rounded-full bg-gray-300" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8">Firebase Connection Test</h1>
        
        <div className="card space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h2 className="text-xl font-semibold">Authentication</h2>
              <p className="text-gray-600">{testResults.auth.message || 'Not tested yet'}</p>
            </div>
            <StatusIcon status={testResults.auth.status} />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h2 className="text-xl font-semibold">Firestore Database</h2>
              <p className="text-gray-600">{testResults.firestore.message || 'Not tested yet'}</p>
            </div>
            <StatusIcon status={testResults.firestore.status} />
          </div>

          {user && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">
                Logged in as: <strong>{user.email}</strong>
              </p>
              <p className="text-blue-800">
                User ID: <code className="text-sm">{user.uid}</code>
              </p>
            </div>
          )}

          <div className="flex gap-4">
            {!user ? (
              <button
                onClick={testAuth}
                className="btn-primary flex-1"
                disabled={testResults.auth.status === 'testing'}
              >
                Test Authentication
              </button>
            ) : (
              <>
                <button
                  onClick={testFirestore}
                  className="btn-primary flex-1"
                  disabled={testResults.firestore.status === 'testing'}
                >
                  Re-test Firestore
                </button>
                <button
                  onClick={() => {
                    logout();
                    setTestResults({
                      auth: { status: 'pending', message: '' },
                      firestore: { status: 'pending', message: '' },
                    });
                  }}
                  className="btn-secondary flex-1"
                >
                  Logout & Reset
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            This page tests your Firebase configuration. Once both tests pass, your app is ready!
          </p>
        </div>
      </div>
    </div>
  );
}