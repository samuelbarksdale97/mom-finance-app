import { useState, useCallback } from 'react';
import { UndoAction } from '@/types';
import toast from 'react-hot-toast';

export const useUndo = () => {
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);

  const getActionMessage = useCallback((action: UndoAction): string => {
    switch (action.type) {
      case 'move':
        return `Moved to "${action.originalData.newCategoryName}"`;
      case 'delete':
        return `Deleted "${action.originalData.itemName}"`;
      case 'rename':
        return `Renamed to "${action.originalData.newName}"`;
      default:
        return 'Action completed';
    }
  }, []);

  const createUndoAction = useCallback((action: UndoAction) => {
    setUndoAction(action);
    
    // Show simple success toast for now (TODO: Fix undo toast implementation)
    toast.success(getActionMessage(action));

    // Clear action after timeout
    setTimeout(() => {
      setUndoAction(null);
    }, 5000);
  }, [getActionMessage]);

  const executeUndo = useCallback(async (action: UndoAction) => {
    try {
      switch (action.type) {
        case 'move':
          // Restore original categoryId
          await action.originalData.restoreFunction();
          toast.success('Action undone!');
          break;
        case 'delete':
          // Recreate the deleted item
          await action.originalData.restoreFunction();
          toast.success('Item restored!');
          break;
        case 'rename':
          // Restore original name
          await action.originalData.restoreFunction();
          toast.success('Name restored!');
          break;
      }
    } catch (error) {
      toast.error('Failed to undo action');
      console.error('Undo error:', error);
    }
  }, []);

  return {
    createUndoAction,
    currentUndoAction: undoAction,
  };
};