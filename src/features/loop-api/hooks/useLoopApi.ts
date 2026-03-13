import { useState, useCallback } from 'react';
import { useCurlParser } from './useCurlParser';
import { useApiHistory } from './useApiHistory';
import { useApiExecutor } from './useApiExecutor';
import { type ApiLog, type FieldConfig } from '../types';

export const useLoopApi = () => {
  const [useProxy, setUseProxy] = useState(true);

  const {
    curlInput, setCurlInput,
    parsedData, setParsedData,
    fieldConfigs, setFieldConfigs,
    editableHeaders, setEditableHeaders,
    error,
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
    results,
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
    
    const newConfigs: FieldConfig[] = [];
    try {
      const url = new URL(item.url);
      url.searchParams.forEach((v, k) => {
        newConfigs.push({ key: k, value: v as string, enabled: false, generator: 'none', location: 'query' });
      });
    } catch (error) {
      console.warn('Could not parse URL for history item:', error);
    }

    if (item.payload && typeof item.payload === 'object' && !Array.isArray(item.payload)) {
      Object.entries(item.payload).forEach(([k, v]) => {
        newConfigs.push({ key: k, value: v, enabled: false, generator: 'none', location: 'payload' });
      });
    }
    setFieldConfigs(newConfigs);
  }, [setParsedData, setEditableHeaders, setFieldConfigs]);

  return {
    curlInput, setCurlInput,
    parsedData, fieldConfigs,
    error, editableHeaders, setEditableHeaders,
    handleParse, updateFieldConfig, removeFieldConfig,
    loopCount, setLoopCount,
    results, isRunning,
    progress, clearResults, executeLoop,
    useProxy, setUseProxy,
    historyItems, isLoadingHistory,
    fetchHistory, deleteHistoryItem,
    deleteAllHistory, loadHistoryItem
  };
};
