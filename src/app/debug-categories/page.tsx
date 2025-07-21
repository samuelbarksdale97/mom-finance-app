'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export default function DebugCategories() {
  const { user } = useAuth();
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const addOutput = (message: string) => {
    setOutput(prev => prev + '\n' + message);
    console.log(message);
  };

  const testFirestoreConnection = async () => {
    if (!user) {
      addOutput('❌ No user authenticated');
      return;
    }

    setLoading(true);
    addOutput('=== Testing Firestore Connection ===');
    addOutput(`User ID: ${user.uid}`);
    addOutput(`Email: ${user.email}`);

    try {
      // Test basic write
      const testDocRef = doc(db, 'users', user.uid, 'test', 'connection');
      await setDoc(testDocRef, {
        message: 'test connection',
        timestamp: serverTimestamp(),
      });
      addOutput('✅ Basic Firestore write successful');

      // Test categories collection
      const categoriesRef = collection(db, 'users', user.uid, 'categories');
      const snapshot = await getDocs(categoriesRef);
      addOutput(`📂 Categories collection exists: ${snapshot.size} documents`);
      
      snapshot.forEach(doc => {
        addOutput(`  - Category: ${doc.id} = ${JSON.stringify(doc.data())}`);
      });

    } catch (error: any) {
      addOutput('❌ Firestore Error:');
      addOutput(`Code: ${error.code}`);
      addOutput(`Message: ${error.message}`);
    }

    setLoading(false);
  };

  const createDefaultCategories = async () => {
    if (!user) {
      addOutput('❌ No user authenticated');
      return;
    }

    setLoading(true);
    addOutput('\n=== Creating Default Categories ===');

    const defaultCategories = [
      { name: 'Personal', color: '#3b82f6', isDefault: true },
      { name: 'Mom & Dad', color: '#10b981', isDefault: true },
      { name: 'Family', color: '#f59e0b', isDefault: true },
    ];

    try {
      for (const category of defaultCategories) {
        const categoryRef = doc(collection(db, 'users', user.uid, 'categories'));
        const categoryData = {
          ...category,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        await setDoc(categoryRef, categoryData);
        addOutput(`✅ Created category: ${category.name} (ID: ${categoryRef.id})`);
      }

      addOutput('✅ All default categories created');

      // Verify they were created
      setTimeout(async () => {
        const categoriesRef = collection(db, 'users', user.uid, 'categories');
        const snapshot = await getDocs(categoriesRef);
        addOutput(`📂 Verification: ${snapshot.size} categories now exist`);
      }, 1000);

    } catch (error: any) {
      addOutput('❌ Error creating categories:');
      addOutput(`Code: ${error.code}`);
      addOutput(`Message: ${error.message}`);
    }

    setLoading(false);
  };

  const clearCategories = async () => {
    if (!user) {
      addOutput('❌ No user authenticated');
      return;
    }

    setLoading(true);
    addOutput('\n=== Clearing Categories ===');

    try {
      const categoriesRef = collection(db, 'users', user.uid, 'categories');
      const snapshot = await getDocs(categoriesRef);
      
      for (const docSnapshot of snapshot.docs) {
        await deleteDoc(docSnapshot.ref);
        addOutput(`🗑️ Deleted category: ${docSnapshot.id}`);
      }

      addOutput('✅ All categories cleared');

    } catch (error: any) {
      addOutput('❌ Error clearing categories:');
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
        <h1 className="text-3xl font-bold mb-6">Categories Debug</h1>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={testFirestoreConnection}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Testing...' : 'Test Firestore & Check Categories'}
          </button>
          
          <button
            onClick={createDefaultCategories}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Creating...' : 'Create Default Categories'}
          </button>

          <button
            onClick={clearCategories}
            disabled={loading}
            className="btn-secondary"
          >
            {loading ? 'Clearing...' : 'Clear All Categories'}
          </button>
        </div>

        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
          <pre>{output || 'Click a button above to start debugging...'}</pre>
        </div>
      </div>
    </div>
  );
}