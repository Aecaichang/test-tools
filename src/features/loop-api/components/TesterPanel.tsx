import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Checkbox } from '@/components/common/Checkbox';
import { Badge } from '@/components/common/Badge';
import { Select, type SelectOption } from '@/components/common/Select';
import { Terminal, RotateCcw, Settings2, AlertCircle, Database, Search, Zap, Trash2 } from 'lucide-react';
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
}) => {
  return (
    <div className="space-y-6 flex flex-col">
      {/* CURL Input Section */}
      <Card className="glow-card overflow-hidden transition-all duration-300 flex-1 flex flex-col group border-primary/10">
        <div className="h-1 bg-primary/10 w-full relative shrink-0 overflow-hidden">
          {isRunning && (
            <div 
              className="progress-bar-fill shadow-[0_0_15px_rgba(59,130,246,0.6)]" 
              style={{ width: `${progress}%` }}
            />
          )}
        </div>
        <CardHeader className="shrink-0 pb-4">
          <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
            <Terminal className="w-5 h-5" />
            Input CURL command
          </CardTitle>
          <CardDescription>วาง CURL ที่คุณต้องการยิงซ้ำที่นี่</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="relative">
            <Textarea
              value={curlInput}
              onChange={(e) => setCurlInput(e.target.value)}
              placeholder="curl --location 'https://api.example.com/...' \"
              className="h-40 font-mono text-xs bg-secondary/10 border-border/40 focus:border-primary/50 resize-none transition-all duration-300"
              disabled={isRunning}
            />
            {!curlInput && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <Terminal className="w-12 h-12" />
              </div>
            )}
          </div>
          <Button 
            onClick={onParse} 
            className="w-full h-10 shadow-sm transition-all active:scale-95 active:bg-primary/90" 
            variant="outline" 
            disabled={isRunning}
          >
            <RotateCcw className={cn("w-4 h-4 mr-2", isRunning && "animate-spin")} />
            Parse CURL
          </Button>
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl flex flex-col gap-1 mt-auto animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4" />
                Parse Error
              </div>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Headers Section */}
      {parsedData && (
        <Card className="animate-in slide-in-from-bottom-5 duration-500 delay-75 border-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Terminal className="w-4 h-4 text-primary" />
              Request Headers
            </CardTitle>
            <CardDescription className="text-[11px]">ตรวจสอบและแก้ไข Header สำหรับการเรียก API</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar p-1">
              {Object.entries(editableHeaders).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1 p-2.5 rounded-xl bg-secondary/20 border border-border/30 hover:border-primary/20 transition-all group">
                  <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest group-hover:text-primary/70 transition-colors uppercase leading-none">{key}</p>
                  <Input
                    value={value}
                    onChange={(e) => setEditableHeaders(prev => ({ ...prev, [key]: e.target.value }))}
                    className="h-6 text-[11px] bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-medium"
                    disabled={isRunning}
                  />
                </div>
              ))}
              {Object.keys(editableHeaders).length === 0 && (
                <p className="text-xs text-center py-6 text-muted-foreground italic opacity-50">No headers found</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parameters Config Section */}
      {fieldConfigs.length > 0 && (
        <Card className="animate-in slide-in-from-bottom-5 duration-500 border-primary/10 overflow-hidden">
          <CardHeader className="pb-4 bg-secondary/5 border-b border-border/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="w-5 h-5 text-primary" />
              Parameters Config
            </CardTitle>
            <CardDescription>Configure dynamic values for your test</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30 max-h-[500px] overflow-y-auto custom-scrollbar">
              {fieldConfigs.map((field) => (
                <div 
                  key={`${field.location}-${field.key}`} 
                  className={cn(
                    "flex flex-col gap-3 p-4 transition-all duration-300",
                    field.enabled ? "bg-primary/[0.03] animate-pulse-subtle" : "hover:bg-secondary/20"
                  )}
                >
                  <div className="flex items-center justify-between gap-4 group/row">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex items-center group/check">
                        <Checkbox
                          checked={field.enabled}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFieldConfig(field.key, { enabled: e.target.checked })}
                          disabled={isRunning}
                          className="w-5 h-5 rounded-md border-2"
                        />
                      </div>
                      
                      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-foreground/80 lowercase truncate overflow-ellipsis max-w-full">
                            {field.key}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-[8px] py-0 px-1.5 font-bold uppercase h-4 tracking-tighter border-0",
                              field.location === 'query' ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                            )}
                          >
                            {field.location === 'query' ? <Search className="w-2.5 h-2.5 mr-1" /> : <Database className="w-2.5 h-2.5 mr-1" />}
                            {field.location}
                          </Badge>
                          {field.enabled && (
                            <Badge variant="success" className="text-[8px] h-4 py-0 px-1.5 bg-green-500/10 text-green-500 border-0 animate-in fade-in zoom-in-90">
                              <Zap className="w-2 h-2 mr-1 fill-current" />
                              Auto
                            </Badge>
                          )}
                        </div>
                        <Input
                          value={field.value?.toString() || ''}
                          onChange={(e) => updateFieldConfig(field.key, { value: e.target.value })}
                          className={cn(
                            "h-5 text-xs bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono transition-opacity",
                            field.enabled ? "opacity-40" : "opacity-100"
                          )}
                          placeholder="Default value..."
                          disabled={isRunning || field.enabled}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-[160px]">
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
                          <div className="h-8 flex items-center justify-end px-3 text-[10px] text-muted-foreground font-medium italic opacity-40">
                            Fixed value
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/row:opacity-100 transition-all active:scale-90"
                        onClick={() => removeFieldConfig(field.key, field.location)}
                        disabled={isRunning}
                        title="Remove Parameter"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> 
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {fieldConfigs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/40 gap-3">
                <Settings2 className="w-10 h-10 opacity-10" />
                <p className="text-xs font-medium italic">No parameters detected</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
