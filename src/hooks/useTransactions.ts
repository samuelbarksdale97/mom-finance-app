import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTransactionsGroupedByCategory, getRecentTransactions } from '@/lib/firestore';
import { Transaction } from '@/types';

interface UseTransactionsReturn {
  transactionsByCategory: { [categoryId: string]: Transaction[] };
  recentTransactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  refetch: (forceRefresh?: boolean) => Promise<void>;
}

export const useTransactions = (): UseTransactionsReturn => {
  const { user } = useAuth();
  const [transactionsByCategory, setTransactionsByCategory] = useState<{ [categoryId: string]: Transaction[] }>({});
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (forceRefresh: boolean = false) => {
    console.log('🔍 useTransactions: fetchTransactions called with forceRefresh:', forceRefresh);
    
    if (!user) {
      console.log('❌ useTransactions: No user found, clearing data');
      setTransactionsByCategory({});
      setRecentTransactions([]);
      setIsLoading(false);
      return;
    }

    console.log('✅ useTransactions: User found:', user.uid);

    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 useTransactions: Starting to fetch transactions...');

      // Fetch transactions grouped by category and recent transactions in parallel
      const [grouped, recent] = await Promise.all([
        getTransactionsGroupedByCategory(user.uid, forceRefresh),
        getRecentTransactions(user.uid, 100, forceRefresh)
      ]);

      console.log('📊 useTransactions: Fetched data:', {
        forceRefresh,
        dataSource: forceRefresh ? 'server' : 'cache-or-server',
        groupedKeys: Object.keys(grouped),
        totalGroupedTransactions: Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0),
        recentTransactionsCount: recent.length,
        groupedData: grouped,
        recentData: recent
      });

      setTransactionsByCategory(grouped);
      setRecentTransactions(recent);
      
      console.log('✅ useTransactions: Data set successfully');
    } catch (err) {
      console.error('❌ useTransactions: Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
      console.log('🏁 useTransactions: Loading complete');
    }
  };

  // Fetch transactions when user changes or component mounts
  useEffect(() => {
    fetchTransactions();
  }, [user]);

  return {
    transactionsByCategory,
    recentTransactions,
    isLoading,
    error,
    refetch: fetchTransactions,
  };
};