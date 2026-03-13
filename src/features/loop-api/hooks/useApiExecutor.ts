import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { type FieldConfig, type RequestResult } from '../types';
import { type ParsedCurl } from '../utils/curl-parser';

interface ExecutorParams {
  parsedData: ParsedCurl | null;
  fieldConfigs: FieldConfig[];
  editableHeaders: Record<string, string>;
  useProxy: boolean;
  onLog: (url: string, method: string, headers: Record<string, string>, payload: unknown, status: string | number, response: unknown, success: boolean) => void;
}

export const useApiExecutor = ({
  parsedData,
  fieldConfigs,
  editableHeaders,
  useProxy,
  onLog
}: ExecutorParams) => {
  const [loopCount, setLoopCount] = useState(1);
  const [results, setResults] = useState<RequestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

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

  const clearResults = useCallback(() => {
    setResults([]);
    setProgress(0);
  }, []);

  const executeLoop = async () => {
    if (!parsedData) return;
    setIsRunning(true);
    setResults([]);
    setProgress(0);

    const newResults: RequestResult[] = [];
    toast.info(`Starting execution of ${loopCount} requests...`);

    for (let i = 0; i < loopCount; i++) {
      const payload: Record<string, unknown> = { 
        ...(typeof parsedData.data === 'object' && parsedData.data !== null ? (parsedData.data as Record<string, unknown>) : {}) 
      };
      
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
        
        onLog(finalUrl, parsedData.method, editableHeaders, payload, response.status, response.data, true);
      } catch (err: unknown) {
        let errorStatus: string | number = 'ERROR';
        let errorData: unknown = 'Something went wrong';
        
        if (axios.isAxiosError(err)) {
          if (!err.response) {
            errorStatus = 'CORS/NET ERROR';
            errorData = {
              error: 'CORS Blocked or Connection Refused',
              suggestion: 'แนะนำใช้ Proxy ที่เตรียมไว้ให้ หรือติดตั้ง extension Allow CORS',
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
        
        onLog(finalUrl, parsedData.method, editableHeaders, payload, errorStatus, errorData, false);
      }
      setProgress(Math.round(((i + 1) / loopCount) * 100));
    }
    
    setIsRunning(false);
    const successCount = newResults.filter(r => r.success).length;
    if (newResults.length > 0) {
      if (successCount === newResults.length) {
        toast.success(`Completed! All ${successCount} requests succeeded.`);
      } else {
        toast.warning(`Completed: ${successCount} success, ${newResults.length - successCount} failed.`);
      }
    }
  };

  return {
    loopCount,
    setLoopCount,
    results,
    setResults,
    isRunning,
    progress,
    executeLoop,
    clearResults
  };
};
