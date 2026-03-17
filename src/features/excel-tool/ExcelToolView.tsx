import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/common/Card';
import { QuickStartCard } from '@/components/common/QuickStartCard';
import { 
  FileSpreadsheet, 
  Upload, 
  FileX, 
  Search, 
  Table as TableIcon,
  FileJson,
  Layers,
  Info
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/common/Table';
import { cn } from '@/lib/utils';

interface ExcelData {
  sheets: Record<string, unknown[]>;
  sheetNames: string[];
}

export const ExcelToolView: React.FC = () => {
  const [data, setData] = useState<ExcelData | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      toast.error('กรุณาเลือกไฟล์ Excel หรือ CSV เท่านั้น');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        const sheetsData: Record<string, unknown[]> = {};
        wb.SheetNames.forEach(name => {
          sheetsData[name] = XLSX.utils.sheet_to_json(wb.Sheets[name]);
        });

        setData({
          sheets: sheetsData,
          sheetNames: wb.SheetNames
        });
        setActiveSheet(wb.SheetNames[0]);
        toast.success(`โหลดข้อมูลสำเร็จ: พบ ${wb.SheetNames.length} Sheets`);
      } catch (err) {
        toast.error('เกิดข้อผิดพลาดในการอ่านไฟล์');
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const currentData = (data?.sheets[activeSheet] as Record<string, unknown>[]) || [];
  const ROW_LIMIT = 1000;
  const isLargeFile = currentData.length > ROW_LIMIT;
  
  const filteredData = currentData.filter(row => 
    Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  ).slice(0, ROW_LIMIT);

  const columns = currentData.length > 0 ? Object.keys(currentData[0]) : [];

  const downloadJson = () => {
    if (!data) return;
    const jsonString = JSON.stringify(data.sheets[activeSheet], null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeSheet}_data.json`;
    link.click();
    toast.success('ดาวน์โหลด JSON สำเร็จ');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-inner">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Excel Viewer</h1>
              <p className="text-muted-foreground">อ่านและแปลงไฟล์ Excel ให้เป็นรูปแบบที่อ่านง่าย</p>
            </div>
          </div>
        </div>
      </div>

      <QuickStartCard steps={[
        'อัปโหลดไฟล์ .xlsx/.xls/.csv',
        'เลือก Sheet และค้นหาข้อมูล',
        'กด Download JSON เพื่อนำข้อมูลไปใช้ต่อ',
      ]} />

      {!data ? (
        <Card className="glow-card border-dashed border-2 border-primary/20 bg-primary/[0.01] hover:bg-primary/[0.03] transition-all duration-500 group">
          <CardContent className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-primary/5">
              <Upload className="w-10 h-10 text-primary animate-bounce-subtle" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-foreground">อัปโหลดไฟล์ของคุณ</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                รองรับไฟล์ .xlsx, .xls และ .csv <br/>
                ข้อมูลจะถูกประมวผลในเครื่องของคุณ ปลอดภัย 100%
              </p>
            </div>
            <label className="relative cursor-pointer">
              <input 
                type="file" 
                className="hidden" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
              <Button size="lg" className="px-12 rounded-2xl shadow-xl shadow-primary/20 pointer-events-none">
                {isProcessing ? 'กำลังประมวลผล...' : 'เลือกไฟล์ Excel'}
              </Button>
            </label>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          {/* Stats and Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-primary/5 bg-secondary/10">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-widest">Total Sheets</p>
                  <p className="text-xl font-bold">{data.sheetNames.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/5 bg-secondary/10">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <TableIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-widest">Rows In Active Sheet</p>
                  <p className="text-xl font-bold">{currentData.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/5 bg-secondary/10">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-widest">Active Sheet</p>
                  <p className="text-md font-bold truncate max-w-[150px]">{activeSheet}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sheet Selector */}
          <div className="flex flex-wrap gap-2">
            {data.sheetNames.map(name => (
              <button
                key={name}
                onClick={() => setActiveSheet(name)}
                aria-current={activeSheet === name ? 'true' : undefined}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                  activeSheet === name 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105" 
                    : "bg-background text-muted-foreground border-border hover:bg-secondary/50"
                )}
              >
                {name}
              </button>
            ))}
            <Button variant="ghost" size="sm" className="ml-auto text-destructive hover:bg-destructive/5" onClick={() => setData(null)}>
              <FileX className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Table Card */}
          <Card className="glow-card border-primary/10 overflow-hidden flex flex-col max-h-[700px]">
            <CardHeader className="bg-secondary/20 border-b border-border/30 pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search in table..." 
                    className="pl-10 h-10 bg-background/50 border-border/40 focus:border-primary/40 rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-10 rounded-xl border-primary/20 hover:bg-primary/5 text-primary" onClick={downloadJson}>
                    <FileJson className="w-4 h-4 mr-2" />
                    Download JSON
                  </Button>
                </div>
              </div>
              {isLargeFile && (
                <p className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
                  Showing first {ROW_LIMIT.toLocaleString()} of {currentData.length.toLocaleString()} rows. Download JSON to access all data.
                </p>
              )}
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <Table className="h-full">
                <TableHeader className="sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-16 bg-secondary/50">#</TableHead>
                    {columns.map(col => (
                      <TableHead key={col} className="bg-secondary/50 min-w-[150px]">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="custom-scrollbar overflow-auto">
                  {filteredData.length > 0 ? (
                    filteredData.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-center font-mono text-[10px] text-muted-foreground bg-secondary/5">{idx + 1}</TableCell>
                        {columns.map(col => (
                          <TableCell key={col} className="text-xs">
                            {String(row[col])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1} className="h-32 text-center text-muted-foreground italic">
                        No data found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
