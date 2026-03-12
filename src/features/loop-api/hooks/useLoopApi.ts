import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { parseCurl, type ParsedCurl } from '../utils/curl-parser';
import { type FieldConfig, type RequestResult, type ApiLog } from '../types';

export const useLoopApi = () => {
  // --- Tester State ---
  const [curlInput, setCurlInput] = useState('');
  const [loopCount, setLoopCount] = useState(1);
  const [parsedData, setParsedData] = useState<ParsedCurl | null>(null);
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([]);
  const [results, setResults] = useState<RequestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [editableHeaders, setEditableHeaders] = useState<Record<string, string>>({});
  const [useProxy, setUseProxy] = useState(true);

  // --- History State ---
  const [historyItems, setHistoryItems] = useState<ApiLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const handleParse = useCallback(() => {
    try {
      if (!curlInput.trim()) return;
      
      const parsed = parseCurl(curlInput);
      setParsedData(parsed);
      setEditableHeaders(parsed.headers);
      setError(null);
      
      const newConfigs: FieldConfig[] = [];

      // 1. Extract Query Parameters
      try {
        const url = new URL(parsed.url);
        url.searchParams.forEach((value, key) => {
          newConfigs.push({
            key,
            value,
            enabled: false,
            generator: 'none',
            location: 'query'
          });
        });
      } catch (e) {
        console.warn('Could not parse URL for query params', e);
      }

      // 2. Extract Payload Parameters
      if (parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data)) {
        Object.entries(parsed.data).forEach(([key, value]) => {
          newConfigs.push({
            key,
            value,
            enabled: false,
            generator: 'none',
            location: 'payload'
          });
        });
      }

      setFieldConfigs(newConfigs);
      toast.success('CURL parsed successfully' + (newConfigs.length > 0 ? ` with ${newConfigs.length} parameters` : ''));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid CURL format';
      setError(msg);
      toast.error(msg);
    }
  }, [curlInput]);

  const generateValue = useCallback((config: FieldConfig) => {
    switch (config.generator) {
      case 'random_string':
        return `demo_${Math.random().toString(36).substring(2, 8)}`;
      case 'random_number':
        return Math.floor(Math.random() * 10000);
      case 'random_uuid':
        return self.crypto.randomUUID();
      case 'timestamp':
        return Date.now();
      case 'random_phone':
        return `09${Math.floor(Math.random() * 90000000 + 10000000)}`;
      case 'random_email':
        return `user_${Math.random().toString(36).substring(7)}@example.com`;
      default:
        return config.value;
    }
  }, []);

  const logToSupabase = async (url: string, method: string, headers: Record<string, string>, payload: unknown, status: string | number, response: unknown, success: boolean) => {
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
  };

  const executeLoop = async () => {
    if (!parsedData) return;
    setIsRunning(true);
    setResults([]);
    setError(null);
    setProgress(0);

    const newResults: RequestResult[] = [];
    toast.info(`Starting execution of ${loopCount} requests...`);

    for (let i = 0; i < loopCount; i++) {
      // Prepare Payload
      const payload: Record<string, unknown> = { 
        ...(typeof parsedData.data === 'object' && parsedData.data !== null ? (parsedData.data as Record<string, unknown>) : {}) 
      };
      
      // Prepare URL/Query
      let finalUrl: string = parsedData.url;
      try {
        const urlObj = new URL(parsedData.url);
        fieldConfigs.forEach(config => {
          if (config.enabled) {
            const generated = generateValue(config);
            if (config.location === 'payload') {
              payload[config.key] = generated;
            } else {
              urlObj.searchParams.set(config.key, String(generated));
            }
          }
        });
        finalUrl = urlObj.toString();
      } catch (e) {
        console.warn('URL update failed', e);
      }

      const finalHeaders = { ...editableHeaders };
      const requestDetails = {
        url: finalUrl,
        method: parsedData.method,
        headers: { ...finalHeaders },
        payload: { ...payload }
      };

      try {
        let requestUrl = finalUrl;
        
        try {
          const urlObj = new URL(requestUrl);
          if (useProxy && urlObj.origin !== window.location.origin) {
            finalHeaders['x-target-origin'] = urlObj.origin;
            requestUrl = `/proxy${urlObj.pathname}${urlObj.search}`;
          }
        } catch {
          console.warn('Invalid or relative URL detected, skipping proxy logic');
        }

        const contentType = (finalHeaders['content-type'] || finalHeaders['Content-Type'] || '').toLowerCase();
        let requestData: unknown = payload;

        if (contentType.includes('multipart/form-data')) {
          const formData = new FormData();
          Object.entries(payload).forEach(([key, value]) => {
            formData.append(key, String(value));
          });
          requestData = formData;
          delete finalHeaders['content-type'];
          delete finalHeaders['Content-Type'];
        } else if (!contentType) {
          finalHeaders['Content-Type'] = 'application/json';
        }

        const response = await axios({
          method: parsedData.method,
          url: requestUrl,
          headers: finalHeaders,
          data: requestData,
          timeout: 15000,
        });

        const result: RequestResult = {
          index: i + 1,
          status: response.status,
          success: response.status >= 200 && response.status < 300,
          data: response.data,
          timestamp: new Date().toLocaleTimeString(),
          request: requestDetails
        };
        newResults.unshift(result);
        setResults([...newResults]);
        
        logToSupabase(finalUrl, parsedData.method, editableHeaders, payload, response.status, response.data, true);
      } catch (err: unknown) {
        let errorStatus: string | number = 'ERROR';
        let errorData: unknown = 'Something went wrong';
        
        if (axios.isAxiosError(err)) {
          if (!err.response) {
            errorStatus = 'CORS/NET ERROR';
            errorData = {
              error: 'CORS Blocked or Connection Refused',
              suggestion: 'หากยิง API ข้าม Domain แนะนำให้ติดตั้ง Extension "Allow CORS" บน Chrome หรือใช้ Proxy ที่เตรียมไว้ให้',
              hint: 'ระบบจะยิงผ่าน Dynamic Proxy ให้อัตโนมัติ'
            };
          } else {
            errorStatus = err.response.status;
            errorData = err.response.data;
          }
        }

        const result: RequestResult = {
          index: i + 1,
          status: errorStatus,
          success: false,
          data: errorData,
          timestamp: new Date().toLocaleTimeString(),
          request: requestDetails
        };
        newResults.unshift(result);
        setResults([...newResults]);
        
        logToSupabase(finalUrl, parsedData.method, editableHeaders, payload, errorStatus, errorData, false);
      }
      setProgress(Math.round(((i + 1) / loopCount) * 100));
    }
    
    setIsRunning(false);
    
    const successCount = newResults.filter(r => r.success).length;
    const failCount = newResults.length - successCount;
    
    if (failCount === 0) {
      toast.success(`Completed! All ${successCount} requests succeeded.`);
    } else {
      toast.warning(`Completed with issues: ${successCount} success, ${failCount} failed.`);
    }
  };

  const updateFieldConfig = (key: string, updates: Partial<FieldConfig>) => {
    setFieldConfigs(prev => prev.map(f => f.key === key ? { ...f, ...updates } : f));
  };

  const removeFieldConfig = (key: string, location: 'payload' | 'query') => {
    setFieldConfigs(prev => prev.filter(f => !(f.key === key && f.location === location)));
    toast.success(`Removed ${location} parameter: ${key}`);
  };

  const clearResults = () => {
    setResults([]);
    setProgress(0);
  };

  // --- History Logic ---
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

  const deleteHistoryItem = async (id: string) => {
    try {
      const { error } = await supabase.from('api_logs').delete().eq('id', id);
      if (error) throw error;
      setHistoryItems(prev => prev.filter(item => item.id !== id));
      toast.success('History item deleted');
    } catch (err) {
      toast.error('Failed to delete history item');
      console.error(err);
    }
  };

  const deleteAllHistory = async () => {
    try {
      const { error } = await supabase.from('api_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
      if (error) throw error;
      setHistoryItems([]);
      toast.success('All history records deleted successfully');
    } catch (err) {
      toast.error('Failed to delete all history records');
      console.error(err);
    }
  };

  const loadHistoryItem = (item: ApiLog) => {
    setParsedData({
      url: item.url,
      method: item.method,
      headers: item.headers as Record<string, string>,
      data: item.payload,
    });
    setEditableHeaders(item.headers as Record<string, string>);
    
    const newConfigs: FieldConfig[] = [];
    
    // Parse Query from History URL
    try {
      const url = new URL(item.url);
      url.searchParams.forEach((v, k) => {
        newConfigs.push({
          key: k,
          value: v,
          enabled: false,
          generator: 'none',
          location: 'query'
        });
      });
    } catch {
      // Ignore URL parse errors for relative paths
    }

    // Parse Payload from History
    if (item.payload && typeof item.payload === 'object' && !Array.isArray(item.payload)) {
      Object.entries(item.payload).forEach(([k, v]) => {
        newConfigs.push({
          key: k,
          value: v,
          enabled: false,
          generator: 'none',
          location: 'payload'
        });
      });
    }
    
    setFieldConfigs(newConfigs);
    toast.success('Loaded history item into tester');
  };

  return {
    // Tester
    curlInput, setCurlInput,
    loopCount, setLoopCount,
    parsedData, fieldConfigs,
    results, isRunning,
    progress, error,
    editableHeaders, setEditableHeaders,
    handleParse, executeLoop,
    updateFieldConfig, removeFieldConfig, clearResults,
    useProxy, setUseProxy,
    
    // History
    historyItems, isLoadingHistory,
    fetchHistory, deleteHistoryItem,
    deleteAllHistory, loadHistoryItem
  };
};
