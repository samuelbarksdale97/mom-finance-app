import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  getDocs, 
  getDocsFromServer,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Category, Transaction } from '@/types';

// Helper function to detect and log Firestore index errors
const isFirestoreIndexError = (error: any): boolean => {
  const errorMessage = error?.message || '';
  const errorCode = error?.code || '';
  
  // Common patterns for index-related errors
  const indexErrorPatterns = [
    'requires an index',
    'index is not ready',
    'composite index',
    'failed-precondition',
    'index creation is in progress'
  ];
  
  const isIndexError = indexErrorPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern) || 
    errorCode.toLowerCase().includes(pattern)
  );
  
  if (isIndexError) {
    console.error('🚨 FIRESTORE INDEX ERROR DETECTED:', {
      message: errorMessage,
      code: errorCode,
      fullError: error,
      solution: 'This query requires a composite index. Check Firebase Console → Firestore → Indexes'
    });
  }
  
  return isIndexError;
};

// Generate consistent transaction ID from transaction data
export const generateTransactionId = (date: Date, description: string, amount: number): string => {
  // Validate date parameter
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    console.error('Invalid date passed to generateTransactionId:', date);
    throw new Error('Invalid date provided for transaction ID generation');
  }
  
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const data = `${dateStr}-${description}-${amount}`;
  // Simple hash function (you might want to use crypto for production)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

// Default categories
export const defaultCategories: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Personal', color: '#3b82f6', isDefault: true },
  { name: 'Mom & Dad', color: '#10b981', isDefault: true },
  { name: 'Family', color: '#f59e0b', isDefault: true },
];

// Category operations
export const createCategory = async (userId: string, category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
  const categoryRef = doc(collection(db, 'users', userId, 'categories'));
  const categoryData = {
    ...category,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(categoryRef, categoryData);
  return categoryRef.id;
};

export const updateCategory = async (userId: string, categoryId: string, updates: Partial<Category>) => {
  const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
  await updateDoc(categoryRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteCategory = async (userId: string, categoryId: string) => {
  const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
  await deleteDoc(categoryRef);
};

export const getCategories = async (userId: string): Promise<Category[]> => {
  const categoriesRef = collection(db, 'users', userId, 'categories');
  const snapshot = await getDocs(query(categoriesRef, orderBy('createdAt')));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as Category[];
};

// Transaction operations
export const createTransaction = async (userId: string, transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
  console.log('💾 createTransaction: Starting save process for userId:', userId);
  const startTime = Date.now();
  
  // Validate transaction data
  if (!transaction.date || !(transaction.date instanceof Date) || isNaN(transaction.date.getTime())) {
    console.error('❌ createTransaction: Invalid transaction date:', transaction.date);
    throw new Error('Transaction must have a valid date');
  }
  
  if (!transaction.description || typeof transaction.description !== 'string') {
    console.error('❌ createTransaction: Invalid transaction description:', transaction.description);
    throw new Error('Transaction must have a valid description');
  }
  
  if (transaction.amount === undefined || transaction.amount === null || isNaN(transaction.amount)) {
    console.error('❌ createTransaction: Invalid transaction amount:', transaction.amount);
    throw new Error('Transaction must have a valid amount');
  }
  
  const transactionId = generateTransactionId(transaction.date, transaction.description, transaction.amount);
  const year = transaction.date.getFullYear();
  const month = transaction.date.getMonth() + 1; // 1-based month
  const monthStr = month.toString().padStart(2, '0');
  
  const firestorePath = `users/${userId}/transactions/${year}/months/${monthStr}/items/${transactionId}`;
  console.log('📍 createTransaction: Firestore path:', firestorePath);
  console.log('📝 createTransaction: Transaction data to save:', {
    transactionId,
    year,
    month: monthStr,
    categoryId: transaction.categoryId,
    description: transaction.description,
    amount: transaction.amount,
    date: transaction.date.toISOString(),
    rawDescription: transaction.rawDescription
  });
  
  const transactionRef = doc(db, 'users', userId, 'transactions', year.toString(), 'months', monthStr, 'items', transactionId);
  
  const transactionData = {
    ...transaction,
    date: Timestamp.fromDate(transaction.date),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  try {
    console.log('⏳ createTransaction: Attempting to save to Firestore...');
    await setDoc(transactionRef, transactionData);
    const endTime = Date.now();
    console.log(`✅ createTransaction: Successfully saved transaction ${transactionId} in ${endTime - startTime}ms`);
    
    // Verify the write by reading it back
    console.log('🔍 createTransaction: Verifying save by reading back...');
    const verifyDoc = await getDoc(transactionRef);
    if (verifyDoc.exists()) {
      const savedData = verifyDoc.data();
      console.log('✅ createTransaction: Verification successful - transaction exists in Firestore:', {
        id: verifyDoc.id,
        categoryId: savedData.categoryId,
        description: savedData.description,
        amount: savedData.amount,
        hasDate: !!savedData.date,
        hasCreatedAt: !!savedData.createdAt
      });
    } else {
      console.error('❌ createTransaction: VERIFICATION FAILED - transaction not found after save!');
      throw new Error('Transaction save verification failed - document not found');
    }
    
    return transactionId;
  } catch (error) {
    console.error('❌ createTransaction: Save failed:', error);
    console.error('❌ createTransaction: Error details:', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorCode: (error as any)?.code,
      userId,
      transactionId,
      firestorePath
    });
    throw error;
  }
};

export const updateTransaction = async (userId: string, transactionId: string, transaction: Transaction, updates: Partial<Transaction>) => {
  const year = transaction.date.getFullYear();
  const month = transaction.date.getMonth() + 1;
  const transactionRef = doc(db, 'users', userId, 'transactions', year.toString(), 'months', month.toString().padStart(2, '0'), 'items', transactionId);
  
  await updateDoc(transactionRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteTransaction = async (userId: string, transactionId: string, transaction: Transaction) => {
  const year = transaction.date.getFullYear();
  const month = transaction.date.getMonth() + 1;
  const transactionRef = doc(db, 'users', userId, 'transactions', year.toString(), 'months', month.toString().padStart(2, '0'), 'items', transactionId);
  
  await deleteDoc(transactionRef);
};

export const getTransactionById = async (userId: string, transactionId: string, date: Date): Promise<Transaction | null> => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const transactionRef = doc(db, 'users', userId, 'transactions', year.toString(), 'months', month.toString().padStart(2, '0'), 'items', transactionId);
  
  const snapshot = await getDoc(transactionRef);
  if (!snapshot.exists()) return null;
  
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    date: data.date.toDate(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Transaction;
};

// Get transactions by category
export const getTransactionsByCategory = async (userId: string, categoryId: string): Promise<Transaction[]> => {
  const currentYear = new Date().getFullYear();
  const transactions: Transaction[] = [];
  
  // Search current year and previous year for transactions
  for (const year of [currentYear, currentYear - 1]) {
    for (let month = 1; month <= 12; month++) {
      try {
        const monthStr = month.toString().padStart(2, '0');
        const itemsRef = collection(db, 'users', userId, 'transactions', year.toString(), 'months', monthStr, 'items');
        
        let snapshot;
        try {
          // Try complex query with where + orderBy first (requires composite index)
          console.log(`🔍 getTransactionsByCategory: Attempting complex query for ${year}/${monthStr}, categoryId: ${categoryId}`);
          const categoryQuery = query(itemsRef, where('categoryId', '==', categoryId), orderBy('date', 'desc'));
          snapshot = await getDocs(categoryQuery);
          console.log(`✅ getTransactionsByCategory: Complex query succeeded for ${year}/${monthStr}`);
        } catch (queryError) {
          const isIndexError = isFirestoreIndexError(queryError);
          console.warn(`⚠️ getTransactionsByCategory: Complex query failed for ${year}/${monthStr} ${isIndexError ? '(INDEX ERROR)' : ''}, trying simple query:`, queryError);
          
          // Fallback to simple where query without orderBy
          try {
            console.log(`🔄 getTransactionsByCategory: Attempting simple where query for ${year}/${monthStr}, categoryId: ${categoryId}`);
            const simpleQuery = query(itemsRef, where('categoryId', '==', categoryId));
            snapshot = await getDocs(simpleQuery);
            console.log(`✅ getTransactionsByCategory: Simple query succeeded for ${year}/${monthStr}`);
          } catch (simpleError) {
            console.error(`❌ getTransactionsByCategory: Both queries failed for ${year}/${monthStr}:`, simpleError);
            continue; // Skip this month
          }
        }
        
        console.log(`📊 getTransactionsByCategory: Found ${snapshot.docs.length} docs in ${year}/${monthStr} for categoryId: ${categoryId}`);
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          transactions.push({
            id: doc.id,
            ...data,
            date: data.date.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Transaction);
        });
      } catch (error) {
        // Month collection doesn't exist, continue
        console.log(`📝 getTransactionsByCategory: Month ${year}/${month} doesn't exist, continuing...`);
        continue;
      }
    }
  }
  
  // Sort by date descending (client-side sorting as fallback)
  console.log(`📈 getTransactionsByCategory: Found ${transactions.length} total transactions for categoryId: ${categoryId}`);
  console.log('🔄 getTransactionsByCategory: Applying client-side sorting by date descending');
  
  const sortedTransactions = transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  console.log(`✅ getTransactionsByCategory: Returning ${sortedTransactions.length} sorted transactions for categoryId: ${categoryId}`);
  return sortedTransactions;
};

// Get recent transactions across all categories
export const getRecentTransactions = async (userId: string, limit: number = 50, forceRefresh: boolean = false): Promise<Transaction[]> => {
  console.log('🔍 getRecentTransactions: Starting search for userId:', userId, 'limit:', limit, 'forceRefresh:', forceRefresh);
  
  const currentYear = new Date().getFullYear();
  const transactions: Transaction[] = [];
  
  // Search current year and previous 4 years to cover historical data
  const searchYears = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];
  console.log('📅 getRecentTransactions: Searching years:', searchYears);
  
  // Search multiple years for transactions
  for (const year of searchYears) {
    console.log(`📆 getRecentTransactions: Searching year ${year}`);
    
    for (let month = 12; month >= 1; month--) {
      try {
        const monthStr = month.toString().padStart(2, '0');
        const path = `users/${userId}/transactions/${year}/months/${monthStr}/items`;
        console.log(`🔍 getRecentTransactions: Checking path: ${path}`);
        
        const itemsRef = collection(db, 'users', userId, 'transactions', year.toString(), 'months', monthStr, 'items');
        
        let snapshot;
        try {
          // Try complex query with orderBy first
          console.log(`🔍 getRecentTransactions: Attempting orderBy query for ${year}/${monthStr}`);
          const recentQuery = query(itemsRef, orderBy('date', 'desc'));
          snapshot = forceRefresh ? await getDocsFromServer(recentQuery) : await getDocs(recentQuery);
          console.log(`✅ getRecentTransactions: OrderBy query succeeded for ${year}/${monthStr}`);
        } catch (error) {
          const isIndexError = isFirestoreIndexError(error);
          console.warn(`⚠️ getRecentTransactions: OrderBy query failed for ${year}/${monthStr} ${isIndexError ? '(INDEX ERROR)' : ''}, trying simple query:`, error);
          
          // Fallback to simple query without orderBy
          try {
            console.log(`🔄 getRecentTransactions: Attempting simple query (no orderBy) for ${year}/${monthStr}`);
            snapshot = forceRefresh ? await getDocsFromServer(itemsRef) : await getDocs(itemsRef);
            console.log(`✅ getRecentTransactions: Simple query succeeded for ${year}/${monthStr}`);
          } catch (simpleError) {
            console.error(`❌ getRecentTransactions: Both queries failed for ${year}/${monthStr}:`, simpleError);
            continue; // Skip this month and continue
          }
        }
        
        console.log(`📊 getRecentTransactions: Found ${snapshot.docs.length} docs in ${year}/${monthStr} (source: ${forceRefresh ? 'server' : 'cache-or-server'})`);
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log('📄 getRecentTransactions: Processing doc:', {
            id: doc.id,
            categoryId: data.categoryId,
            description: data.description,
            amount: data.amount,
            date: data.date?.toDate?.()
          });
          
          transactions.push({
            id: doc.id,
            ...data,
            date: data.date.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Transaction);
        });
        
        // If we have enough transactions, stop searching
        if (transactions.length >= limit) {
          console.log(`✅ getRecentTransactions: Reached limit of ${limit}, stopping search`);
          break;
        }
      } catch (error) {
        console.log(`⚠️ getRecentTransactions: Error accessing ${year}/${month}:`, error);
        // Month collection doesn't exist, continue
        continue;
      }
    }
    if (transactions.length >= limit) break;
  }
  
  console.log(`📈 getRecentTransactions: Total found: ${transactions.length} transactions`);
  
  // Sort by date descending and limit (client-side sorting as fallback)
  console.log('🔄 getRecentTransactions: Applying client-side sorting by date descending');
  const result = transactions
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
    
  console.log('✅ getRecentTransactions: Returning:', result.length, 'transactions after client-side sorting');
  console.log('📊 getRecentTransactions: Sample of returned transactions:', 
    result.slice(0, 3).map(t => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      date: t.date.toISOString(),
      categoryId: t.categoryId
    }))
  );
  
  return result;
};

// Get uncategorized transactions by comparing new transactions with existing ones
export const getUncategorizedTransactions = async (
  userId: string, 
  newTransactions: Omit<Transaction, 'id' | 'categoryId' | 'createdAt' | 'updatedAt'>[]
): Promise<{
  uncategorizedTransactions: Omit<Transaction, 'id' | 'categoryId' | 'createdAt' | 'updatedAt'>[],
  existingCount: number,
  newCount: number
}> => {
  console.log('🔍 getUncategorizedTransactions: Checking', newTransactions.length, 'transactions for duplicates');
  
  // Get all existing transactions to check for duplicates
  const existingTransactions = await getRecentTransactions(userId, 10000, true); // Get up to 10k transactions
  
  // Create a Set of existing transaction IDs for fast lookup
  const existingIds = new Set<string>();
  existingTransactions.forEach(tx => {
    existingIds.add(tx.id);
  });
  
  console.log('📊 getUncategorizedTransactions: Found', existingIds.size, 'existing transactions in database');
  
  // Filter out transactions that already exist
  const uncategorizedTransactions = newTransactions.filter(newTx => {
    try {
      const potentialId = generateTransactionId(newTx.date, newTx.description, newTx.amount);
      const exists = existingIds.has(potentialId);
      
      if (exists) {
        console.log('⏭️ Skipping duplicate transaction:', newTx.description, newTx.amount, newTx.date.toISOString().split('T')[0]);
      }
      
      return !exists;
    } catch (error) {
      console.error('Error checking transaction:', error, newTx);
      return true; // Include it if we can't determine (safer than losing data)
    }
  });
  
  const result = {
    uncategorizedTransactions,
    existingCount: newTransactions.length - uncategorizedTransactions.length,
    newCount: uncategorizedTransactions.length
  };
  
  console.log('✅ getUncategorizedTransactions: Result:', {
    totalChecked: newTransactions.length,
    alreadyExist: result.existingCount,
    newToProcess: result.newCount
  });
  
  return result;
};

// Get all transactions grouped by category
export const getTransactionsGroupedByCategory = async (userId: string, forceRefresh: boolean = false): Promise<{ [categoryId: string]: Transaction[] }> => {
  console.log('🔍 getTransactionsGroupedByCategory: Starting for userId:', userId, 'forceRefresh:', forceRefresh);
  
  const transactions = await getRecentTransactions(userId, 1000, forceRefresh); // Get more for grouping
  console.log('📊 getTransactionsGroupedByCategory: Retrieved', transactions.length, 'transactions to group');
  
  const grouped: { [categoryId: string]: Transaction[] } = {};
  
  transactions.forEach(transaction => {
    const categoryId = transaction.categoryId || 'uncategorized';
    console.log('📝 getTransactionsGroupedByCategory: Grouping transaction:', {
      id: transaction.id,
      categoryId,
      description: transaction.description,
      amount: transaction.amount
    });
    
    if (!grouped[categoryId]) {
      grouped[categoryId] = [];
      console.log(`📁 getTransactionsGroupedByCategory: Created new group for categoryId: ${categoryId}`);
    }
    grouped[categoryId].push(transaction);
  });
  
  console.log('✅ getTransactionsGroupedByCategory: Grouped into categories:', {
    categoryIds: Object.keys(grouped),
    totalGroups: Object.keys(grouped).length,
    transactionCounts: Object.fromEntries(
      Object.entries(grouped).map(([id, transactions]) => [id, transactions.length])
    )
  });
  
  return grouped;
};

// Debug function to manually test Firestore structure
export const debugFirestoreTransactions = async (userId: string): Promise<void> => {
  console.log('🔧 DEBUG: Starting Firestore transaction debug for user:', userId);
  
  try {
    // Test 1: Check if user collection exists
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    console.log('👤 DEBUG: User document exists:', userSnap.exists());
    
    // Test 2: Check transactions collection structure
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    
    console.log('📅 DEBUG: Current date info:', {
      year: currentYear,
      month: currentMonth,
      fullDate: currentDate.toISOString()
    });
    
    // Test 3: Try to list transaction years
    const transactionsRef = collection(db, 'users', userId, 'transactions');
    const yearSnapshots = await getDocs(transactionsRef);
    console.log('📁 DEBUG: Transaction years found:', yearSnapshots.docs.map(doc => doc.id));
    
    // Test 4: Check current month for transactions
    const currentMonthPath = `users/${userId}/transactions/${currentYear}/months/${currentMonth}/items`;
    console.log('🔍 DEBUG: Checking current month path:', currentMonthPath);
    
    const currentMonthRef = collection(db, 'users', userId, 'transactions', currentYear.toString(), 'months', currentMonth, 'items');
    const currentMonthSnapshot = await getDocs(currentMonthRef);
    console.log('📊 DEBUG: Current month transactions count:', currentMonthSnapshot.docs.length);
    
    if (currentMonthSnapshot.docs.length > 0) {
      console.log('📄 DEBUG: Sample transaction data:', currentMonthSnapshot.docs[0].data());
    }
    
    // Test 5: Try querying all transactions without date ordering
    console.log('🔍 DEBUG: Attempting simple query without orderBy...');
    const simpleQuery = query(currentMonthRef);
    const simpleSnapshot = await getDocs(simpleQuery);
    console.log('✅ DEBUG: Simple query returned:', simpleSnapshot.docs.length, 'documents');
    
  } catch (error) {
    console.error('❌ DEBUG: Error during Firestore debug:', error);
  }
};

// Check if default categories exist, create them if not
export const ensureDefaultCategories = async (userId: string) => {
  const categories = await getCategories(userId);
  if (categories.length === 0) {
    for (const category of defaultCategories) {
      await createCategory(userId, category);
    }
  }
};

// Create mock test data for debugging
export const createMockTestData = async (userId: string): Promise<void> => {
  console.log('🧪 createMockTestData: Creating test transactions for userId:', userId);
  
  // Get user's categories to use for mock data
  const categories = await getCategories(userId);
  if (categories.length === 0) {
    throw new Error('No categories found. Please create categories first.');
  }
  
  const mockTransactions = [
    {
      description: '🧪 TEST: Grocery Store Purchase',
      amount: -85.43,
      date: new Date(),
      categoryId: categories[0].id, // First category
      rawDescription: 'TEST DATA - KROGER #123 PURCHASE'
    },
    {
      description: '🧪 TEST: Coffee Shop',
      amount: -4.75,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      categoryId: categories[0].id,
      rawDescription: 'TEST DATA - STARBUCKS STORE #456'
    },
    {
      description: '🧪 TEST: Salary Deposit',
      amount: 3000.00,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      categoryId: categories.length > 1 ? categories[1].id : categories[0].id,
      rawDescription: 'TEST DATA - PAYROLL DEPOSIT ACME CORP'
    }
  ];
  
  if (categories.length > 2) {
    mockTransactions.push({
      description: '🧪 TEST: Gas Station',
      amount: -45.20,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      categoryId: categories[2].id,
      rawDescription: 'TEST DATA - SHELL GAS STATION #789'
    });
  }
  
  console.log('🧪 createMockTestData: Will create', mockTransactions.length, 'test transactions');
  
  for (let i = 0; i < mockTransactions.length; i++) {
    const mockTx = mockTransactions[i];
    console.log(`🧪 createMockTestData: Creating test transaction ${i + 1}/${mockTransactions.length}:`, {
      description: mockTx.description,
      amount: mockTx.amount,
      categoryId: mockTx.categoryId
    });
    
    try {
      const savedId = await createTransaction(userId, mockTx);
      console.log(`✅ createMockTestData: Test transaction ${i + 1} saved with ID:`, savedId);
    } catch (error) {
      console.error(`❌ createMockTestData: Failed to save test transaction ${i + 1}:`, error);
      throw error;
    }
  }
  
  console.log('🎉 createMockTestData: All test transactions created successfully!');
};

// Clear all test data (transactions with 🧪 TEST: prefix)
export const clearMockTestData = async (userId: string): Promise<void> => {
  console.log('🗑️ clearMockTestData: Clearing test data for userId:', userId);
  
  const allTransactions = await getRecentTransactions(userId, 1000, true); // Force refresh to get all
  const testTransactions = allTransactions.filter(tx => tx.description.includes('🧪 TEST:'));
  
  console.log('🗑️ clearMockTestData: Found', testTransactions.length, 'test transactions to delete');
  
  for (const testTx of testTransactions) {
    try {
      await deleteTransaction(userId, testTx.id, testTx);
      console.log('🗑️ clearMockTestData: Deleted test transaction:', testTx.description);
    } catch (error) {
      console.error('❌ clearMockTestData: Failed to delete test transaction:', testTx.description, error);
    }
  }
  
  console.log('🧹 clearMockTestData: Test data cleanup completed');
};

// Simple Firestore read/write test to isolate root issues
export const simpleFirestoreTest = async (userId: string): Promise<void> => {
  console.log('🧪 simpleFirestoreTest: Starting basic Firestore read/write test for userId:', userId);
  
  try {
    // Test 1: Simple document write and read
    console.log('📝 TEST 1: Simple document write/read test');
    
    const testData = {
      description: "🧪 SIMPLE TEST TRANSACTION",
      amount: -25.50,
      categoryId: "test_category_123",
      date: new Date(),
      timestamp: Date.now(),
      test: true,
      created: new Date().toISOString()
    };
    
    const simplePath = `users/${userId}/simple_test/test_doc_1`;
    console.log('📍 simpleFirestoreTest: Writing to path:', simplePath);
    console.log('📝 simpleFirestoreTest: Writing data:', testData);
    
    // Write to simple path
    const testDocRef = doc(db, 'users', userId, 'simple_test', 'test_doc_1');
    await setDoc(testDocRef, testData);
    console.log('✅ simpleFirestoreTest: Write completed successfully');
    
    // Read back immediately
    console.log('📖 simpleFirestoreTest: Reading back from same path...');
    const readResult = await getDoc(testDocRef);
    
    if (readResult.exists()) {
      const readData = readResult.data();
      console.log('✅ simpleFirestoreTest: Read successful! Data found:', readData);
      
      // Compare key fields
      const comparison = {
        writeDescription: testData.description,
        readDescription: readData.description,
        writeAmount: testData.amount,
        readAmount: readData.amount,
        writeCategoryId: testData.categoryId,
        readCategoryId: readData.categoryId,
        dataMatch: JSON.stringify(testData) === JSON.stringify(readData)
      };
      console.log('🔍 simpleFirestoreTest: Data comparison:', comparison);
    } else {
      console.error('❌ simpleFirestoreTest: Document not found after write!');
      throw new Error('Simple read/write test failed - document not found');
    }
    
    // Test 2: Collection query test
    console.log('📝 TEST 2: Collection query test');
    
    // Write a second document
    const testData2 = {
      description: "🧪 SECOND TEST TRANSACTION",
      amount: 100.00,
      categoryId: "test_category_456",
      date: new Date(),
      test: true
    };
    
    const testDoc2Ref = doc(db, 'users', userId, 'simple_test', 'test_doc_2');
    await setDoc(testDoc2Ref, testData2);
    console.log('✅ simpleFirestoreTest: Second document written');
    
    // Query the collection
    console.log('📖 simpleFirestoreTest: Querying collection...');
    const collectionRef = collection(db, 'users', userId, 'simple_test');
    const querySnapshot = await getDocs(collectionRef);
    
    console.log('📊 simpleFirestoreTest: Collection query results:');
    console.log(`   - Found ${querySnapshot.docs.length} documents`);
    
    querySnapshot.docs.forEach((doc, index) => {
      console.log(`   - Doc ${index + 1}: ID=${doc.id}, Data=`, doc.data());
    });
    
    if (querySnapshot.docs.length >= 2) {
      console.log('✅ simpleFirestoreTest: Collection query successful!');
    } else {
      console.error('❌ simpleFirestoreTest: Collection query failed - expected 2+ docs, found:', querySnapshot.docs.length);
    }
    
    // Test 3: Force server query test
    console.log('📝 TEST 3: Force server query test');
    const serverSnapshot = await getDocsFromServer(collectionRef);
    console.log(`📊 simpleFirestoreTest: Server query found ${serverSnapshot.docs.length} documents`);
    
    console.log('🎉 simpleFirestoreTest: All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ simpleFirestoreTest: Test failed:', error);
    console.error('❌ simpleFirestoreTest: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      userId
    });
    throw error;
  }
};

// Direct query to see ALL data currently stored in Firestore
export const queryAllFirestoreData = async (userId: string): Promise<void> => {
  console.log('🔍 queryAllFirestoreData: Starting comprehensive Firestore data query for userId:', userId);
  
  try {
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear - 1];
    
    console.log('📅 queryAllFirestoreData: Searching years:', years);
    
    let totalTransactionsFound = 0;
    const foundData: any[] = [];
    
    // Query all possible transaction paths
    for (const year of years) {
      console.log(`📆 queryAllFirestoreData: Checking year ${year}...`);
      
      for (let month = 1; month <= 12; month++) {
        const monthStr = month.toString().padStart(2, '0');
        const path = `users/${userId}/transactions/${year}/months/${monthStr}/items`;
        
        try {
          console.log(`🔍 queryAllFirestoreData: Querying path: ${path}`);
          
          const itemsRef = collection(db, 'users', userId, 'transactions', year.toString(), 'months', monthStr, 'items');
          
          // Try both cached and server queries
          const cachedSnapshot = await getDocs(itemsRef);
          const serverSnapshot = await getDocsFromServer(itemsRef);
          
          console.log(`📊 queryAllFirestoreData: ${path} - Cached: ${cachedSnapshot.docs.length}, Server: ${serverSnapshot.docs.length} docs`);
          
          if (serverSnapshot.docs.length > 0) {
            totalTransactionsFound += serverSnapshot.docs.length;
            
            serverSnapshot.docs.forEach((doc, index) => {
              const data = doc.data();
              const transactionInfo = {
                path,
                docId: doc.id,
                description: data.description,
                amount: data.amount,
                categoryId: data.categoryId,
                date: data.date?.toDate?.() || data.date,
                createdAt: data.createdAt?.toDate?.() || data.createdAt,
                rawData: data
              };
              
              foundData.push(transactionInfo);
              console.log(`   📄 Doc ${index + 1}: ID=${doc.id}, Description="${data.description}", Amount=${data.amount}, CategoryId=${data.categoryId}`);
            });
          }
          
        } catch (error) {
          console.log(`   ⚠️ queryAllFirestoreData: Error querying ${path}:`, error);
        }
      }
    }
    
    console.log('🎯 queryAllFirestoreData: SUMMARY');
    console.log(`   📊 Total transactions found: ${totalTransactionsFound}`);
    console.log(`   📅 Years searched: ${years.join(', ')}`);
    console.log(`   📁 Months searched per year: 1-12`);
    
    if (totalTransactionsFound > 0) {
      console.log('✅ queryAllFirestoreData: FOUND TRANSACTIONS! Here they are:');
      console.table(foundData.map(t => ({
        ID: t.docId,
        Description: t.description,
        Amount: t.amount,
        CategoryId: t.categoryId,
        Date: t.date?.toISOString?.() || t.date,
        Path: t.path
      })));
      
      // Group by category
      const byCategory: { [key: string]: any[] } = {};
      foundData.forEach(tx => {
        if (!byCategory[tx.categoryId]) byCategory[tx.categoryId] = [];
        byCategory[tx.categoryId].push(tx);
      });
      
      console.log('📊 queryAllFirestoreData: Transactions by category:');
      Object.entries(byCategory).forEach(([categoryId, transactions]) => {
        console.log(`   🪣 Category ${categoryId}: ${transactions.length} transactions`);
        transactions.forEach(tx => {
          console.log(`      - ${tx.description}: $${tx.amount}`);
        });
      });
      
    } else {
      console.log('❌ queryAllFirestoreData: NO TRANSACTIONS FOUND!');
      console.log('   This means either:');
      console.log('   1. Transactions were never actually saved to Firestore');
      console.log('   2. They were saved to different paths than expected');
      console.log('   3. There are permission issues preventing reads');
    }
    
    // Also check for any other collections under the user
    console.log('🔍 queryAllFirestoreData: Checking for other user data...');
    
    try {
      // Check categories
      const categoriesRef = collection(db, 'users', userId, 'categories');
      const categoriesSnapshot = await getDocs(categoriesRef);
      console.log(`📁 Categories found: ${categoriesSnapshot.docs.length}`);
      categoriesSnapshot.docs.forEach(doc => {
        console.log(`   🏷️ Category: ${doc.data().name} (ID: ${doc.id})`);
      });
      
      // Check simple test data
      const simpleTestRef = collection(db, 'users', userId, 'simple_test');
      const simpleTestSnapshot = await getDocs(simpleTestRef);
      console.log(`🧪 Simple test docs found: ${simpleTestSnapshot.docs.length}`);
      
    } catch (error) {
      console.log('⚠️ queryAllFirestoreData: Error checking other collections:', error);
    }
    
  } catch (error) {
    console.error('❌ queryAllFirestoreData: Query failed:', error);
    throw error;
  }
};

// Test createTransaction function directly to find the save failure
export const testCreateTransaction = async (userId: string): Promise<void> => {
  console.log('🧪 testCreateTransaction: Testing transaction creation directly');
  
  try {
    // Create simple test transaction data
    const testTransaction = {
      description: "🧪 DIRECT CREATE TEST",
      amount: -99.99,
      date: new Date(),
      categoryId: "test_category_direct",
      rawDescription: "Direct test of createTransaction function"
    };
    
    console.log('📝 testCreateTransaction: Test transaction data:', testTransaction);
    
    // Call createTransaction directly
    console.log('💾 testCreateTransaction: Calling createTransaction...');
    const savedId = await createTransaction(userId, testTransaction);
    
    console.log('✅ testCreateTransaction: createTransaction returned ID:', savedId);
    
    // Now immediately search for it in ALL possible locations
    console.log('🔍 testCreateTransaction: Searching for the saved transaction...');
    
    const year = testTransaction.date.getFullYear();
    const month = testTransaction.date.getMonth() + 1;
    const monthStr = month.toString().padStart(2, '0');
    
    // Check the expected path
    const expectedPath = `users/${userId}/transactions/${year}/months/${monthStr}/items/${savedId}`;
    console.log('📍 testCreateTransaction: Expected path:', expectedPath);
    
    const expectedRef = doc(db, 'users', userId, 'transactions', year.toString(), 'months', monthStr, 'items', savedId);
    const expectedDoc = await getDoc(expectedRef);
    
    if (expectedDoc.exists()) {
      console.log('✅ testCreateTransaction: FOUND at expected path!', expectedDoc.data());
    } else {
      console.log('❌ testCreateTransaction: NOT FOUND at expected path!');
    }
    
    // Check with server query
    const serverDoc = await getDocFromServer(expectedRef);
    if (serverDoc.exists()) {
      console.log('✅ testCreateTransaction: FOUND with server query!', serverDoc.data());
    } else {
      console.log('❌ testCreateTransaction: NOT FOUND with server query either!');
    }
    
    // Search the entire month collection
    const monthRef = collection(db, 'users', userId, 'transactions', year.toString(), 'months', monthStr, 'items');
    const monthSnapshot = await getDocs(monthRef);
    
    console.log(`📊 testCreateTransaction: Month collection has ${monthSnapshot.docs.length} documents`);
    monthSnapshot.docs.forEach(doc => {
      console.log(`   📄 Found doc: ${doc.id}`, doc.data());
    });
    
    // Check if there are any permission errors
    console.log('🔐 testCreateTransaction: Testing write permissions...');
    try {
      const simpleTestRef = doc(db, 'users', userId, 'test_write_permissions', 'test_doc');
      await setDoc(simpleTestRef, { test: true, timestamp: Date.now() });
      console.log('✅ testCreateTransaction: Write permissions work for simple path');
      
      const readBack = await getDoc(simpleTestRef);
      if (readBack.exists()) {
        console.log('✅ testCreateTransaction: Read-back successful for simple path');
      } else {
        console.log('❌ testCreateTransaction: Read-back failed for simple path');
      }
    } catch (permError) {
      console.error('❌ testCreateTransaction: Permission error:', permError);
    }
    
  } catch (error) {
    console.error('❌ testCreateTransaction: Test failed:', error);
    console.error('❌ testCreateTransaction: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      name: (error as any)?.name,
      stack: (error as any)?.stack
    });
    throw error;
  }
};