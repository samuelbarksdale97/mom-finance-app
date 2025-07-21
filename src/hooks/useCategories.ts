import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { createCategory, updateCategory, deleteCategory, getCategories, ensureDefaultCategories } from '@/lib/firestore';
import { Category } from '@/types';
import toast from 'react-hot-toast';

export const useCategories = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['categories', user?.uid],
    queryFn: async () => {
      if (!user?.uid) throw new Error('No user authenticated');
      
      console.log('🔍 Fetching categories for user:', user.uid);
      
      try {
        // Ensure default categories exist
        await ensureDefaultCategories(user.uid);
        const categories = await getCategories(user.uid);
        console.log('✅ Categories fetched:', categories);
        return categories;
      } catch (error) {
        console.error('❌ Error fetching categories:', error);
        throw error;
      }
    },
    enabled: !!user?.uid,
    retry: 3,
    retryDelay: 1000,
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!user?.uid) throw new Error('No user authenticated');
      return createCategory(user.uid, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', user?.uid] });
      toast.success('Category created successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to create category: ${error.message}`);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, updates }: { categoryId: string; updates: Partial<Category> }) => {
      if (!user?.uid) throw new Error('No user authenticated');
      return updateCategory(user.uid, categoryId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', user?.uid] });
      toast.success('Category updated successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to update category: ${error.message}`);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      if (!user?.uid) throw new Error('No user authenticated');
      return deleteCategory(user.uid, categoryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', user?.uid] });
      toast.success('Category deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    },
  });

  return {
    categories: categoriesQuery.data || [],
    isLoading: categoriesQuery.isLoading,
    error: categoriesQuery.error,
    createCategory: createCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
    isCreating: createCategoryMutation.isPending,
    isUpdating: updateCategoryMutation.isPending,
    isDeleting: deleteCategoryMutation.isPending,
  };
};