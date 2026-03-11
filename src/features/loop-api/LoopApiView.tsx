import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Checkbox } from '@/components/common/Checkbox';
import { Badge } from '@/components/common/Badge';
import { Play, RotateCcw, Send, Terminal, Settings2, AlertCircle, Copy, Check, Trash2, RotateCw } from 'lucide-react';
import { parseCurl, type ParsedCurl } from './utils/curl-parser';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { History, LayoutDashboard, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface FieldConfig {
  key: string;
  value: unknown;
  enabled: boolean;
  generator: 'none' | 'random_string' | 'random_number' | 'random_uuid' | 'timestamp' | 'random_phone' | 'random_email';
}

interface RequestResult {
  index: number;
  status: number | string;
  success: boolean;
  data: unknown;
  timestamp: string;
}

interface ApiLog {
  id: string;
  created_at: string;
  url: string;
  method: string;
  headers: unknown;
  payload: unknown;
  response_status: string;
  response_data: unknown;
  success: boolean;
}

export const LoopApiView: React.FC = () => {
  const [curlInput, setCurlInput] = useState('');
  const [loopCount, setLoopCount] = useState(1);
  const [parsedData, setParsedData] = useState<ParsedCurl | null>(null);
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([]);
  const [results, setResults] = useState<RequestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editableHeaders, setEditableHeaders] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'tester' | 'history'>('tester');
  const [historyItems, setHistoryItems] = useState<ApiLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const handleParse = () => {
    try {
      if (!curlInput.trim()) return;
      
      const parsed = parseCurl(curlInput);
      setParsedData(parsed);
      setEditableHeaders(parsed.headers);
      setError(null);
      
      if (parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data)) {
        const configs: FieldConfig[] = Object.entries(parsed.data).map(([key, value]) => ({
          key,
          value,
          enabled: false,
          generator: 'none',
        }));
        setFieldConfigs(configs);
      } else {
        setFieldConfigs([]);
      }
      toast.success('CURL parsed successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid CURL format';
      setError(msg);
      toast.error(msg);
    }
  };

  const generateValue = (config: FieldConfig) => {
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
      // Use record type for payload to avoid index errors
      const payload: Record<string, unknown> = { 
        ...(typeof parsedData.data === 'object' && parsedData.data !== null ? (parsedData.data as Record<string, unknown>) : {}) 
      };
      
      fieldConfigs.forEach(config => {
        if (config.enabled) {
          payload[config.key] = generateValue(config);
        }
      });

      try {
        let requestUrl = parsedData.url;
        const finalHeaders = { ...editableHeaders };
        
        try {
          const urlObj = new URL(requestUrl);
          // If the target origin is different from our current origin, use our dynamic proxy
          if (urlObj.origin !== window.location.origin) {
            finalHeaders['x-target-origin'] = urlObj.origin;
            requestUrl = `/proxy${urlObj.pathname}${urlObj.search}`;
            console.log(`[Proxy] Routing request to: ${urlObj.origin}${urlObj.pathname}`);
          }
        } catch {
          // If URL is relative or invalid, we leave it as is
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
          // Remove content-type to let axios/browser set it with correct boundary
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
        };
        newResults.unshift(result);
        setResults([...newResults]);
        
        // Log to Supabase background
        logToSupabase(requestUrl, parsedData.method, editableHeaders, payload, response.status, response.data, true);
      } catch (err: unknown) {
        let errorStatus: string | number = 'ERROR';
        let errorData: unknown = 'Something went wrong';
        
        if (axios.isAxiosError(err)) {
          if (!err.response) {
            errorStatus = 'CORS/NET ERROR';
            errorData = {
              error: 'CORS Blocked or Connection Refused',
              suggestion: 'หากยิง API ข้าม Domain แนะนำให้ติดตั้ง Extension "Allow CORS" บน Chrome หรือใช้ Proxy ที่เตรียมไว้ให้',
              hint: 'สำหรับ ATP30 ระบบจะพยายามเข้ารูท Proxy (/api หรือ /admin-api) ให้โดยอัตโนมัติ'
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
        };
        newResults.unshift(result);
        setResults([...newResults]);
        
        // Log to Supabase background (re-extracting requestUrl or passed down)
        logToSupabase(parsedData.url, parsedData.method, editableHeaders, payload, errorStatus, errorData, false);
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

  const fetchHistory = async () => {
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
  };

  React.useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const loadHistoryItem = (item: ApiLog) => {
    setParsedData({
      url: item.url,
      method: item.method,
      headers: item.headers as Record<string, string>,
      data: item.payload,
    });
    setEditableHeaders(item.headers as Record<string, string>);
    
    if (item.payload && typeof item.payload === 'object' && !Array.isArray(item.payload)) {
      const configs: FieldConfig[] = Object.entries(item.payload).map(([k, v]) => ({
        key: k,
        value: v,
        enabled: false,
        generator: 'none',
      }));
      setFieldConfigs(configs);
    } else {
      setFieldConfigs([]);
    }
    
    setActiveTab('tester');
    toast.success('Loaded history item into tester');
  };

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

  const updateFieldConfig = (key: string, updates: Partial<FieldConfig>) => {
    setFieldConfigs(prev => prev.map(f => f.key === key ? { ...f, ...updates } : f));
  };

  const copyToClipboard = () => {
    const text = JSON.stringify(results, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-6xl animate-in fade-in duration-700">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Loop API Tester
          </h1>
          <p className="text-muted-foreground font-medium">ยิง Loop API เพื่อสร้างข้อมูลทดสอบด้วยการ Config payload ได้ตามต้องการ</p>
        </div>
        
        <div className="flex items-center bg-secondary/30 p-1 rounded-xl border border-border/50">
          <button
            onClick={() => setActiveTab('tester')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'tester' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Tester
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'history' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        {activeTab === 'tester' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Left Side: Configuration */}
            <div className="space-y-6 flex flex-col">
              <Card className="glow-card overflow-hidden transition-all duration-300 flex-1 flex flex-col">
                <div className="h-1 bg-primary/10 w-full relative shrink-0">
                   {isRunning && (
                     <div 
                       className="progress-bar-fill" 
                       style={{ width: `${progress}%` }} 
                     />
                   )}
                </div>
                <CardHeader className="shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-primary" />
                Input CURL command
              </CardTitle>
              <CardDescription>วาง CURL ที่คุณต้องการยิงซ้ำที่นี่</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
<Textarea
  value={curlInput}
  onChange={(e) => setCurlInput(e.target.value)}
  placeholder="curl --location 'https://api.example.com/...' \"
  className="h-40 font-mono"
/>
              <Button onClick={handleParse} className="w-full" variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Parse CURL
              </Button>
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md flex flex-col gap-1 mt-auto">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4" />
                    Parse Error
                  </div>
                  <p className="opacity-90">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {parsedData && (
            <Card className="animate-in slide-in-from-bottom-5 duration-500 delay-75">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-primary" />
                  Request Headers
                </CardTitle>
                <CardDescription>ตรวจสอบและแก้ไข Header สำหรับการเรียก API</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries(editableHeaders).map(([key, value]) => (
                    <div key={key} className="flex gap-2 items-start p-2 rounded bg-secondary/20 border border-border/30">
                      <div className="flex-1 space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{key}</p>
                        <Input
                          value={value}
                          onChange={(e) => setEditableHeaders(prev => ({ ...prev, [key]: e.target.value }))}
                          className="h-7 text-xs bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                    </div>
                  ))}
                  {Object.keys(editableHeaders).length === 0 && (
                    <p className="text-xs text-center py-4 text-muted-foreground italic">No headers found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {fieldConfigs.length > 0 && (
            <Card className="animate-in slide-in-from-bottom-5 duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" />
                  Payload Config
                </CardTitle>
                <CardDescription>เลือกฟิลด์ที่ต้องการให้ระบบช่วย Generate ข้อมูลใหม่ทุกรอบ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {fieldConfigs.map((field) => (
                    <div key={field.key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center shrink-0">
                          <Checkbox
                            checked={field.enabled}
                            onChange={(e) => updateFieldConfig(field.key, { enabled: (e.target as HTMLInputElement).checked })}
                          />
                        </div>
                        <div className="flex-1 flex flex-col gap-1 ml-3 min-w-0">
                          <p className="text-[10px] font-bold text-primary/70 uppercase tracking-tighter leading-none">{field.key}</p>
                          <Input
                            value={field.value?.toString() || ''}
                            onChange={(e) => updateFieldConfig(field.key, { value: e.target.value })}
                            className="h-7 text-xs bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/30 font-medium h-auto"
                            placeholder="Value..."
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {field.enabled && (
                          <select
                            value={field.generator}
                            onChange={(e) => updateFieldConfig(field.key, { generator: e.target.value as FieldConfig['generator'] })}
                            className="text-[10px] h-7 bg-background border border-input rounded-md px-1 outline-none text-muted-foreground focus:border-primary/50 transition-colors"
                            aria-label={`Select generator for ${field.key}`}
                          >
                            <option value="none">Fixed Value</option>
                            <option value="random_string">Random String</option>
                            <option value="random_number">Random Number</option>
                            <option value="random_uuid">Random UUID</option>
                            <option value="timestamp">Timestamp</option>
                            <option value="random_phone">Phone (TH)</option>
                            <option value="random_email">Email (@atp30)</option>
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

            </CardContent>
          </Card>
        )}

        {parsedData && (
          <Card className="animate-in slide-in-from-bottom-5 duration-500 delay-150 shadow-sm border-border/50">
            <CardHeader className="shrink-0 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" />
                Execution Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Loop Count</p>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={loopCount}
                    onChange={(e) => setLoopCount(parseInt(e.target.value) || 1)}
                    className="h-9 bg-secondary/20"
                  />
                </div>
                <Button
                  onClick={executeLoop}
                  disabled={isRunning || !parsedData}
                  className="flex-[1.5] mt-auto h-9 shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isRunning ? (
                    <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {isRunning ? `Running ${progress}%` : "Run Loop"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        </div>

        {/* Right Side: Results */}
        <div className="space-y-6 flex flex-col">
          <Card className="h-full flex flex-col shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between shrink-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Execution Logs
                </CardTitle>
                <CardDescription>ผลลัพธ์จากการยิง API แต่ละรอบ</CardDescription>
              </div>
                <div className="flex items-center gap-2">
                  {results.length > 0 && (
                    <>
                      <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8">
                        {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? 'Copied' : 'Copy All'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setResults([]); setProgress(0); }} className="h-8">
                        Clear
                      </Button>
                    </>
                  )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 py-20">
                  <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center animate-pulse">
                    <Terminal className="w-10 h-10 text-primary/40" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-lg font-semibold text-foreground/70">Wating for input...</p>
                    <p className="text-sm">วาง CURL และกด "Parse CURL" เพื่อเริ่มตั้งค่า</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 h-full overflow-y-auto pr-2 custom-scrollbar pb-6">
                  {results.map((res) => (
                    <div
                      key={res.index}
                      className={cn(
                        "p-4 rounded-xl border transition-all animate-in slide-in-from-right-5",
                        res.success ? "bg-green-500/5 border-green-500/20" : "bg-destructive/5 border-destructive/20"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={res.success ? 'success' : 'destructive'}>
                            Round #{res.index}
                          </Badge>
                          <span className="text-sm font-medium">Status: {res.status}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{res.timestamp}</span>
                      </div>
                      <pre className="text-[10px] font-mono p-3 bg-secondary/50 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-40 border border-border">
                        {JSON.stringify(res.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent History
                </CardTitle>
                <CardDescription>ประวัติการยิง API 20 รายการล่าสุดที่เก็บไว้ใน Supabase</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="flex justify-center py-20">
                    <RotateCcw className="w-8 h-8 animate-spin text-primary/40" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historyItems.map((item) => (
                      <div key={item.id} className="p-4 rounded-xl border bg-secondary/10 border-border/50 hover:border-primary/30 transition-all group">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Badge variant={item.success ? 'success' : 'destructive'}>
                              {item.method}
                            </Badge>
                            <span className="text-sm font-mono truncate max-w-md bg-secondary px-2 py-0.5 rounded">
                              {item.url}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => loadHistoryItem(item)}
                              className="h-8 gap-1.5"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                              Use
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteHistoryItem(item.id)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                            <span className="text-xs text-muted-foreground ml-2">
                              {new Date(item.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Payload</p>
                            <pre className="text-[10px] p-3 bg-secondary/50 rounded-lg overflow-x-auto max-h-32 border border-border">
                              {JSON.stringify(item.payload, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Response ({item.response_status})</p>
                            <pre className="text-[10px] p-3 bg-secondary/50 rounded-lg overflow-x-auto max-h-32 border border-border">
                              {JSON.stringify(item.response_data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                    {historyItems.length === 0 && (
                      <div className="text-center py-20 text-muted-foreground">
                        <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No history found in database</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
