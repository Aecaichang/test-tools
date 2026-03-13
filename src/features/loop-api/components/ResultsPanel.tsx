import React from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Copy, 
  Clock, 
  Info,
  Globe,
  Database
} from 'lucide-react';
import { RequestResult } from '../types';
import { Modal } from '@/components/common/Modal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ResultsPanelProps {
  results: RequestResult[];
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ results }) => {
  const [selectedResult, setSelectedResult] = React.useState<RequestResult | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Stream</span>
        </div>
        <span className="text-[10px] font-black text-muted-foreground/40">{results.length} requests</span>
      </div>

      <div className="space-y-3">
        {results.map((result, idx) => (
          <Card 
            key={`${result.index}-${idx}`}
            className="group p-0 overflow-hidden border-border/40 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 bg-background/50 backdrop-blur-sm"
          >
            <div className="flex items-center p-3 gap-4">
               <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                  result.success ? "bg-green-500/5 border-green-500/20 text-green-500" : "bg-destructive/5 border-destructive/20 text-destructive"
               )}>
                  {result.success ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
               </div>
               
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                     <span className="text-[10px] font-black text-muted-foreground/30">#{result.index}</span>
                     <Badge 
                      variant={result.success ? 'success' : 'destructive'} 
                      className="text-[9px] px-1.5 h-4 font-black uppercase tracking-widest rounded-md"
                     >
                       {result.status}
                     </Badge>
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground truncate">
                    {result.request.url}
                  </p>
               </div>

               <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5"
                    onClick={() => setSelectedResult(result)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
               </div>
               
               <div className="flex flex-col items-end gap-1 shrink-0 px-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground/40 font-bold text-[9px]">
                    <Clock className="w-3 h-3" />
                    {result.timestamp}
                  </div>
               </div>
            </div>
          </Card>
        ))}

        {results.length === 0 && (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-4 bg-secondary/5 rounded-[2rem] border border-dashed border-border/50">
             <div className="p-4 rounded-2xl bg-background shadow-sm border border-border/50 text-muted-foreground/20">
                <Info className="w-10 h-10" />
             </div>
             <div>
                <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">Awaiting execution</p>
                <p className="text-xs text-muted-foreground/40">Results will appear here in real-time</p>
             </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedResult}
        onClose={() => setSelectedResult(null)}
        title={`Request Details #${selectedResult?.index}`}
        className="max-w-2xl"
      >
        {selectedResult && (
          <div className="space-y-8 py-4">
            <div className="flex items-center gap-6 p-6 rounded-3xl bg-secondary/20 border border-border/50 shadow-inner">
               <div className={cn(
                  "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg",
                  selectedResult.success ? "bg-green-500 text-white shadow-green-500/20" : "bg-destructive text-white shadow-destructive/20"
               )}>
                  {selectedResult.success ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
               </div>
               <div className="space-y-1">
                  <Badge variant={selectedResult.success ? 'success' : 'destructive'} className="font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2">
                    {selectedResult.status}
                  </Badge>
                  <p className="text-sm font-mono text-muted-foreground break-all leading-relaxed">
                    {selectedResult.request.url}
                  </p>
               </div>
            </div>

            <section className="space-y-4">
               <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    <h4 className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-widest">Request Payload</h4>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] font-bold gap-2 text-primary hover:bg-primary/5"
                    onClick={() => copyToClipboard(JSON.stringify(selectedResult.request.payload, null, 2), "Payload")}
                  >
                    <Copy className="w-3 h-3" /> COPY
                  </Button>
               </div>
               <div className="p-6 rounded-3xl bg-background border border-border/50 font-mono text-[12px] leading-relaxed overflow-x-auto shadow-sm italic">
                  <pre>{JSON.stringify(selectedResult.request.payload, null, 2)}</pre>
               </div>
            </section>

            <section className="space-y-4">
               <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-500" />
                    <h4 className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-widest">Response Body</h4>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] font-bold gap-2 text-green-600 hover:bg-green-500/5"
                    onClick={() => copyToClipboard(JSON.stringify(selectedResult.data, null, 2), "Response")}
                  >
                    <Copy className="w-3 h-3" /> COPY
                  </Button>
               </div>
               <div className="p-6 rounded-3xl bg-background border border-border/50 font-mono text-[12px] leading-relaxed max-h-[400px] overflow-auto shadow-sm">
                  <pre>{JSON.stringify(selectedResult.data, null, 2)}</pre>
               </div>
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
};
