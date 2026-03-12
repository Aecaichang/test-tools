import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select';
import { 
  FileJson, 
  Copy, 
  Trash2, 
  Zap, 
  Minimize2, 
  Maximize2, 
  AlertCircle,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';

export const JsonFormatter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indent, setIndent] = useState('2');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ size: number; keys: number } | null>(null);

  const formatJson = useCallback((action: 'beautify' | 'minify') => {
    if (!input.trim()) return;
    
    try {
      const parsed = JSON.parse(input);
      setError(null);
      
      // Calculate stats
      const size = new Blob([input]).size;
      const keys = JSON.stringify(parsed).match(/"[^"]+":/g)?.length || 0;
      setStats({ size, keys });

      if (action === 'beautify') {
        const space = indent === 'tab' ? '\t' : parseInt(indent);
        setOutput(JSON.stringify(parsed, null, space));
        toast.success('JSON Beautified');
      } else {
        setOutput(JSON.stringify(parsed));
        toast.success('JSON Minified');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON format';
      setError(msg);
      toast.error('Invalid JSON format');
      setStats(null);
    }
  }, [input, indent]);

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast.success('Copied to clipboard');
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError(null);
    setStats(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-in slide-in-from-bottom-4 duration-500">
      <Card className="glow-card border-primary/10 flex flex-col h-[600px]">
        <CardHeader className="pb-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-primary" />
                Input JSON
              </CardTitle>
              <CardDescription>วาง JSON ดิบที่นี่เพื่อจัดรูปแบบ</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={clearAll} title="Clear All">
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden pt-0">
          <Textarea
            placeholder='{ "key": "value" }'
            className="flex-1 font-mono text-xs bg-secondary/10 border-border/40 focus:border-primary/50 resize-none custom-scrollbar"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Indentation</label>
              <Select
                value={indent}
                onChange={setIndent}
                options={[
                  { value: '2', label: '2 Spaces' },
                  { value: '4', label: '4 Spaces' },
                  { value: 'tab', label: 'Tabs' },
                ]}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button 
                className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20" 
                variant="outline"
                onClick={() => formatJson('beautify')}
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                Beautify
              </Button>
            </div>
          </div>
          
          <Button 
            className="w-full shadow-lg shadow-secondary/10" 
            variant="secondary"
            onClick={() => formatJson('minify')}
          >
            <Minimize2 className="w-4 h-4 mr-2" />
            Minify JSON
          </Button>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-[11px] rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block mb-0.5">Invalid JSON</span>
                <span className="opacity-80 font-mono italic">{error}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glow-card border-primary/10 flex flex-col h-[600px] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 z-10">
          {output && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary/5 text-primary"
                onClick={copyToClipboard}
              >
                <Copy className="w-3.5 h-3.5 mr-2" />
                Copy
              </Button>
            </div>
          )}
        </div>
        <CardHeader className="pb-3 shrink-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Formatted Result
            </CardTitle>
            <CardDescription>ผลลัพธ์ที่ได้รับการจัดรูปแบบแล้ว</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col pt-0 overflow-hidden">
          <div className="flex-1 relative rounded-xl border border-border/40 bg-secondary/5 overflow-hidden">
            <Textarea
              readOnly
              className="w-full h-full font-mono text-xs bg-transparent border-none focus-visible:ring-0 resize-none custom-scrollbar p-4"
              value={output}
              placeholder="Result will appear here..."
            />
            {!output && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30 pointer-events-none gap-4">
                <FileJson className="w-16 h-16 opacity-10" />
                <p className="text-sm font-medium italic">Ready to process...</p>
              </div>
            )}
          </div>

          {stats && (
            <div className="flex items-center gap-4 mt-4 px-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                  <Hash className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-black text-muted-foreground/50 leading-none">Total Keys</span>
                  <span className="text-sm font-bold">{stats.keys}</span>
                </div>
              </div>
              <div className="h-4 w-px bg-border/40" />
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-black text-muted-foreground/50 leading-none">Size</span>
                  <span className="text-sm font-bold">{(stats.size / 1024).toFixed(2)} KB</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
