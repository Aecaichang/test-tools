import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Checkbox } from '@/components/common/Checkbox';
import { Badge } from '@/components/common/Badge';
import { Select, type SelectOption } from '@/components/common/Select';
import { Terminal, RotateCcw, Settings2, AlertCircle, Database, Search, Zap, Trash2, Globe, Sparkles } from 'lucide-react';
import { ParsedCurl } from '../utils/curl-parser';
import { FieldConfig } from '../types';
import { cn } from '@/lib/utils';

interface TesterPanelProps {
  curlInput: string;
  setCurlInput: (val: string) => void;
  onParse: () => void;
  error: string | null;
  isRunning: boolean;
  progress: number;
  parsedData: ParsedCurl | null;
  editableHeaders: Record<string, string>;
  setEditableHeaders: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  fieldConfigs: FieldConfig[];
  updateFieldConfig: (key: string, updates: Partial<FieldConfig>) => void;
  removeFieldConfig: (key: string, location: 'payload' | 'query') => void;
  useProxy: boolean;
  setUseProxy: (val: boolean) => void;
}

const GENERATOR_OPTIONS: SelectOption[] = [
  { value: 'none', label: 'Fixed Value' },
  { value: 'random_string', label: 'Random String' },
  { value: 'random_number', label: 'Random Number' },
  { value: 'random_uuid', label: 'Random UUID' },
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'random_phone', label: 'Phone (TH)' },
  { value: 'random_email', label: 'Email (@example)' },
];

export const TesterPanel: React.FC<TesterPanelProps> = ({
  curlInput,
  setCurlInput,
  onParse,
  error,
  isRunning,
  progress,
  parsedData,
  editableHeaders,
  setEditableHeaders,
  fieldConfigs,
  updateFieldConfig,
  removeFieldConfig,
  useProxy,
  setUseProxy,
}) => {
  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* CURL Input Section */}
      <Card className="glow-card overflow-hidden transition-all duration-300 flex-1 flex flex-col group border-primary/20 shadow-md">
        <div className="h-1.5 bg-secondary w-full relative shrink-0 overflow-hidden">
          {isRunning && (
            <div 
              className="progress-bar-fill shadow-[0_0_15px_rgba(59,130,246,0.6)]" 
              style={{ "--progress-width": `${progress}%` } as React.CSSProperties}
            />
          )}
        </div>
        <CardHeader className="shrink-0 pb-6 pt-6 px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2.5 text-xl font-black group-hover:text-primary transition-colors">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Terminal className="w-5 h-5" />
                </div>
                Input CURL command
              </CardTitle>
              <CardDescription className="font-medium">วาง CURL ที่คุณต้องการยิงซ้ำที่นี่</CardDescription>
            </div>
            
            <div className="flex items-center gap-2 bg-secondary/20 p-1 rounded-2xl border border-border/50 shadow-sm self-start sm:self-center">
              <div className="flex items-center gap-2 px-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  useProxy ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30"
                )} />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Proxy</span>
              </div>
              <div className="flex items-center bg-background rounded-xl border border-border/20 shadow-sm overflow-hidden p-0.5">
                <button
                  onClick={() => setUseProxy(true)}
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-black transition-all flex items-center gap-2 rounded-lg",
                    useProxy ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <Globe className="w-3 h-3" />
                  ON
                </button>
                <button
                  onClick={() => setUseProxy(false)}
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-black transition-all rounded-lg",
                    !useProxy ? "bg-destructive/10 text-destructive" : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  OFF
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-5 px-6 pb-8">
          <div className="relative group/textarea">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-0 group-hover/textarea:opacity-100 transition duration-500" />
            <div className="relative">
              <Textarea
                value={curlInput}
                onChange={(e) => setCurlInput(e.target.value)}
                placeholder="curl --location 'https://api.example.com/...' \"
                className="h-52 font-mono text-[11px] bg-background border-border/40 focus:border-primary/50 resize-none transition-all duration-300 rounded-2xl p-5 leading-relaxed shadow-inner"
                disabled={isRunning}
              />
              {!curlInput && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-[0.03] select-none">
                  <Terminal className="w-24 h-24 mb-4" />
                  <p className="text-sm font-black tracking-widest uppercase">Waiting for Input</p>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            onClick={onParse} 
            className="w-full h-12 shadow-md transition-all active:scale-[0.98] font-bold text-sm rounded-xl overflow-hidden relative group" 
            variant="default" 
            disabled={isRunning}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-foreground/10 opacity-0 group-hover:opacity-10 transition-opacity" />
            <RotateCcw className={cn("w-4 h-4 mr-2", isRunning && "animate-spin")} />
            Parse & Extract Parameters
          </Button>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl flex flex-row items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="p-1 rounded-lg bg-destructive/10 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-xs uppercase tracking-widest">Parse Error</p>
                <p className="text-xs opacity-90 leading-relaxed font-medium">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Headers Section */}
      {parsedData && (
        <Card className="animate-in slide-in-from-bottom-5 duration-500 delay-75 border-border shadow-sm rounded-3xl overflow-hidden">
          <div className="h-1 bg-primary/20 w-full" />
          <CardHeader className="pb-4 px-6 pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2.5 text-base font-black">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  Request Headers
                </CardTitle>
                <CardDescription className="text-[11px] font-medium">แก้ไข Header สำหรับการเรียก API ในแต่ละรอบ</CardDescription>
              </div>
              <Badge variant="outline" className="font-bold bg-secondary/20">{Object.keys(editableHeaders).length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar p-1">
              {Object.entries(editableHeaders).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-secondary/10 border border-border/30 hover:border-primary/20 hover:bg-background transition-all group shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest group-hover:text-primary transition-colors leading-none truncate pr-4">{key}</p>
                  </div>
                  <Input
                    value={value}
                    onChange={(e) => setEditableHeaders(prev => ({ ...prev, [key]: e.target.value }))}
                    className="h-7 text-[11px] bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-bold text-foreground/80"
                    disabled={isRunning}
                    placeholder="Enter header value..."
                  />
                </div>
              ))}
              {Object.keys(editableHeaders).length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/40 gap-2">
                   <Terminal className="w-8 h-8 opacity-10" />
                   <p className="text-xs font-medium italic">No headers detected</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parameters Config Section */}
      {fieldConfigs.length > 0 && (
        <Card className="animate-in slide-in-from-bottom-5 duration-500 border-primary/10 relative z-20 shadow-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-5 px-8 pt-8 bg-gradient-to-b from-primary/[0.03] to-transparent border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-3 text-xl font-black">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 shadow-sm">
                    <Settings2 className="w-5 h-5" />
                  </div>
                  Dynamic Parameters
                </CardTitle>
                <CardDescription className="font-medium">กำหนดค่าสุ่มหรือระบุค่าคงที่สำหรับแต่ละชุดการทดสอบ</CardDescription>
              </div>
              <Badge className="bg-primary text-primary-foreground font-black px-3 py-1 rounded-full shadow-lg shadow-primary/20">{fieldConfigs.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/20">
              {fieldConfigs.map((field, index) => (
                <div 
                  key={`${field.location}-${field.key}`} 
                  className={cn(
                    "flex flex-col gap-4 p-6 transition-all duration-300",
                    field.enabled ? "bg-primary/[0.02] border-l-4 border-l-primary" : "hover:bg-secondary/10 border-l-4 border-l-transparent"
                  )}
                  style={{ zIndex: fieldConfigs.length - index, position: 'relative' }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 group/row">
                    <div className="flex items-start gap-5 flex-1 min-w-0">
                      <div className="pt-2">
                        <Checkbox
                          checked={field.enabled}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFieldConfig(field.key, { enabled: e.target.checked })}
                          disabled={isRunning}
                          className="w-6 h-6 rounded-lg border-2"
                        />
                      </div>
                      
                      <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-[13px] font-black text-foreground truncate max-w-[200px]">
                            {field.key}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-[9px] py-0.5 px-2.5 font-black uppercase h-5 tracking-widest border-0 rounded-full",
                              field.location === 'query' ? "bg-amber-500/10 text-amber-600" : "bg-blue-500/10 text-blue-600"
                            )}
                          >
                            {field.location === 'query' ? <Search className="w-3 h-3 mr-1.5" /> : <Database className="w-3 h-3 mr-1.5" />}
                            {field.location}
                          </Badge>
                        </div>
                        <Input
                          value={field.value?.toString() || ''}
                          onChange={(e) => updateFieldConfig(field.key, { value: e.target.value })}
                          className={cn(
                            "h-7 text-xs bg-secondary/20 border-border/20 px-3 rounded-lg focus:bg-background transition-all font-mono",
                            field.enabled ? "opacity-30 cursor-not-allowed select-none" : "opacity-100"
                          )}
                          placeholder="Default value if not enabled..."
                          disabled={isRunning || field.enabled}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0 justify-end">
                      <div className="w-[180px]">
                        {field.enabled ? (
                          <div className="animate-in slide-in-from-right-4 duration-300">
                            <Select
                              value={field.generator}
                              onChange={(val) => updateFieldConfig(field.key, { generator: val as FieldConfig['generator'] })}
                              options={GENERATOR_OPTIONS}
                              disabled={isRunning}
                            />
                          </div>
                        ) : (
                          <div className="h-10 flex items-center justify-end px-4 text-[11px] text-muted-foreground font-bold italic opacity-30">
                            Manual Entry
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-10 h-10 rounded-xl text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/row:opacity-100 transition-all active:scale-90"
                        onClick={() => removeFieldConfig(field.key, field.location)}
                        disabled={isRunning}
                      >
                        <Trash2 className="w-4 h-4" /> 
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {fieldConfigs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/30 gap-4">
                <div className="p-5 rounded-full bg-secondary/30 relative overflow-hidden">
                   <Settings2 className="w-12 h-12 opacity-20 relative z-10" />
                   <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                   <p className="text-sm font-black tracking-widest uppercase">No parameters detected</p>
                   <p className="text-xs font-medium">Try parsing a CURL with query params or JSON body</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
