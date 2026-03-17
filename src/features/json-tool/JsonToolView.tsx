import React, { useState } from 'react';
import { Code2, FileCode, GitCompare } from 'lucide-react';
import { JsonFormatter } from './components/JsonFormatter';
import { JsonDiff } from './components/JsonDiff';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/common/Card';
import { QuickStartCard } from '@/components/common/QuickStartCard';

type SubView = 'formatter' | 'diff';

export const JsonToolView: React.FC = () => {
  const [activeSubView, setActiveSubView] = useState<SubView>('formatter');

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">JSON Utilities</h1>
              <p className="text-muted-foreground">จัดรูปแบบ ตรวจสอบ และเปรียบเทียบ JSON ของคุณ</p>
            </div>
          </div>
        </div>

        <div className="flex items-center bg-secondary/30 p-1.5 rounded-2xl border border-border/50 backdrop-blur-sm self-start md:self-auto">
          <button
            onClick={() => setActiveSubView('formatter')}
            aria-pressed={activeSubView === 'formatter'}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
              activeSubView === 'formatter' 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <Code2 className="w-4 h-4" />
            Formatter
          </button>
          <button
            onClick={() => setActiveSubView('diff')}
            aria-pressed={activeSubView === 'diff'}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
              activeSubView === 'diff' 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <GitCompare className="w-4 h-4" />
            JSON Diff
          </button>
        </div>
      </div>

      <QuickStartCard steps={[
        'เลือกโหมด Formatter หรือ JSON Diff',
        'วาง JSON ที่ต้องการตรวจสอบ',
        'คัดลอกผลลัพธ์ที่จัดรูปแบบแล้ว',
      ]} />

      <div className="grid grid-cols-1 gap-8">
        {activeSubView === 'formatter' ? <JsonFormatter /> : <JsonDiff />}
      </div>
    </div>
  );
};
