import * as React from 'react';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Checkbox } from '@/components/common/Checkbox';
import { Badge } from '@/components/common/Badge';
import { Play, RotateCcw, Plus, Trash2, Send, Terminal, Settings2, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseCurl, type ParsedCurl } from './utils/curl-parser';
import axios from 'axios';
import { cn } from '@/lib/utils';

interface FieldConfig {
  key: string;
  value: any;
  enabled: boolean;
  generator: 'none' | 'random_string' | 'random_number' | 'random_uuid' | 'timestamp' | 'random_phone' | 'random_email';
}

interface RequestResult {
  index: number;
  status: number | string;
  success: boolean;
  data: any;
  timestamp: string;
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

  // ... (previous helper functions)

  const executeLoop = async () => {
    if (!parsedData) return;
    setIsRunning(true);
    setResults([]);
    setError(null);
    setProgress(0);

    const newResults: RequestResult[] = [];

    for (let i = 0; i < loopCount; i++) {
      const payload = { ...parsedData.data };
      
      fieldConfigs.forEach(config => {
        if (config.enabled) {
          payload[config.key] = generateValue(config);
        }
      });

      try {
        const response = await axios({
          method: parsedData.method,
          url: parsedData.url,
          headers: parsedData.headers,
          data: payload,
          timeout: 10000,
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
      } catch (err: unknown) {
        let errorStatus = 'ERROR';
        let errorData = 'Something went wrong';
        
        if (axios.isAxiosError(err)) {
          errorStatus = err.response?.status.toString() || 'NET_ERROR';
          errorData = err.response?.data || err.message;
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
      }
      setProgress(Math.round(((i + 1) / loopCount) * 100));
    }
    
    setIsRunning(false);
  };

  const copyToClipboard = () => {
    const text = JSON.stringify(results, null, 2);
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-6xl animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
          Loop API Tester
        </h1>
        <p className="text-muted-foreground">ยิง Loop API เพื่อสร้างข้อมูลทดสอบด้วยการ Config payload ได้ตามต้องการ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Configuration */}
        <div className="space-y-6">
          <Card className="glow-card overflow-hidden">
            <div className="h-1 bg-primary/10 w-full relative">
               {isRunning && (
                 <div 
                   className="h-full bg-primary transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                   style={{ width: `${progress}%` }} 
                 />
               )}
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-primary" />
                Input CURL command
              </CardTitle>
              <CardDescription>วาง CURL ที่คุณต้องการยิงซ้ำที่นี่</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={curlInput}
                onChange={(e) => setCurlInput(e.target.value)}
                placeholder="curl --location 'https://api.example.com/...' \"
                className="w-full h-40 bg-background/50 border border-input rounded-md p-3 text-sm font-mono focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              />
              <Button onClick={handleParse} className="w-full" variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Parse CURL
              </Button>
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* ...Rest of the component... */}


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
                    <div key={field.key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={field.enabled}
                          onChange={(e) => updateFieldConfig(field.key, { enabled: (e.target as any).checked })}
                        />
                        <div>
                          <p className="text-sm font-medium">{field.key}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{field.value.toString()}</p>
                        </div>
                      </div>
                      
                      {field.enabled && (
                        <select
                          value={field.generator}
                          onChange={(e) => updateFieldConfig(field.key, { generator: e.target.value as any })}
                          className="text-xs bg-background border border-input rounded px-2 py-1 outline-none"
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
                  ))}
                </div>

                <div className="pt-4 border-t border-border flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Loop Count</p>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={loopCount}
                      onChange={(e) => setLoopCount(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <Button
                    onClick={executeLoop}
                    disabled={isRunning || !parsedData}
                    className="flex-1 mt-6 h-10"
                  >
                    {isRunning ? (
                      <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Run Loop
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side: Results */}
        <div className="space-y-6">
          <Card className="min-h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Execution Logs
                </CardTitle>
                <CardDescription>ผลลัพธ์จากการยิง API แต่ละรอบ</CardDescription>
              </div>
              {results.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setResults([])}>
                  Clear
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                  </div>
                  <p>กด "Run Loop" เพื่อเริ่มการทดสอบ</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
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
                      <pre className="text-[10px] font-mono p-2 bg-background/50 rounded overflow-x-auto whitespace-pre-wrap max-h-32">
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
    </div>
  );
};
