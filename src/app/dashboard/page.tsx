'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Upload, 
  LogOut, 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Edit3, 
  Trash2,
  Settings,
  RefreshCw,
  Bug
} from 'lucide-react';
import { Transaction } from '@/types';

interface BucketAccordionProps {
  category: any;
  transactions: Transaction[];
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

const BucketAccordion: React.FC<BucketAccordionProps> = ({ category, transactions, onRename, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);

  // Calculate totals and stats
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const transactionCount = transactions.length;
  const recentTransactions = transactions.slice(0, 5); // Show 5 most recent

  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '+';
    return `${sign}$${absAmount.toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== category.name) {
      onRename(category.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(category.name);
    setIsEditing(false);
  };

  return (
    <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-green-50/80 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-amber-200 p-6 mb-6 relative overflow-hidden transform hover:scale-[1.01] transition-all duration-300 group">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-green-200 rounded-full opacity-30 blur-2xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-200 rounded-full opacity-30 blur-2xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-3 bg-white/60 hover:bg-white/80 rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-105"
            >
              {isExpanded ? (
                <ChevronDown size={24} className="text-gray-700" />
              ) : (
                <ChevronRight size={24} className="text-gray-700" />
              )}
            </button>
            
            <div
              className="w-8 h-8 rounded-full shadow-lg transform group-hover:scale-110 transition-transform duration-300"
              style={{ backgroundColor: category.color || '#10b981' }}
            />
            
            {isEditing ? (
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 rounded-2xl border-2 border-amber-200 bg-white/80 backdrop-blur-sm text-xl font-medium focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all duration-300 flex-1 shadow-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveEdit}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl hover:from-green-600 hover:to-green-700 hover:shadow-2xl hover:scale-105 transform transition-all duration-300"
                >
                  ✨ Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="bg-white/80 backdrop-blur-sm text-gray-700 px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-white hover:shadow-xl hover:scale-105 transform transition-all duration-300 border-2 border-amber-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-1">{category.name}</h3>
                {transactionCount > 0 ? (
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-green-700">{formatCurrency(totalAmount)}</p>
                    <p className="text-sm text-gray-600 font-medium">
                      {transactionCount} transaction{transactionCount !== 1 ? 's' : ''} 📊
                    </p>
                  </div>
                ) : (
                  <p className="text-lg text-gray-600 font-medium">Ready for your transactions! 🌟</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-3 bg-white/60 hover:bg-white/80 rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-105"
                  title="Rename this bucket"
                >
                  <Edit3 size={20} className="text-gray-700" />
                </button>
                {!category.isDefault && (
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
                        onDelete(category.id);
                      }
                    }}
                    className="p-3 bg-red-50 hover:bg-red-100 rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-105"
                    title="Delete this bucket"
                  >
                    <Trash2 size={20} className="text-red-600" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="border-t-2 border-amber-200/60 mt-6 pt-6">
            {transactionCount > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xl font-bold text-gray-700">Recent Transactions</h4>
                  {transactionCount > 5 && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      Showing {Math.min(5, transactionCount)} of {transactionCount}
                    </span>
                  )}
                </div>
                
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 text-lg leading-tight">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(transaction.date)}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className={`font-bold text-lg ${
                            transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {totalAmount !== 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-200 shadow-md mt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-800">Total for this bucket:</span>
                      <span className={`text-xl font-bold ${
                        totalAmount < 0 ? 'text-red-700' : 'text-green-700'
                      }`}>
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg">
                <div className="text-6xl mb-4">🌱</div>
                <h4 className="text-2xl font-bold text-gray-700 mb-2">Ready to grow!</h4>
                <p className="text-lg text-gray-600 leading-relaxed font-medium">
                  This bucket is waiting for your transactions. Upload your bank statement to start organizing your finances!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user, loading, initializing, logout } = useAuth();
  const { categories, isLoading, error, createCategory, updateCategory, deleteCategory } = useCategories();
  const { transactionsByCategory, recentTransactions, isLoading: transactionsLoading, refetch } = useTransactions();
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingTestData, setIsCreatingTestData] = useState(false);

  useEffect(() => {
    // Only redirect if we're sure there's no user (not during initialization)
    if (!loading && !initializing && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, initializing, router]);

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      createCategory({
        name: newCategoryName.trim(),
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random color
        isDefault: false,
      });
      setNewCategoryName('');
      setShowCreateForm(false);
    }
  };

  const handleRenameCategory = (id: string, name: string) => {
    updateCategory({ categoryId: id, updates: { name } });
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
  };

  const handleManualRefresh = async (forceRefresh: boolean = false) => {
    console.log('🔄 Manual refresh triggered with forceRefresh:', forceRefresh);
    setIsRefreshing(true);
    
    const refreshType = forceRefresh ? 'server-side' : 'normal';
    console.log(`🚀 Starting ${refreshType} refresh...`);
    
    try {
      await refetch(forceRefresh);
      
      setDebugInfo({
        timestamp: new Date().toISOString(),
        refreshType,
        userId: user?.uid,
        categoriesCount: categories.length,
        transactionsByCategory,
        recentTransactions,
      });
      
      console.log(`✅ ${refreshType} refresh completed successfully`);
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDebugFirestore = async () => {
    if (!user) return;
    
    const { debugFirestoreTransactions } = await import('@/lib/firestore');
    await debugFirestoreTransactions(user.uid);
    
    setDebugInfo({
      timestamp: new Date().toISOString(),
      userId: user.uid,
      categoriesCount: categories.length,
      transactionsByCategory,
      recentTransactions,
    });
  };

  const handleCreateTestData = async () => {
    if (!user) return;
    
    setIsCreatingTestData(true);
    try {
      const { createMockTestData } = await import('@/lib/firestore');
      await createMockTestData(user.uid);
      
      // Refresh data after creating test data
      await handleManualRefresh(true);
      
      console.log('🎉 Test data created and refreshed successfully!');
    } catch (error) {
      console.error('❌ Failed to create test data:', error);
    } finally {
      setIsCreatingTestData(false);
    }
  };

  const handleClearTestData = async () => {
    if (!user) return;
    
    try {
      const { clearMockTestData } = await import('@/lib/firestore');
      await clearMockTestData(user.uid);
      
      // Refresh data after clearing test data
      await handleManualRefresh(true);
      
      console.log('🧹 Test data cleared and refreshed successfully!');
    } catch (error) {
      console.error('❌ Failed to clear test data:', error);
    }
  };

  const handleSimpleFirestoreTest = async () => {
    if (!user) return;
    
    try {
      const { simpleFirestoreTest } = await import('@/lib/firestore');
      console.log('🧪 Starting simple Firestore read/write test...');
      await simpleFirestoreTest(user.uid);
      console.log('✅ Simple Firestore test completed successfully!');
    } catch (error) {
      console.error('❌ Simple Firestore test failed:', error);
    }
  };

  const handleQueryAllData = async () => {
    if (!user) return;
    
    try {
      const { queryAllFirestoreData } = await import('@/lib/firestore');
      console.log('🔍 Starting comprehensive Firestore data query...');
      await queryAllFirestoreData(user.uid);
      console.log('✅ Data query completed!');
    } catch (error) {
      console.error('❌ Data query failed:', error);
    }
  };

  const handleTestCreateTransaction = async () => {
    if (!user) return;
    
    try {
      const { testCreateTransaction } = await import('@/lib/firestore');
      console.log('🧪 Testing createTransaction function directly...');
      await testCreateTransaction(user.uid);
      console.log('✅ createTransaction test completed!');
    } catch (error) {
      console.error('❌ createTransaction test failed:', error);
    }
  };

  // Show loading while authenticating
  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-green-50">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
            <span className="text-white text-2xl">💰</span>
          </div>
          <h1 className="heading-welcome text-3xl mb-4">Loading your dashboard...</h1>
          <p className="text-xl text-gray-600">Getting your buckets ready!</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (isLoading || transactionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-green-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          {/* Animated logo */}
          <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-xl relative">
            <span className="text-white text-3xl animate-pulse">🪣</span>
            
            {/* Spinning ring */}
            <div className="absolute inset-0 border-4 border-transparent border-t-green-300 rounded-full animate-spin"></div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 bg-clip-text text-transparent mb-4 drop-shadow-sm">Loading Your Buckets</h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed font-medium">Setting up your financial dashboard...</p>

          {/* Reassuring dots */}
          <div className="flex justify-center gap-2 mb-8">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-0"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-100"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-200"></div>
          </div>
          
          {error && (
            <div className="bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 border-2 border-red-200 rounded-3xl p-6 shadow-xl">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-red-800 text-lg font-medium mb-4">Oops! Something went wrong: {error.message}</p>
              <button
                onClick={() => window.location.href = '/debug-categories'}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl hover:from-red-600 hover:to-red-700 hover:shadow-2xl hover:scale-105 transform transition-all duration-300"
              >
                🔧 Debug Categories
              </button>
            </div>
          )}
        </div>
      </div>
    );
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
        
        <div className="max-w-5xl mx-auto px-6 py-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 bg-clip-text text-transparent mb-2 drop-shadow-sm flex items-center gap-3">
                💰 Your Finance Dashboard
              </h1>
              <p className="text-xl text-gray-700 leading-relaxed font-medium">Welcome back! You're doing great with your money! ✨</p>
              <p className="text-lg text-gray-600 font-medium">{user.email}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => router.push('/upload')}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:from-green-600 hover:to-green-700 hover:shadow-2xl hover:scale-105 hover:-translate-y-1 transform transition-all duration-300 flex items-center justify-center gap-3"
              >
                <Upload size={24} />
                <span className="hidden sm:inline">📄 Upload Statement</span>
                <span className="sm:hidden">📄 Upload</span>
              </button>
              <button
                onClick={() => handleManualRefresh(true)}
                disabled={isRefreshing}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transform transition-all duration-300 flex items-center justify-center gap-3 disabled:cursor-not-allowed disabled:scale-100"
              >
                <RefreshCw size={24} className={isRefreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">
                  {isRefreshing ? '🔄 Fetching Fresh Data...' : '🔄 Force Refresh'}
                </span>
                <span className="sm:hidden">
                  {isRefreshing ? '⏳' : '🔄'}
                </span>
              </button>
              <button
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transform transition-all duration-300 flex items-center justify-center gap-3"
              >
                <Bug size={24} />
                <span className="hidden sm:inline">🐛 Debug</span>
                <span className="sm:hidden">🐛</span>
              </button>
              <button
                onClick={() => logout()}
                className="bg-white/80 backdrop-blur-sm text-gray-700 px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-white hover:shadow-xl hover:scale-105 transform transition-all duration-300 border-2 border-amber-200 flex items-center justify-center gap-3"
              >
                <LogOut size={24} />
                <span className="hidden sm:inline">👋 Sign Out</span>
                <span className="sm:hidden">👋 Exit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="bg-gray-800 text-white p-6 border-b border-gray-700">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-green-400">🐛 Debug Panel</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleDebugFirestore}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-bold transition-all duration-300 text-sm"
                >
                  🔍 Debug Firestore
                </button>
                <button
                  onClick={() => handleManualRefresh(false)}
                  disabled={isRefreshing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 rounded-lg font-bold transition-all duration-300 text-sm"
                >
                  🔄 Normal Refresh
                </button>
                <button
                  onClick={() => handleManualRefresh(true)}
                  disabled={isRefreshing}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-2 rounded-lg font-bold transition-all duration-300 text-sm"
                >
                  💪 Force Server Refresh
                </button>
                <button
                  onClick={handleCreateTestData}
                  disabled={isCreatingTestData || isRefreshing}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white px-3 py-2 rounded-lg font-bold transition-all duration-300 text-sm"
                >
                  🧪 Create Test Data
                </button>
                <button
                  onClick={handleClearTestData}
                  disabled={isRefreshing}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-3 py-2 rounded-lg font-bold transition-all duration-300 text-sm"
                >
                  🗑️ Clear Test Data
                </button>
                <button
                  onClick={handleSimpleFirestoreTest}
                  disabled={isRefreshing}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-3 py-2 rounded-lg font-bold transition-all duration-300 text-sm"
                >
                  🧪 Simple Read/Write Test
                </button>
                <button
                  onClick={handleQueryAllData}
                  disabled={isRefreshing}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-2 rounded-lg font-bold transition-all duration-300 text-sm"
                >
                  🔍 Query All Data
                </button>
                <button
                  onClick={handleTestCreateTransaction}
                  disabled={isRefreshing}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-2 rounded-lg font-bold transition-all duration-300 text-sm"
                >
                  🧪 Test Create Function
                </button>
                <button
                  onClick={() => setShowDebugPanel(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-bold transition-all duration-300 text-sm"
                >
                  ✕ Close
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900 p-4 rounded-lg">
                <h4 className="text-lg font-bold text-blue-400 mb-2">Current State</h4>
                <div className="text-sm font-mono space-y-1">
                  <div><span className="text-gray-400">User ID:</span> {user?.uid || 'null'}</div>
                  <div><span className="text-gray-400">Categories:</span> {categories.length}</div>
                  <div><span className="text-gray-400">Transactions by Category Keys:</span> {Object.keys(transactionsByCategory).length}</div>
                  <div><span className="text-gray-400">Recent Transactions:</span> {recentTransactions.length}</div>
                  <div><span className="text-gray-400">Loading:</span> {transactionsLoading ? 'true' : 'false'}</div>
                  <div><span className="text-gray-400">Refreshing:</span> {isRefreshing ? 'true' : 'false'}</div>
                  <div><span className="text-gray-400">Creating Test Data:</span> {isCreatingTestData ? 'true' : 'false'}</div>
                  {debugInfo?.refreshType && (
                    <div><span className="text-gray-400">Last Refresh Type:</span> <span className="text-green-400">{debugInfo.refreshType}</span></div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-900 p-4 rounded-lg">
                <h4 className="text-lg font-bold text-green-400 mb-2">Transaction Breakdown</h4>
                <div className="text-sm font-mono space-y-1">
                  {Object.entries(transactionsByCategory).map(([categoryId, transactions]) => (
                    <div key={categoryId}>
                      <span className="text-gray-400">Category {categoryId}:</span> {transactions.length} transactions
                    </div>
                  ))}
                  {Object.keys(transactionsByCategory).length === 0 && (
                    <div className="text-red-400">No transactions found in any category</div>
                  )}
                </div>
              </div>
              
              {debugInfo && (
                <div className="bg-gray-900 p-4 rounded-lg lg:col-span-2">
                  <h4 className="text-lg font-bold text-yellow-400 mb-2">Debug Info (Last updated: {debugInfo.timestamp})</h4>
                  <pre className="text-xs text-gray-300 overflow-auto max-h-60">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="bg-gray-900 p-4 rounded-lg lg:col-span-2">
                <h4 className="text-lg font-bold text-purple-400 mb-2">Instructions</h4>
                <div className="text-sm text-gray-300 space-y-2">
                  <div>📝 <strong>Check console logs</strong> for detailed transaction fetching information</div>
                  <div>🔍 <strong>Debug Firestore</strong> button runs manual queries to test database structure</div>
                  <div>🔄 <strong>Normal Refresh</strong> refetches data (may use Firestore cache)</div>
                  <div>💪 <strong>Force Server Refresh</strong> bypasses cache and gets fresh data from Firestore servers</div>
                  <div>🧪 <strong>Create Test Data</strong> adds mock transactions to test if UI can display transactions</div>
                  <div>🗑️ <strong>Clear Test Data</strong> removes all test transactions (look for 🧪 TEST: prefix)</div>
                  <div>🧪 <strong>Simple Read/Write Test</strong> tests basic Firestore operations with simple paths</div>
                  <div>🔍 <strong>Query All Data</strong> searches ALL transaction paths to see what's actually stored</div>
                  <div>🧪 <strong>Test Create Function</strong> tests createTransaction directly to find the save failure</div>
                  <div>📊 <strong>Watch the numbers</strong> above to see if categories/transactions are being found</div>
                  <div>⚡ <strong>Since only test data exists, try Test Create Function to debug the save issue</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
          <div className="text-center sm:text-left">
            <h2 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center sm:justify-start gap-3">
              🪣 Your Money Buckets
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed font-medium max-w-2xl">
              Each bucket represents a different part of your financial life. Organize your expenses the way that makes sense to you!
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:from-amber-600 hover:to-orange-600 hover:shadow-2xl hover:scale-105 transform transition-all duration-300 flex items-center gap-3 mx-auto sm:mx-0"
          >
            <Plus size={24} />
            ✨ Add New Bucket
          </button>
        </div>

        {/* Create Category Form with warm styling */}
        {showCreateForm && (
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-green-50 border-2 border-amber-200 rounded-3xl p-8 mb-12 shadow-2xl relative overflow-hidden transform animate-in zoom-in-90 duration-300">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-200 rounded-full opacity-40 blur-2xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-200 rounded-full opacity-40 blur-2xl animate-pulse delay-1000"></div>
            
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-gray-800 mb-2 text-center flex items-center justify-center gap-2">
                <span className="text-2xl">🪣</span>
                Create Your New Bucket
              </h3>
              <p className="text-lg text-gray-600 mb-8 text-center leading-relaxed">
                What would you like to call this bucket? Choose a name that feels right to you! ✨
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Groceries, Fun Money, Savings..."
                  className="w-full p-4 rounded-2xl border-2 border-amber-200 bg-white/80 backdrop-blur-sm text-xl font-medium focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all duration-300 flex-1 shadow-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateCategory();
                    if (e.key === 'Escape') {
                      setShowCreateForm(false);
                      setNewCategoryName('');
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-4 w-full sm:w-auto">
                  <button
                    onClick={handleCreateCategory}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-xl hover:from-green-600 hover:to-green-700 hover:shadow-2xl hover:scale-105 transform transition-all duration-300 flex-1 sm:flex-none"
                    disabled={!newCategoryName.trim()}
                  >
                    ✨ Create Bucket
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewCategoryName('');
                    }}
                    className="bg-white/80 backdrop-blur-sm text-gray-700 px-8 py-4 rounded-2xl font-bold text-xl shadow-lg hover:bg-white hover:shadow-xl hover:scale-105 transform transition-all duration-300 border-2 border-amber-200 flex-1 sm:flex-none"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories List */}
        <div className="space-y-6">
          {categories.length === 0 ? (
            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-green-50 border-2 border-amber-200 rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full opacity-40 blur-2xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-200 rounded-full opacity-40 blur-2xl animate-pulse delay-1000"></div>
              
              <div className="relative z-10">
                <div className="text-6xl mb-6 animate-bounce">
                  🏗️
                </div>
                <h3 className="text-3xl font-bold text-gray-800 mb-4">Setting up your buckets...</h3>
                <p className="text-xl text-gray-600 leading-relaxed font-medium">We're creating your default buckets to get you started! This will just take a moment. ✨</p>
                
                {/* Progress dots */}
                <div className="flex justify-center gap-2 mt-8">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-0"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-100"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-200"></div>
                </div>
              </div>
            </div>
          ) : (
            categories.map((category) => (
              <BucketAccordion
                key={category.id}
                category={category}
                transactions={transactionsByCategory[category.id] || []}
                onRename={handleRenameCategory}
                onDelete={handleDeleteCategory}
              />
            ))
          )}
        </div>

        {/* Getting Started Card */}
        {categories.length > 0 && (
          <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-2 border-green-300 rounded-3xl p-12 mt-12 text-center shadow-2xl relative overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
            {/* Celebration background */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-200/30 to-emerald-200/30 animate-pulse"></div>
            
            <div className="relative z-10">
              <div className="text-6xl mb-6">
                🚀
              </div>
              <h3 className="text-4xl font-bold text-green-800 mb-4">Perfect! You're all set up!</h3>
              <p className="text-2xl text-green-700 leading-relaxed font-medium mb-8 max-w-3xl mx-auto">
                Your buckets are ready and waiting! Now it's time to upload your bank statement so we can start organizing your money together.
              </p>
              <button
                onClick={() => router.push('/upload')}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-12 py-6 rounded-3xl font-bold text-2xl shadow-2xl hover:from-green-600 hover:to-green-700 hover:shadow-3xl hover:scale-110 hover:-translate-y-2 transform transition-all duration-300 flex items-center gap-4 mx-auto"
              >
                <Upload size={32} />
                📄 Upload Your First Statement
              </button>
              <p className="text-lg text-green-600 mt-6 font-bold">
                This is going to be great! 🌟
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}