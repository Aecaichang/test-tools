import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Textarea';
import { 
  GitCompare, 
  Trash2, 
  ArrowRightLeft, 
  Search, 
  CheckCircle2, 
  XCircle,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DiffLine {
  content: string;
  type: 'added' | 'removed' | 'unchanged';
}

export const JsonDiff: React.FC = () => {
  const [leftInput, setLeftInput] = useState('');
  const [rightInput, setRightInput] = useState('');
  const [showResult, setShowResult] = useState(false);

  // Normalize JSON for comparison
  const normalize = (json: string): string => {
    try {
      if (!json.trim()) return '';
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json; // Return as is if invalid, comparison will be messy but functional
    }
  };

  const diffResult = useMemo(() => {
    if (!showResult) return null;

    const left = normalize(leftInput).split('\n');
    const right = normalize(rightInput).split('\n');
    
    // Very simple diff logic for demonstration
    const result: { left: DiffLine[]; right: DiffLine[] } = {
      left: [],
      right: []
    };

    const maxLines = Math.max(left.length, right.length);

    for (let i = 0; i < maxLines; i++) {
      const l = left[i];
      const r = right[i];

      if (l === r) {
        result.left.push({ content: l || '', type: 'unchanged' });
        result.right.push({ content: r || '', type: 'unchanged' });
      } else {
        if (l !== undefined) result.left.push({ content: l, type: 'removed' });
        if (r !== undefined) result.right.push({ content: r, type: 'added' });
      }
    }

    return result;
  }, [leftInput, rightInput, showResult]);

  const handleCompare = () => {
    if (!leftInput.trim() || !rightInput.trim()) {
      toast.error('กรุณาใส่ JSON ทั้งสองฝั่ง');
      return;
    }
    setShowResult(true);
    toast.success('Comparison Updated');
  };

  const swapInputs = () => {
    setLeftInput(rightInput);
    setRightInput(leftInput);
  };

  const clearAll = () => {
    setLeftInput('');
    setRightInput('');
    setShowResult(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-primary/10 bg-secondary/5">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold uppercase tracking-wider opacity-60">Source JSON (Old)</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLeftInput('')}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Textarea
              className="min-h-[200px] border-none focus-visible:ring-0 bg-transparent font-mono text-xs p-4 custom-scrollbar"
              value={leftInput}
              onChange={(e) => {
                setLeftInput(e.target.value);
                setShowResult(false);
              }}
              placeholder='{ "id": 1, "status": "pending" }'
            />
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-secondary/5">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold uppercase tracking-wider opacity-60">Target JSON (New)</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRightInput('')}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Textarea
              className="min-h-[200px] border-none focus-visible:ring-0 bg-transparent font-mono text-xs p-4 custom-scrollbar"
              value={rightInput}
              onChange={(e) => {
                setRightInput(e.target.value);
                setShowResult(false);
              }}
              placeholder='{ "id": 1, "status": "completed" }'
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" className="rounded-full h-10 w-10 border-primary/20 hover:bg-primary/5" onClick={swapInputs} title="Swap Sides">
          <ArrowRightLeft className="w-4 h-4 text-primary" />
        </Button>
        <Button className="px-8 h-12 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95" onClick={handleCompare}>
          <GitCompare className="w-5 h-5 mr-2" />
          Compare Difference
        </Button>
        <Button variant="ghost" className="text-muted-foreground" onClick={clearAll}>
          Reset
        </Button>
      </div>

      {showResult && diffResult && (
        <Card className="glow-card border-emerald-500/20 overflow-hidden animate-in zoom-in-95 duration-500">
          <CardHeader className="pb-4 bg-secondary/10 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Diff Results
                </CardTitle>
                <CardDescription>การเปรียบเทียบแบบบรรทัดต่อบรรทัด</CardDescription>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Removed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Added</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-border/40 font-mono text-[11px] h-[400px] overflow-hidden">
              <div className="overflow-auto custom-scrollbar bg-red-500/[0.01]">
                {diffResult.left.map((line, idx) => (
                  <div 
                    key={`l-${idx}`} 
                    className={cn(
                      "group flex items-start gap-4 px-4 py-0.5 min-w-full whitespace-pre",
                      line.type === 'removed' ? "bg-red-500/10 text-red-600" : "text-muted-foreground/80"
                    )}
                  >
                    <span className="w-6 shrink-0 text-right opacity-30 select-none border-r border-border/20 pr-2">{idx + 1}</span>
                    <span className="flex-1">
                      {line.type === 'removed' ? '-' : ' '} {line.content}
                    </span>
                  </div>
                ))}
              </div>
              <div className="overflow-auto custom-scrollbar bg-emerald-500/[0.01]">
                {diffResult.right.map((line, idx) => (
                  <div 
                    key={`r-${idx}`} 
                    className={cn(
                      "group flex items-start gap-4 px-4 py-0.5 min-w-full whitespace-pre",
                      line.type === 'added' ? "bg-emerald-500/10 text-emerald-600" : "text-muted-foreground/80"
                    )}
                  >
                    <span className="w-6 shrink-0 text-right opacity-30 select-none border-r border-border/20 pr-2">{idx + 1}</span>
                    <span className="flex-1">
                      {line.type === 'added' ? '+' : ' '} {line.content}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-secondary/5 border-t border-border/30 flex justify-center">
              {leftInput === rightInput ? (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-500/5 px-4 py-2 rounded-full font-bold text-xs border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                  JSON ทั้งคู่เหมือนกันทุกประการ
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-500/5 px-4 py-2 rounded-full font-bold text-xs border border-amber-500/20">
                  <XCircle className="w-4 h-4" />
                  พบจุดที่แตกต่างกัน
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
