import React from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Checkbox } from '@/components/common/Checkbox';
import { Badge } from '@/components/common/Badge';
import { Select, type SelectOption } from '@/components/common/Select';
import { 
  Terminal, 
  Settings2, 
  AlertCircle, 
  Database, 
  Search, 
  Trash2, 
  Globe, 
  Sparkles
} from 'lucide-react';
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
    <div className="space-y-8">
      {/* CURL Input Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/5 text-primary border border-primary/10">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">CURL Input</h3>
              <p className="text-sm text-muted-foreground">Import your request from a CURL command</p>
            </div>
          </div>

          <div className="flex items-center bg-secondary/30 p-1 rounded-xl border border-border/50">
            <button
              onClick={() => setUseProxy(true)}
              className={cn(
                "px-4 py-1.5 text-[11px] font-bold transition-all rounded-lg flex items-center gap-2",
                useProxy ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              PROXY ON
            </button>
            <button
              onClick={() => setUseProxy(false)}
              className={cn(
                "px-4 py-1.5 text-[11px] font-bold transition-all rounded-lg",
                !useProxy ? "bg-background text-muted-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              OFF
            </button>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
          <Card className="relative p-0 overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm">
            <Textarea
              value={curlInput}
              onChange={(e) => setCurlInput(e.target.value)}
              placeholder="Paste your CURL command here..."
              className="min-h-[220px] font-mono text-[12px] bg-transparent border-none focus-visible:ring-0 resize-none p-6 leading-relaxed"
              disabled={isRunning}
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
               <Button 
                onClick={onParse}
                variant="outline"
                size="sm"
                className="h-9 px-4 rounded-lg font-bold text-xs gap-2 border-primary/20 hover:bg-primary/5 bg-background shadow-sm"
                disabled={isRunning}
              >
                <Sparkles className="w-3.5 h-3.5" />
                PARSE COMMAND
              </Button>
            </div>
          </Card>
        </div>

        {error && (
          <div className="p-4 bg-destructive/5 border border-destructive/10 text-destructive rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-xs font-medium">{error}</p>
          </div>
        )}
      </section>

      {/* Configuration Hub */}
      {parsedData && (
        <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Headers */}
          <section className="space-y-4">
             <div className="flex items-center gap-2 px-1">
                <Badge variant="outline" className="rounded-md font-bold text-[10px] px-1.5 h-5 border-blue-500/20 text-blue-600 bg-blue-50/50">HEADERS</Badge>
                <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">Dynamic Headers</span>
             </div>
             
             <Card className="p-4 border-border/40 bg-secondary/5 space-y-3 rounded-2xl">
                <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                   {Object.entries(editableHeaders).map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-1 p-3 rounded-xl bg-background border border-border/50 shadow-sm">
                      <span className="text-[9px] font-black text-muted-foreground/50 uppercase truncate">{key}</span>
                      <Input
                        value={value}
                        onChange={(e) => setEditableHeaders(prev => ({ ...prev, [key]: e.target.value }))}
                        className="h-6 text-[12px] bg-transparent border-none p-0 focus-visible:ring-0 font-medium"
                        disabled={isRunning}
                      />
                    </div>
                  ))}
                  {Object.keys(editableHeaders).length === 0 && (
                    <p className="text-center py-4 text-xs text-muted-foreground italic">No headers found</p>
                  )}
                </div>
             </Card>
          </section>

          {/* Parameters */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
               <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-md font-bold text-[10px] px-1.5 h-5 border-amber-500/20 text-amber-600 bg-amber-50/50">PARAMS</Badge>
                  <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">Smart Injectors</span>
               </div>
               <span className="text-[10px] font-bold text-muted-foreground/40">{fieldConfigs.length} detected</span>
            </div>

            <div className="space-y-3">
              {fieldConfigs.map((field) => (
                <Card 
                  key={`${field.location}-${field.key}`}
                  className={cn(
                    "relative p-4 border-border/40 transition-all duration-300 rounded-2xl",
                    field.enabled ? "ring-1 ring-primary/20 bg-primary/[0.01]" : "bg-background shadow-sm"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={field.enabled}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFieldConfig(field.key, { enabled: e.target.checked })}
                      disabled={isRunning}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold truncate max-w-[150px]">{field.key}</span>
                        {field.location === 'query' ? (
                          <Search className="w-3 h-3 text-amber-500/50" />
                        ) : (
                          <Database className="w-3 h-3 text-blue-500/50" />
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          {field.enabled ? (
                            <Select
                              value={field.generator}
                              onChange={(val) => updateFieldConfig(field.key, { generator: val as FieldConfig['generator'] })}
                              options={GENERATOR_OPTIONS}
                              className="h-9 text-xs"
                              disabled={isRunning}
                            />
                          ) : (
                            <Input
                              value={field.value?.toString() || ''}
                              onChange={(e) => updateFieldConfig(field.key, { value: e.target.value })}
                              className="h-9 text-xs font-mono bg-secondary/10"
                              placeholder="Fixed value..."
                              disabled={isRunning}
                            />
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 shrink-0"
                          onClick={() => removeFieldConfig(field.key, field.location)}
                          disabled={isRunning}
                        >
                          <Trash2 className="w-4 h-4" /> 
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              {fieldConfigs.length === 0 && (
                <div className="py-12 text-center bg-secondary/5 rounded-3xl border border-dashed border-border/50">
                   <Settings2 className="w-8 h-8 mx-auto text-muted-foreground/20 mb-3" />
                   <p className="text-xs font-medium text-muted-foreground/40">No dynamic parameters found</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
