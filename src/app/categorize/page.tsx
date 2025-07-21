'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { createTransaction } from '@/lib/firestore';
import { ArrowLeft, Check, Plus, Sparkles } from 'lucide-react';
import { Transaction } from '@/types';
import toast from 'react-hot-toast';

interface TransactionCardProps {
  transaction: Omit<Transaction, 'id' | 'categoryId' | 'createdAt' | 'updatedAt'>;
  currentIndex: number;
  total: number;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, currentIndex, total }) => {
  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '+';
    return `${sign}$${absAmount.toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpense = transaction.amount < 0;
  const progressPercentage = ((currentIndex + 1) / total) * 100;

  return (
    <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-green-50/80 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-amber-200 p-8 max-w-2xl mx-auto relative overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full opacity-40 blur-2xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-200 rounded-full opacity-40 blur-2xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10">
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-gray-700 mb-4 flex items-center justify-center gap-2">
            <span className="text-green-600">📋</span>
            Transaction {currentIndex + 1} of {total}
          </p>
          
          {/* Beautiful progress bar */}
          <div className="w-full bg-amber-200 rounded-full h-6 overflow-hidden shadow-inner max-w-md mx-auto mb-2">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-1000 ease-out shadow-sm flex items-center justify-end pr-2"
              style={{ width: `${progressPercentage}%` }}
            >
              <span className="text-white text-xs font-bold">{Math.round(progressPercentage)}%</span>
            </div>
          </div>
          
          <p className="text-lg text-gray-600 font-medium">
            You're doing great! {total - currentIndex - 1} more to go 🌟
          </p>
        </div>

        {/* Transaction details with warm styling */}
        <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-amber-100 relative overflow-hidden">
          {/* Background decoration for transaction card */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-amber-50/50"></div>
          
          <div className="relative z-10">
            <div className={`text-5xl font-bold mb-4 ${isExpense ? 'text-orange-600' : 'text-green-600'}`}>
              {formatCurrency(transaction.amount)}
            </div>
            <div className="text-2xl text-gray-800 mb-4 font-semibold leading-relaxed">
              {transaction.description}
            </div>
            <div className="text-xl text-gray-600 mb-2 flex items-center justify-center gap-2">
              <span>📅</span>
              {formatDate(transaction.date)}
            </div>
            {transaction.rawDescription && transaction.rawDescription !== transaction.description && (
              <div className="text-sm text-gray-500 mt-4 p-3 bg-gray-50 rounded-xl border font-mono">
                <span className="font-bold text-gray-600">Original description:</span><br/>
                {transaction.rawDescription}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface CategoryButtonProps {
  category: any;
  onClick: () => void;
  disabled: boolean;
}

const CategoryButton: React.FC<CategoryButtonProps & { shortcutKey?: number }> = ({ 
  category, 
  onClick, 
  disabled, 
  shortcutKey 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full p-6 rounded-2xl border-2 border-amber-200 bg-white/80 backdrop-blur-sm hover:border-green-400 hover:bg-green-50/80 hover:scale-105 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-left focus:border-green-500 focus:bg-green-50/80 focus:scale-105 focus:shadow-xl transform group relative overflow-hidden"
      aria-label={`Categorize as ${category.name}${shortcutKey ? ` (Press ${shortcutKey})` : ''}`}
    >
      {/* Subtle background animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-50/20 to-amber-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div
            className="w-8 h-8 rounded-full shadow-md transform group-hover:scale-110 transition-transform duration-300"
            style={{ backgroundColor: category.color || '#10b981' }}
            aria-hidden="true"
          />
          <span className="text-xl font-bold text-gray-800 group-hover:text-green-700 transition-colors duration-300">{category.name}</span>
        </div>
        {shortcutKey && (
          <span className="text-lg text-gray-600 bg-amber-100 hover:bg-green-100 px-3 py-2 rounded-full font-bold font-mono transition-colors duration-300 shadow-sm">
            {shortcutKey}
          </span>
        )}
      </div>
    </button>
  );
};

interface LiveBucketPreviewProps {
  categories: any[];
  bucketCounts: { [categoryId: string]: { count: number; total: number } };
  categorizedTransactions: { [categoryId: string]: any[] };
  totalTransactions: number;
  completedTransactions: number;
}

const LiveBucketPreview: React.FC<LiveBucketPreviewProps> = ({ 
  categories, 
  bucketCounts, 
  categorizedTransactions, 
  totalTransactions, 
  completedTransactions 
}) => {
  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '+';
    return `${sign}$${absAmount.toFixed(2)}`;
  };

  const progressPercentage = totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/80 to-green-50/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-amber-200 p-6 sticky top-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
          <span className="text-xl">🪣</span>
          Live Bucket Preview
        </h3>
        <div className="bg-amber-100 rounded-2xl p-3 border border-amber-300">
          <div className="text-lg font-bold text-amber-800 mb-1">
            {completedTransactions} of {totalTransactions} sorted
          </div>
          <div className="w-full bg-amber-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-sm text-amber-700 mt-1 font-medium">
            {Math.round(progressPercentage)}% complete
          </div>
        </div>
      </div>

      {/* Buckets */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {categories.map((category) => {
          const categoryData = bucketCounts[category.id] || { count: 0, total: 0 };
          const transactions = categorizedTransactions[category.id] || [];
          
          return (
            <div 
              key={category.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50 transform transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-5 h-5 rounded-full shadow-md"
                  style={{ backgroundColor: category.color || '#10b981' }}
                />
                <h4 className="font-bold text-gray-800 text-lg">{category.name}</h4>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Transactions:</span>
                  <span className="font-bold text-gray-800">{categoryData.count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Total:</span>
                  <span className={`font-bold ${categoryData.total < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {categoryData.count > 0 ? formatCurrency(categoryData.total) : '$0.00'}
                  </span>
                </div>
                
                {/* Recent transactions */}
                {transactions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-2 font-medium">Recent:</div>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {transactions.slice(-3).reverse().map((tx, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-gray-600 truncate flex-1 mr-2">
                            {tx.description.length > 20 ? tx.description.substring(0, 20) + '...' : tx.description}
                          </span>
                          <span className={`font-medium ${tx.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {formatCurrency(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer encouragement */}
      <div className="mt-6 text-center">
        <div className="text-2xl mb-2">✨</div>
        <div className="text-sm text-gray-600 font-medium">
          You're doing great! Keep going!
        </div>
      </div>
    </div>
  );
};

export default function CategorizePage() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Omit<Transaction, 'id' | 'categoryId' | 'createdAt' | 'updatedAt'>[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [bucketCounts, setBucketCounts] = useState<{ [categoryId: string]: { count: number; total: number } }>({});
  const [categorizedTransactions, setCategorizedTransactions] = useState<{ [categoryId: string]: any[] }>({});
  const [pendingSaveTransactions, setPendingSaveTransactions] = useState<Array<{
    transaction: Omit<Transaction, 'id' | 'categoryId' | 'createdAt' | 'updatedAt'>,
    categoryId: string,
    savedId?: string
  }>>([]);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  const handleCategorySelect = useCallback(async (categoryId: string) => {
    if (isProcessing || !user) return;

    // Validate that we have transactions and current index is valid
    if (!transactions || transactions.length === 0) {
      console.error('No transactions available');
      toast.error('No transactions to categorize. Please upload a file first.');
      return;
    }

    if (currentIndex < 0 || currentIndex >= transactions.length) {
      console.error('Invalid currentIndex:', currentIndex, 'transactions.length:', transactions.length);
      toast.error('Invalid transaction index. Please try refreshing the page.');
      return;
    }

    setIsProcessing(true);
    setIsAnimating(true);

    try {
      const currentTransaction = transactions[currentIndex];
      
      // Validate that transaction exists
      if (!currentTransaction) {
        console.error('No transaction found at index:', currentIndex, 'Total transactions:', transactions.length);
        toast.error('Error: Transaction not found. Please try refreshing the page.');
        setIsProcessing(false);
        setIsAnimating(false);
        return;
      }
      
      // Debug: Log transaction data
      console.log('🎯 handleCategorySelect: Processing transaction:', {
        index: currentIndex,
        totalTransactions: transactions.length,
        date: currentTransaction.date,
        dateType: typeof currentTransaction.date,
        isDate: currentTransaction.date instanceof Date,
        description: currentTransaction.description,
        amount: currentTransaction.amount,
        categoryId
      });
      
      // Create transaction in Firestore
      console.log('💾 handleCategorySelect: About to save transaction to Firestore...');
      const savedTransactionId = await createTransaction(user.uid, {
        ...currentTransaction,
        categoryId,
      });
      
      console.log('✅ handleCategorySelect: Transaction saved successfully with ID:', savedTransactionId);
      console.log('📊 handleCategorySelect: Save completed for transaction:', {
        savedId: savedTransactionId,
        originalIndex: currentIndex,
        categoryId,
        description: currentTransaction.description,
        amount: currentTransaction.amount
      });

      // Update live bucket counts and transaction list
      const transactionWithCategory = {
        ...currentTransaction,
        id: savedTransactionId,
        categoryId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Track this transaction as saved
      setPendingSaveTransactions(prev => [...prev, {
        transaction: currentTransaction,
        categoryId,
        savedId: savedTransactionId
      }]);

      // Update categorized transactions
      setCategorizedTransactions(prev => ({
        ...prev,
        [categoryId]: [...(prev[categoryId] || []), transactionWithCategory]
      }));

      // Update bucket counts
      setBucketCounts(prev => ({
        ...prev,
        [categoryId]: {
          count: (prev[categoryId]?.count || 0) + 1,
          total: (prev[categoryId]?.total || 0) + currentTransaction.amount
        }
      }));

      // Animation delay
      setTimeout(async () => {
        if (currentIndex + 1 >= transactions.length) {
          // All transactions categorized - add extra delay for Firestore consistency
          console.log('🏁 handleCategorySelect: All transactions completed! Adding delay for Firestore consistency...');
          sessionStorage.removeItem('uncategorizedTransactions');
          toast.success('All transactions categorized! Preparing your dashboard...');
          
          // Wait additional time for Firestore to propagate the final transaction
          console.log('⏳ handleCategorySelect: Waiting 3 seconds for Firestore propagation...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          console.log('🚀 handleCategorySelect: Redirecting to dashboard...');
          router.push('/dashboard');
        } else {
          // Move to next transaction
          setCurrentIndex(currentIndex + 1);
          setIsAnimating(false);
          setIsProcessing(false);
        }
      }, 500);

    } catch (error) {
      console.error('❌ handleCategorySelect: Error saving transaction:', error);
      console.error('❌ handleCategorySelect: Detailed error info:', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCode: (error as any)?.code,
        transactionIndex: currentIndex,
        totalTransactions: transactions.length,
        categoryId,
        userId: user.uid,
        transactionData: {
          description: currentTransaction?.description,
          amount: currentTransaction?.amount,
          date: currentTransaction?.date?.toISOString?.()
        }
      });
      toast.error(`Failed to save transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsAnimating(false);
      setIsProcessing(false);
    }
  }, [isProcessing, user, transactions, currentIndex, router]);

  const handleSaveAndExit = useCallback(async () => {
    if (!user || pendingSaveTransactions.length === 0) {
      router.push('/dashboard');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log(`💾 handleSaveAndExit: Saving ${pendingSaveTransactions.length} transactions and preparing to exit`);
      
      // Store remaining uncategorized transactions for next time
      const remainingTransactions = transactions.slice(currentIndex);
      if (remainingTransactions.length > 0) {
        sessionStorage.setItem('uncategorizedTransactions', JSON.stringify(remainingTransactions));
        console.log(`📦 handleSaveAndExit: Stored ${remainingTransactions.length} remaining transactions for next time`);
      } else {
        sessionStorage.removeItem('uncategorizedTransactions');
      }
      
      // All transactions are already saved (they were saved when categorized)
      // So we can just show success and redirect
      toast.success(`✅ Saved ${pendingSaveTransactions.length} transactions! You can continue anytime.`);
      
      console.log('🚀 handleSaveAndExit: Redirecting to dashboard...');
      router.push('/dashboard');
      
    } catch (error) {
      console.error('❌ handleSaveAndExit: Error during save and exit:', error);
      toast.error('Failed to save progress. Please try again.');
      setIsProcessing(false);
    }
  }, [user, pendingSaveTransactions, transactions, currentIndex, router]);

  const handleBackClick = useCallback(() => {
    if (pendingSaveTransactions.length > 0) {
      setShowExitConfirmation(true);
    } else {
      router.push('/dashboard');
    }
  }, [pendingSaveTransactions, router]);

  const handleExitWithoutSaving = useCallback(() => {
    // Store remaining transactions back to session storage
    const remainingTransactions = transactions.slice(currentIndex);
    if (remainingTransactions.length > 0) {
      sessionStorage.setItem('uncategorizedTransactions', JSON.stringify(remainingTransactions));
    } else {
      sessionStorage.removeItem('uncategorizedTransactions');
    }
    
    router.push('/dashboard');
  }, [transactions, currentIndex, router]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isProcessing || showCreateForm) return;

      // Ensure we have valid transactions before allowing keyboard navigation
      if (!transactions || transactions.length === 0) return;

      // Number keys 1-9 for category selection
      const keyNum = parseInt(e.key);
      if (keyNum >= 1 && keyNum <= 9 && keyNum <= categories.length) {
        const categoryIndex = keyNum - 1;
        const category = categories[categoryIndex];
        if (category) {
          handleCategorySelect(category.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [categories, isProcessing, showCreateForm, transactions, handleCategorySelect]);

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    // Get transactions from session storage
    const storedTransactions = sessionStorage.getItem('uncategorizedTransactions');
    if (!storedTransactions) {
      router.push('/dashboard');
      return;
    }

    try {
      const parsedTransactions = JSON.parse(storedTransactions);
      // Convert date strings back to Date objects with validation
      const transactionsWithDates = parsedTransactions.map((t: any, index: number) => {
        let date: Date;
        
        if (t.date) {
          date = new Date(t.date);
          // Check if the date is valid
          if (isNaN(date.getTime())) {
            console.warn(`Invalid date for transaction ${index}:`, t.date);
            date = new Date(); // Fallback to current date
          }
        } else {
          console.warn(`Missing date for transaction ${index}`);
          date = new Date(); // Fallback to current date
        }
        
        return {
          ...t,
          date,
        };
      });
      setTransactions(transactionsWithDates);
    } catch (error) {
      console.error('Error parsing transactions:', error);
      toast.error('Failed to load transactions');
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleCreateCategory = () => {
    // This would trigger the create category mutation from useCategories
    // For now, we'll show a simple form
    setShowCreateForm(true);
  };

  if (!user || transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-green-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          {/* Animated logo */}
          <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-xl relative">
            <span className="text-white text-3xl animate-pulse">💰</span>
            
            {/* Spinning ring */}
            <div className="absolute inset-0 border-4 border-transparent border-t-green-300 rounded-full animate-spin"></div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 bg-clip-text text-transparent mb-4 drop-shadow-sm">Getting Ready</h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed font-medium">Loading your transactions...</p>

          {/* Reassuring dots */}
          <div className="flex justify-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-0"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-100"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentTransaction = transactions[currentIndex];

  // Additional safety check for current transaction
  if (!currentTransaction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-green-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Oops! Something went wrong</h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">We couldn't find the transaction to categorize. Please try uploading your file again.</p>
          <button
            onClick={() => router.push('/upload')}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:from-green-600 hover:to-green-700 hover:shadow-2xl hover:scale-105 transform transition-all duration-300"
          >
            🔄 Upload New File
          </button>
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
        
        <div className="max-w-7xl mx-auto px-6 py-8 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={handleBackClick}
                className="p-4 bg-white/60 hover:bg-white/80 rounded-2xl transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-105"
                disabled={isProcessing}
                aria-label="Go back to dashboard"
              >
                <ArrowLeft size={28} className="text-gray-700" />
              </button>
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 bg-clip-text text-transparent mb-2 drop-shadow-sm">
                  Let's sort your money! 💰
                </h1>
                <p className="text-xl text-gray-700 leading-relaxed font-medium">We'll go through each transaction together - take your time! 🌟</p>
              </div>
            </div>

            {/* Save and Exit Button - Only show if there are categorized transactions */}
            {pendingSaveTransactions.length > 0 && (
              <div className="hidden sm:block">
                <button
                  onClick={handleSaveAndExit}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-lg shadow-xl hover:from-blue-600 hover:to-blue-700 hover:shadow-2xl hover:scale-105 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  <span>💾</span>
                  <div className="text-left">
                    <div className="text-sm">Save & Exit</div>
                    <div className="text-xs opacity-90">{pendingSaveTransactions.length} saved</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main categorization area */}
          <div className="flex-1 max-w-4xl order-2 lg:order-1">
            {/* Transaction Card */}
            <div className={`transition-all duration-500 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
              <TransactionCard
                transaction={currentTransaction}
                currentIndex={currentIndex}
                total={transactions.length}
              />
            </div>

            {/* Categories Grid with warm styling */}
            <div className="mt-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
              <span className="text-2xl">🪣</span>
              Which bucket does this belong in?
            </h2>
            <p className="text-xl text-gray-600 mb-4 leading-relaxed font-medium max-w-2xl mx-auto">
              Choose the bucket that feels right, or create a new one if needed. You can always change your mind later!
            </p>
            <p className="text-lg text-amber-600 font-semibold bg-amber-50 border-2 border-amber-200 rounded-2xl px-6 py-3 inline-block shadow-md">
              💡 Quick tip: Press number keys (1-{Math.min(categories.length, 9)}) for faster sorting!
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {categories.map((category, index) => (
              <CategoryButton
                key={category.id}
                category={category}
                onClick={() => handleCategorySelect(category.id)}
                disabled={isProcessing}
                shortcutKey={index < 9 ? index + 1 : undefined}
              />
            ))}
            
            {/* Create New Category Button */}
            <button
              onClick={handleCreateCategory}
              disabled={isProcessing}
              className="w-full p-6 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/60 hover:border-green-400 hover:bg-green-50/80 hover:scale-105 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-left transform group relative overflow-hidden"
            >
              {/* Background animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-50/20 to-amber-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="flex items-center gap-4 text-amber-700 group-hover:text-green-700 transition-colors duration-300 relative z-10">
                <div className="w-8 h-8 bg-amber-400 group-hover:bg-green-400 rounded-full flex items-center justify-center transition-colors duration-300 shadow-md">
                  <Plus size={20} className="text-white" />
                </div>
                <span className="text-xl font-bold">Create New Bucket</span>
              </div>
            </button>
            </div>

            {/* Mobile Save and Exit Button */}
            {pendingSaveTransactions.length > 0 && (
              <div className="mt-8 text-center sm:hidden">
                <button
                  onClick={handleSaveAndExit}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:from-blue-600 hover:to-blue-700 hover:shadow-2xl hover:scale-105 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-md mx-auto flex items-center justify-center gap-3"
                >
                  <span>💾</span>
                  <div>
                    <div>Save & Exit</div>
                    <div className="text-sm opacity-90">{pendingSaveTransactions.length} transactions saved</div>
                  </div>
                </button>
              </div>
            )}
            </div>
          </div>

          {/* Live Bucket Preview Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0 order-1 lg:order-2">
            <LiveBucketPreview
              categories={categories}
              bucketCounts={bucketCounts}
              categorizedTransactions={categorizedTransactions}
              totalTransactions={transactions.length}
              completedTransactions={currentIndex}
            />
            
            {/* Progress Summary */}
            {pendingSaveTransactions.length > 0 && (
              <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 text-center">
                <div className="text-lg font-bold text-blue-800 mb-1">
                  📊 Progress Summary
                </div>
                <div className="text-blue-700">
                  <div className="text-sm">✅ Saved: {pendingSaveTransactions.length}</div>
                  <div className="text-sm">⏳ Remaining: {transactions.length - currentIndex}</div>
                  <div className="text-xs opacity-75 mt-1">All saved transactions are secure!</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Category Form Modal with warm styling */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-green-50 rounded-3xl p-8 max-w-lg w-full shadow-2xl border-2 border-amber-200 relative overflow-hidden transform animate-in zoom-in-90 duration-300">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-200 rounded-full opacity-40 blur-2xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-200 rounded-full opacity-40 blur-2xl animate-pulse delay-1000"></div>
              
              <div className="relative z-10">
                <h3 className="text-3xl font-bold text-gray-800 mb-2 text-center flex items-center justify-center gap-2">
                  <span className="text-2xl">🪣</span>
                  Create New Bucket
                </h3>
                <p className="text-lg text-gray-600 mb-6 text-center leading-relaxed">
                  What would you like to call this new bucket? Choose a name that makes sense to you! ✨
                </p>
                
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Groceries, Fun Money, Bills..."
                  className="w-full p-4 rounded-2xl border-2 border-amber-200 bg-white/80 backdrop-blur-sm text-xl font-medium focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all duration-300 mb-6 shadow-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCategoryName.trim()) {
                      // TODO: Implement create category
                      setShowCreateForm(false);
                      setNewCategoryName('');
                    }
                    if (e.key === 'Escape') {
                      setShowCreateForm(false);
                      setNewCategoryName('');
                    }
                  }}
                  autoFocus
                />
                
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      // TODO: Implement create category
                      setShowCreateForm(false);
                      setNewCategoryName('');
                    }}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-xl hover:from-green-600 hover:to-green-700 hover:shadow-2xl hover:scale-105 transform transition-all duration-300 flex-1"
                    disabled={!newCategoryName.trim()}
                  >
                    ✨ Create Bucket
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewCategoryName('');
                    }}
                    className="bg-white/80 backdrop-blur-sm text-gray-700 px-8 py-4 rounded-2xl font-bold text-xl shadow-lg hover:bg-white hover:shadow-xl hover:scale-105 transform transition-all duration-300 border-2 border-amber-200 flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Animation with celebration */}
        {isAnimating && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40">
            <div className="bg-gradient-to-br from-green-400 to-green-500 text-white p-8 rounded-full shadow-2xl animate-bounce transform scale-110">
              <Check size={64} className="animate-pulse" />
            </div>
            {/* Celebration confetti effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-amber-400 rounded-full animate-ping"></div>
              <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-green-400 rounded-full animate-ping delay-100"></div>
              <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-orange-400 rounded-full animate-ping delay-200"></div>
              <div className="absolute bottom-1/4 right-1/3 w-3 h-3 bg-emerald-400 rounded-full animate-ping delay-300"></div>
            </div>
          </div>
        )}

        {/* Exit Confirmation Dialog */}
        {showExitConfirmation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-green-50 rounded-3xl p-8 max-w-lg w-full shadow-2xl border-2 border-amber-200 relative overflow-hidden transform animate-in zoom-in-90 duration-300">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-200 rounded-full opacity-40 blur-2xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-200 rounded-full opacity-40 blur-2xl animate-pulse delay-1000"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Save your progress?</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    You have <span className="font-bold text-blue-600">{pendingSaveTransactions.length} transactions</span> that have been categorized. 
                    What would you like to do?
                  </p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowExitConfirmation(false);
                      handleSaveAndExit();
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-xl hover:from-green-600 hover:to-green-700 hover:shadow-2xl hover:scale-105 transform transition-all duration-300"
                  >
                    💾 Save & Exit
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowExitConfirmation(false);
                      handleExitWithoutSaving();
                    }}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow-xl hover:from-red-600 hover:to-red-700 hover:shadow-2xl hover:scale-105 transform transition-all duration-300"
                  >
                    🚪 Exit Without Saving
                  </button>
                  
                  <button
                    onClick={() => setShowExitConfirmation(false)}
                    className="w-full bg-white/80 backdrop-blur-sm text-gray-700 px-6 py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-white hover:shadow-xl hover:scale-105 transform transition-all duration-300 border-2 border-amber-200"
                  >
                    ↩️ Continue Categorizing
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completion Preview with celebration */}
        {currentIndex === transactions.length - 1 && (
          <div className="mt-12 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-2 border-green-300 rounded-3xl p-8 text-center shadow-2xl transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
            {/* Celebration background */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-200/30 to-emerald-200/30 animate-pulse"></div>
            
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <Sparkles size={64} className="text-green-600 animate-pulse" />
              </div>
              <h3 className="text-4xl font-bold text-green-800 mb-4 flex items-center justify-center gap-2">
                🎉 Almost there!
              </h3>
              <p className="text-2xl text-green-700 leading-relaxed font-medium mb-4">
                This is your final transaction! After this, you'll see all your money beautifully organized in buckets! 
              </p>
              <p className="text-xl text-green-600 font-bold">
                You're doing an amazing job! 🌟
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}