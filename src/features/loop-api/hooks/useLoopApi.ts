import { useState, useCallback } from 'react';
import { useCurlParser } from './useCurlParser';
import { useApiHistory } from './useApiHistory';
import { useApiExecutor } from './useApiExecutor';
import { type ApiLog } from '../types';

export const useLoopApi = () => {
  const [useProxy, setUseProxy] = useState(true);

  const {
    curlInput, setCurlInput,
    parsedData, setParsedData,
    fieldConfigs, setFieldConfigs,
    editableHeaders, setEditableHeaders,
    error, setError,
    handleParse,
    updateFieldConfig,
    removeFieldConfig
  } = useCurlParser();

  const {
    historyItems,
    isLoadingHistory,
    fetchHistory,
    logToSupabase,
    deleteHistoryItem,
    deleteAllHistory
  } = useApiHistory();

  const {
    loopCount, setLoopCount,
    results, setResults,
    isRunning,
    progress,
    executeLoop,
    clearResults
  } = useApiExecutor({
    parsedData,
    fieldConfigs,
    editableHeaders,
    useProxy,
    onLog: logToSupabase
  });

  const loadHistoryItem = useCallback((item: ApiLog) => {
    setParsedData({
      url: item.url,
      method: item.method,
      headers: item.headers as Record<string, string>,
      data: item.payload,
    });
    setEditableHeaders(item.headers as Record<string, string>);
    
    // We can reuse the parse logic to extract field configs
    // But since we already have the payload, we can manually populate them or call a modified handleParse
    // Let's just manually populate to avoid side effects of handleParse toast
    const newConfigs: any[] = [];
    try {
      const url = new URL(item.url);
      url.searchParams.forEach((v, k) => {
        newConfigs.push({ key: k, value: v, enabled: false, generator: 'none', location: 'query' });
      });
    } catch {}

    if (item.payload && typeof item.payload === 'object' && !Array.isArray(item.payload)) {
      Object.entries(item.payload).forEach(([k, v]) => {
        newConfigs.push({ key: k, value: v, enabled: false, generator: 'none', location: 'payload' });
      });
    }
    setFieldConfigs(newConfigs);
  }, [setParsedData, setEditableHeaders, setFieldConfigs]);

  return {
    // Parser
    curlInput, setCurlInput,
    parsedData, fieldConfigs,
    error, editableHeaders, setEditableHeaders,
    handleParse, updateFieldConfig, removeFieldConfig,
    
    // Executor
    loopCount, setLoopCount,
    results, isRunning,
    progress, clearResults, executeLoop,
    useProxy, setUseProxy,
    
    // History
    historyItems, isLoadingHistory,
    fetchHistory, deleteHistoryItem,
    deleteAllHistory, loadHistoryItem
  };
};
