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
    <div className="space-y-8">
      {/* CURL Input Section */}
      <Card className="relative p-6 rounded-[2.5rem] border-border/40 shadow-xl bg-background/50 backdrop-blur-xl overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors duration-500" />
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Terminal className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground/80">CURL Command</h3>
            </div>
            <div className="flex items-center gap-2">
               <Badge variant="outline" className="rounded-lg text-[10px] font-bold border-primary/20 text-primary bg-primary/5">
                 AUTO-DETECT
               </Badge>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={curlInput}
              onChange={(e) => setCurlInput(e.target.value)}
              placeholder="Paste your cURL command here..."
              className="w-full h-48 p-6 rounded-3xl bg-secondary/20 border-2 border-transparent focus:border-primary/20 focus:bg-background transition-all outline-none font-mono text-sm resize-none custom-scrollbar leading-relaxed"
            />
            <Button
              onClick={onParse}
              disabled={!curlInput || isRunning}
              className="absolute bottom-4 right-4 h-12 px-6 rounded-2xl font-black gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              PARSE COMMAND
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/5 border border-destructive/10 text-destructive text-sm font-medium animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </Card>

      {parsedData && (
        <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
          {/* Endpoint Info */}
          <div className="flex items-center gap-4 p-5 rounded-3xl bg-primary/5 border border-primary/10">
             <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20 italic">
                {parsedData.method}
             </div>
             <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-0.5">Destination URL</p>
                <p className="text-sm font-mono truncate font-bold text-foreground/70">{parsedData.url}</p>
             </div>
             <div className="flex items-center gap-3 px-4 py-2 bg-background rounded-2xl border border-border/50">
                <Globe className="w-3.5 h-3.5 text-muted-foreground/40" />
                <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Proxy</span>
                <Checkbox 
                  checked={useProxy} 
                  onChange={(e) => setUseProxy(e.target.checked)} 
                  className="rounded-lg border-2"
                />
             </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Headers Configuration */}
            <Card className="p-6 rounded-[2rem] border-border/40 bg-background/50 shadow-sm space-y-6">
               <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-primary/40 rounded-full" />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Headers</h4>
                  </div>
                  <Badge variant="secondary" className="rounded-lg h-5 font-bold text-[9px] px-2">{Object.keys(editableHeaders).length} ACTIVE</Badge>
               </div>
               
               <div className="space-y-2 max-h-[300px] overflow-auto pr-2 custom-scrollbar">
                  {Object.entries(editableHeaders).map(([key, value]) => (
                    <div key={key} className="group flex items-start gap-3 p-3 rounded-2xl hover:bg-secondary/30 transition-colors border border-transparent hover:border-border/50">
                       <Input 
                        value={key} 
                        readOnly 
                        className="h-9 font-mono text-[11px] font-bold bg-transparent border-none text-primary/70 shrink-0 w-[120px]" 
                       />
                       <Input 
                        value={value} 
                        onChange={(e) => setEditableHeaders(prev => ({ ...prev, [key]: e.target.value }))}
                        className="h-9 font-mono text-[11px] bg-background/50 border-border/50 rounded-xl focus:ring-1 focus:ring-primary/20" 
                       />
                    </div>
                  ))}
               </div>
            </Card>

            {/* Smart Parameters */}
            <Card className="p-6 rounded-[2rem] border-border/40 bg-background/50 shadow-sm space-y-6">
               <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-orange-500/40 rounded-full" />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Smart Injection</h4>
                  </div>
                  <div className="p-1 px-2 rounded-lg bg-orange-500/10 text-orange-600 text-[9px] font-black flex items-center gap-1.5 uppercase tracking-tighter">
                    <Database className="w-3 h-3" />
                    {fieldConfigs.length} Parameters
                  </div>
               </div>

               <div className="space-y-3 max-h-[300px] overflow-auto pr-2 custom-scrollbar">
                  {fieldConfigs.map((field) => (
                    <div key={`${field.location}-${field.key}`} className="flex flex-col gap-3 p-4 rounded-2xl bg-secondary/10 border border-border/40 hover:border-orange-500/20 transition-all">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <Checkbox 
                                checked={field.enabled} 
                                onChange={(e) => updateFieldConfig(field.key, { enabled: e.target.checked })}
                                className="rounded-lg border-2 border-orange-500/20 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                             />
                             <span className="text-[11px] font-black font-mono text-foreground/70">{field.key}</span>
                          </div>
                          <Badge variant="outline" className="text-[8px] font-black tracking-widest uppercase h-4 rounded-md border-orange-500/10 text-orange-600/60">
                             {field.location}
                          </Badge>
                       </div>

                       {field.enabled ? (
                          <div className="grid grid-cols-1 gap-2 p-1 animate-in zoom-in-95">
                             <Select
                                value={field.generator}
                                onChange={(val) => updateFieldConfig(field.key, { generator: val as any })}
                                options={GENERATOR_OPTIONS}
                                className="h-8 text-[10px] font-bold rounded-lg border-orange-500/10"
                             />
                             {field.generator === 'none' && (
                                <Input 
                                  value={String(field.value)} 
                                  onChange={(e) => updateFieldConfig(field.key, { value: e.target.value })}
                                  placeholder="Fixed value..."
                                  className="h-8 text-[10px] font-mono rounded-lg border-orange-500/10"
                                />
                             )}
                          </div>
                       ) : (
                          <div className="px-1 text-[10px] font-medium text-muted-foreground/40 italic truncate">
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
