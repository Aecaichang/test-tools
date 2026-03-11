import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Clock, History, RotateCw, Trash2 } from 'lucide-react';
import { ApiLog } from '../types';
import { ConfirmModal } from '@/components/common/ConfirmModal';

interface HistoryPanelProps {
  historyItems: ApiLog[];
  isLoading: boolean;
  onLoad: (item: ApiLog) => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  historyItems,
  isLoading,
  onLoad,
  onDelete,
  onDeleteAll,
}) => {
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-secondary/5 border-b border-border/30">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent History
            </CardTitle>
            <CardDescription>ประวัติการยิง API 20 รายการล่าสุดที่เก็บไว้ใน Supabase</CardDescription>
          </div>
          {historyItems.length > 0 && !isLoading && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setIsConfirmDeleteAllOpen(true)}
              className="h-9 gap-1.5 shadow-sm rounded-xl"
            >
              <Trash2 className="w-4 h-4" />
              Delete All
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">กำลังดึงข้อมูลประวัติ...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historyItems.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl border bg-secondary/10 border-border/50 hover:border-primary/30 transition-all duration-300 group shadow-sm hover:shadow-md">
                  <div className="flex items-center justify-between mb-3 overflow-hidden">
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <Badge variant={item.success ? 'success' : 'destructive'} className="shrink-0 font-bold px-2 py-0.5 h-6">
                        {item.method}
                      </Badge>
                      <span className="text-xs font-mono truncate bg-background border border-border/50 px-2.5 py-1 rounded-lg text-muted-foreground flex-1">
                        {item.url}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => onLoad(item)}
                        className="h-8 gap-1.5 px-4 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors border-0"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        Use
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onDelete(item.id)}
                        className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-muted-foreground mb-3 flex items-center gap-2 px-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest px-1">Payload</p>
                      <pre className="text-[10px] p-3 bg-secondary/50 rounded-xl overflow-x-auto max-h-32 border border-border/30 font-mono">
                        {JSON.stringify(item.payload, null, 2)}
                      </pre>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest px-1">Response ({item.response_status})</p>
                      <pre className="text-[10px] p-3 bg-secondary/50 rounded-xl overflow-x-auto max-h-32 border border-border/30 font-mono">
                        {JSON.stringify(item.response_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
              {historyItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4 opacity-50">
                  <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                    <History className="w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold">No history found</p>
                    <p className="text-xs">ยิง API ครั้งแรกเพื่อเก็บประวัติที่นี่</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={isConfirmDeleteAllOpen}
        onClose={() => setIsConfirmDeleteAllOpen(false)}
        onConfirm={onDeleteAll}
        title="Delete All History?"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการยิง API ทั้งหมด? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmText="Yes, delete all"
        cancelText="No, keep it"
      />
    </div>
  );
};
