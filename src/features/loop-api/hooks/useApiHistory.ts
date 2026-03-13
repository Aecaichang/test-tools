import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { type ApiLog } from '../types';

export const useApiHistory = () => {
  const [historyItems, setHistoryItems] = useState<ApiLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('api_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setHistoryItems(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const logToSupabase = useCallback(async (
    url: string, 
    method: string, 
    headers: Record<string, string>, 
    payload: unknown, 
    status: string | number, 
    response: unknown, 
    success: boolean
  ) => {
    try {
      await supabase.from('api_logs').insert({
        url,
        method,
        headers,
        payload,
        response_status: status.toString(),
        response_data: response,
        success
      });
    } catch (err) {
      console.error('Failed to log to Supabase:', err);
    }
  }, []);

  const deleteHistoryItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('api_logs').delete().eq('id', id);
      if (error) throw error;
      setHistoryItems(prev => prev.filter(item => item.id !== id));
      toast.success('History item deleted');
    } catch (err) {
      toast.error('Failed to delete history item');
      console.error(err);
    }
  }, []);

  const deleteAllHistory = useCallback(async () => {
    try {
      const { error } = await supabase.from('api_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
      if (error) throw error;
      setHistoryItems([]);
      toast.success('All history records deleted successfully');
    } catch (err) {
      toast.error('Failed to delete all history records');
      console.error(err);
    }
  }, []);

  return {
    historyItems,
    setHistoryItems,
    isLoadingHistory,
    fetchHistory,
    logToSupabase,
    deleteHistoryItem,
    deleteAllHistory
  };
};
