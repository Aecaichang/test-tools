import React from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Checkbox } from '@/components/common/Checkbox';
import { Badge } from '@/components/common/Badge';
import { Select, type SelectOption } from '@/components/common/Select';
import {
  Terminal,
  AlertCircle,
  Database,
  Globe,
  Sparkles
} from 'lucide-react';
import { ParsedCurl } from '../utils/curl-parser';
import { FieldConfig } from '../types';

interface TesterPanelProps {
  curlInput: string;
  setCurlInput: (val: string) => void;
  onParse: () => void;
  error: string | null;
  isRunning: boolean;
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
  useProxy,
  setUseProxy,
}) => {
  return (
    <div className="space-y-6">
      {/* CURL Input Section */}
      <Card className="group relative overflow-hidden rounded-2xl border-border/60 bg-card p-5 shadow-sm">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors duration-500" />
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Terminal className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/80">CURL Command</h3>
            </div>
            <div className="flex items-center gap-2">
               <Badge variant="outline" className="h-6 rounded-lg border-primary/20 bg-primary/5 px-2 text-[10px] font-bold text-primary">
                 AUTO-DETECT
               </Badge>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={curlInput}
              onChange={(e) => setCurlInput(e.target.value)}
              placeholder="Paste your cURL command here..."
              className="custom-scrollbar h-48 w-full resize-none rounded-2xl border border-border/60 bg-secondary/20 p-4 font-mono text-sm leading-relaxed outline-none transition-all focus:border-primary/20 focus:bg-background"
            />
            <Button
              onClick={onParse}
              disabled={!curlInput || isRunning}
              className="absolute bottom-3 right-3 h-11 rounded-xl px-5 text-sm font-semibold shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Parse Command
            </Button>
          </div>

          {error && (
            <div className="animate-in slide-in-from-top-2 flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm font-medium text-destructive">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </Card>

      {parsedData && (
        <div className="animate-in fade-in slide-in-from-bottom-5 grid grid-cols-1 gap-6 duration-500">
          {/* Endpoint Info */}
          <div className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-xs font-bold italic text-primary-foreground">
                {parsedData.method}
             </div>
             <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-primary/60">Destination URL</p>
                <p className="truncate font-mono text-sm font-semibold text-foreground/80">{parsedData.url}</p>
             </div>
             <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2">
                <Globe className="h-3.5 w-3.5 text-muted-foreground/40" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Proxy</span>
                <Checkbox 
                  checked={useProxy} 
                  onChange={(e) => setUseProxy(e.target.checked)} 
                  className="rounded-lg border-2"
                />
             </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Headers Configuration */}
            <Card className="space-y-5 rounded-2xl border-border/60 bg-card p-4 shadow-sm">
               <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-primary/40 rounded-full" />
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">Headers</h4>
                  </div>
                  <Badge variant="secondary" className="h-6 rounded-lg px-2 text-[10px] font-semibold">{Object.keys(editableHeaders).length} Active</Badge>
               </div>
               
               <div className="space-y-2 max-h-[300px] overflow-auto pr-2 custom-scrollbar">
                  {Object.entries(editableHeaders).map(([key, value]) => (
                    <div key={key} className="group flex items-start gap-3 rounded-xl border border-transparent p-2.5 transition-colors hover:border-border/60 hover:bg-secondary/30">
                       <Input 
                        value={key} 
                        readOnly 
                        className="h-9 w-[120px] shrink-0 border-none bg-transparent font-mono text-[11px] font-semibold text-primary/70" 
                       />
                       <Input 
                        value={value} 
                        onChange={(e) => setEditableHeaders(prev => ({ ...prev, [key]: e.target.value }))}
                        className="h-9 rounded-lg border-border/60 bg-background/50 font-mono text-[11px]" 
                       />
                    </div>
                  ))}
               </div>
            </Card>

            {/* Smart Parameters */}
            <Card className="space-y-5 rounded-2xl border-border/60 bg-card p-4 shadow-sm">
               <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-orange-500/40 rounded-full" />
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">Smart Injection</h4>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-2 py-1 text-[10px] font-semibold text-orange-600">
                    <Database className="w-3 h-3" />
                    {fieldConfigs.length} Params
                  </div>
               </div>

               <div className="space-y-3 max-h-[300px] overflow-auto pr-2 custom-scrollbar">
                  {fieldConfigs.map((field) => (
                    <div key={`${field.location}-${field.key}`} className="flex flex-col gap-3 rounded-xl border border-border/50 bg-secondary/10 p-3">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <Checkbox 
                                checked={field.enabled} 
                                onChange={(e) => updateFieldConfig(field.key, { enabled: e.target.checked })}
                                className="rounded-lg border-2 border-orange-500/20 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                             />
                             <span className="font-mono text-[11px] font-semibold text-foreground/70">{field.key}</span>
                          </div>
                          <Badge variant="outline" className="h-5 rounded-md border-orange-500/20 px-2 text-[9px] font-semibold uppercase tracking-wide text-orange-600/70">
                             {field.location}
                          </Badge>
                       </div>

                       {field.enabled ? (
                          <div className="animate-in zoom-in-95 grid grid-cols-1 gap-2 p-1">
                             <Select
                                value={field.generator}
                                onChange={(val) => updateFieldConfig(field.key, { generator: val as any })}
                                options={GENERATOR_OPTIONS}
                                className="h-9 rounded-lg border-orange-500/20 text-[11px]"
                             />
                             {field.generator === 'none' && (
                                <Input 
                                  value={String(field.value)} 
                                  onChange={(e) => updateFieldConfig(field.key, { value: e.target.value })}
                                  placeholder="Fixed value..."
                                  className="h-9 rounded-lg border-orange-500/20 font-mono text-[11px]"
                                />
                             )}
                          </div>
                       ) : (
                          <div className="truncate px-1 text-[11px] italic text-muted-foreground/60">
                             Fixed: {String(field.value)}
                          </div>
                       )}
                    </div>
                  ))}
               </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
