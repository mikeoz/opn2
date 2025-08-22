import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load pending actions from localStorage
    const stored = localStorage.getItem('offline-actions');
    if (stored) {
      try {
        setPendingActions(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse offline actions:', error);
      }
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection restored",
        description: "Syncing offline changes...",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Connection lost",
        description: "Working offline - changes will sync when reconnected",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Sync pending actions when online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0 && !isSyncing) {
      syncOfflineActions();
    }
  }, [isOnline, pendingActions.length, isSyncing]);

  const addOfflineAction = (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    const updatedActions = [...pendingActions, newAction];
    setPendingActions(updatedActions);
    localStorage.setItem('offline-actions', JSON.stringify(updatedActions));
  };

  const syncOfflineActions = async () => {
    if (isSyncing || pendingActions.length === 0) return;

    setIsSyncing(true);
    const successfulActions: string[] = [];

    try {
      for (const action of pendingActions) {
        try {
          // Type-safe table operations for known tables only
          switch (action.table) {
            case 'user_cards':
              if (action.type === 'create') {
                await supabase.from('user_cards').insert(action.data);
              } else if (action.type === 'update') {
                await supabase.from('user_cards')
                  .update(action.data.updates)
                  .eq('id', action.data.id);
              } else if (action.type === 'delete') {
                await supabase.from('user_cards').delete().eq('id', action.data.id);
              }
              break;
            case 'card_field_values':
              if (action.type === 'create') {
                await supabase.from('card_field_values').insert(action.data);
              } else if (action.type === 'update') {
                await supabase.from('card_field_values')
                  .update(action.data.updates)
                  .eq('id', action.data.id);
              } else if (action.type === 'delete') {
                await supabase.from('card_field_values').delete().eq('id', action.data.id);
              }
              break;
            case 'family_units':
              if (action.type === 'create') {
                await supabase.from('family_units').insert(action.data);
              } else if (action.type === 'update') {
                await supabase.from('family_units')
                  .update(action.data.updates)
                  .eq('id', action.data.id);
              } else if (action.type === 'delete') {
                await supabase.from('family_units').delete().eq('id', action.data.id);
              }
              break;
            default:
              console.warn(`Unsupported table for offline sync: ${action.table}`);
              continue;
          }
          successfulActions.push(action.id);
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
        }
      }

      // Remove successful actions
      const remainingActions = pendingActions.filter(
        action => !successfulActions.includes(action.id)
      );
      
      setPendingActions(remainingActions);
      localStorage.setItem('offline-actions', JSON.stringify(remainingActions));

      if (successfulActions.length > 0) {
        toast({
          title: "Sync complete",
          description: `${successfulActions.length} offline changes synced successfully`,
        });
      }

    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync failed",
        description: "Some offline changes couldn't be synced",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    pendingActions: pendingActions.length,
    isSyncing,
    addOfflineAction,
    syncOfflineActions,
  };
};