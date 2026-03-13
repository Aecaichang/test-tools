import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { parseCurl, type ParsedCurl } from '../utils/curl-parser';
import { type FieldConfig } from '../types';

export const useCurlParser = () => {
  const [curlInput, setCurlInput] = useState('');
  const [parsedData, setParsedData] = useState<ParsedCurl | null>(null);
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([]);
  const [editableHeaders, setEditableHeaders] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleParse = useCallback((inputOverride?: string) => {
    const input = inputOverride ?? curlInput;
    try {
      if (!input.trim()) return;
      
      const parsed = parseCurl(input);
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
      if (!inputOverride) {
        toast.success('CURL parsed successfully' + (newConfigs.length > 0 ? ` with ${newConfigs.length} parameters` : ''));
      }
      return { parsed, newConfigs, headers: parsed.headers };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid CURL format';
      setError(msg);
      if (!inputOverride) toast.error(msg);
      return null;
    }
  }, [curlInput]);

  const updateFieldConfig = useCallback((key: string, updates: Partial<FieldConfig>) => {
    setFieldConfigs(prev => prev.map(f => f.key === key ? { ...f, ...updates } : f));
  }, []);

  const removeFieldConfig = useCallback((key: string, location: 'payload' | 'query') => {
    setFieldConfigs(prev => prev.filter(f => !(f.key === key && f.location === location)));
    toast.success(`Removed ${location} parameter: ${key}`);
  }, []);

  return {
    curlInput,
    setCurlInput,
    parsedData,
    setParsedData,
    fieldConfigs,
    setFieldConfigs,
    editableHeaders,
    setEditableHeaders,
    error,
    setError,
    handleParse,
    updateFieldConfig,
    removeFieldConfig
  };
};
