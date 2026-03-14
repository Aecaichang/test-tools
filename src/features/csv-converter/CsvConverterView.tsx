import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/common/Table';
import { Textarea } from '@/components/common/Textarea';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  FileX, 
  CheckCircle2, 
  ArrowRightLeft,
  Settings2,
  Table as TableIcon,
  ClipboardPaste
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

interface PreviewData {
  headers: string[];
  rows: Record<string, string | number | null | undefined>[];
  fileName: string;
}

export const CsvConverterView: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'file' | 'text'>('file');
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [rawWorkbook, setRawWorkbook] = useState<XLSX.WorkBook | null>(null);

  const processWorkbook = (workbook: XLSX.WorkBook, fileName: string) => {
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON for preview (using header:1 to get raw arrays)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      raw: true,
      defval: '' 
    }) as (string | number | null | undefined)[][];
    
    if (jsonData.length > 0) {
      const headers = jsonData[0].map(h => String(h ?? ''));
      const rows = jsonData.slice(1, 6).map(row => {
        const rowObj: Record<string, string | number | null | undefined> = {};
        headers.forEach((h, i) => {
          rowObj[h] = row[i];
        });
        return rowObj;
      });

      setPreviewData({
        headers,
        rows,
        fileName
      });
      setRawWorkbook(workbook);
      toast.success('ประมวลผลข้อมูลสำเร็จ พร้อมสำหรับการแปลง');
    } else {
      toast.error('ไม่มีข้อมูลในอินพุต');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(csv|tsv)$/)) {
      toast.error('กรุณาเลือกไฟล์ .csv หรือ .tsv เท่านั้น');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', codepage: 65001 });
        processWorkbook(workbook, file.name);
      } catch (err) {
        toast.error('เกิดข้อผิดพลาดในการอ่านไฟล์');
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      toast.error('การอ่านไฟล์ล้มเหลว');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleTextConvert = () => {
    if (!pastedText.trim()) {
      toast.error('กรุณาวางข้อความ CSV');
      return;
    }

    try {
      setIsProcessing(true);
      // For pasted text, we try to detect if it's Tab-Separated (from Excel) or Comma-Separated
      // We read as string and let XLSX handle it, but we can specify the delimiter if needed.
      const workbook = XLSX.read(pastedText, { 
        type: 'string',
        cellText: true,
        cellStyles: true
      });
      processWorkbook(workbook, 'pasted_content.xlsx');
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการประมวลผลข้อความ');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const convertAndDownload = () => {
    if (!rawWorkbook || !previewData) return;

    try {
      setIsProcessing(true);
      const newFileName = previewData.fileName.replace(/\.(csv|tsv)$/, '.xlsx');
      
      // XLSX.writeFile will handle the browser download
      XLSX.writeFile(rawWorkbook, newFileName, { bookType: 'xlsx', type: 'binary' });
      
      toast.success('แปลงไฟล์และเริ่มดาวน์โหลดสำเร็จ');
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการแปลงไฟล์');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setPreviewData(null);
    setRawWorkbook(null);
    setPastedText('');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CSV/TSV to Excel Converter</h1>
            <p className="text-muted-foreground">แปลงไฟล์ CSV หรือ TSV ให้เป็น Excel (.xlsx) อย่างรวดเร็วและปลอดภัย</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className={cn("lg:col-span-4 space-y-6", previewData && "hidden lg:block")}>
          <div className="flex p-1 bg-secondary/50 rounded-2xl gap-1">
            <Button 
              variant={activeMode === 'file' ? 'default' : 'ghost'} 
              className="flex-1 rounded-xl h-10 text-xs gap-2"
              onClick={() => setActiveMode('file')}
            >
              <Upload className="w-3.5 h-3.5" />
              อัปไฟล์
            </Button>
            <Button 
              variant={activeMode === 'text' ? 'default' : 'ghost'} 
              className="flex-1 rounded-xl h-10 text-xs gap-2"
              onClick={() => setActiveMode('text')}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              ก๊อปมาวาง
            </Button>
          </div>

          {activeMode === 'file' ? (
            <Card className="border-dashed border-2 border-primary/20 bg-primary/[0.01] hover:bg-primary/[0.02] transition-colors">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  อัปโหลดไฟล์
                </CardTitle>
                <CardDescription>เลือกไฟล์ CSV หรือ TSV เพื่อเริ่มแปลง</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-6">
                <label className="w-full">
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".csv,.tsv" 
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                  />
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/10 rounded-2xl cursor-pointer hover:bg-primary/5 transition-all group">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileSpreadsheet className="w-8 h-8 text-primary" />
                    </div>
                    <span className="text-sm font-semibold">คลิกเพื่อเลือกไฟล์</span>
                    <span className="text-xs text-muted-foreground mt-1">รองรับ .csv และ .tsv</span>
                  </div>
                </label>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-primary/20 bg-primary/[0.01]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardPaste className="w-5 h-5 text-primary" />
                  วางข้อความ CSV
                </CardTitle>
                <CardDescription>วางเนื้อหา CSV ลงในช่องด้านล่าง</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder="name,email,phone&#10;John Doe,john@example.com,123456789"
                  className="min-h-[200px] font-mono text-xs"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  disabled={isProcessing}
                />
                <Button 
                  className="w-full rounded-xl"
                  onClick={handleTextConvert}
                  disabled={isProcessing || !pastedText.trim()}
                >
                  ประมวลผลข้อความ
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="bg-secondary/10 border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                <Settings2 className="w-4 h-4" />
                ความปลอดภัย
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              ข้อมูลของคุณจะถูกประมวลผลภายในเบราว์เซอร์เท่านั้น ไม่มีการส่งไฟล์ไปยังเซิร์ฟเวอร์ภายนอก ทำให้มั่นใจได้ว่าข้อมูลที่เป็นความลับของคุณจะปลอดภัย 100%
            </CardContent>
          </Card>
        </div>

        {/* Preview and Action Section */}
        <div className={cn("lg:col-span-8 space-y-6", !previewData && "hidden lg:block")}>
          {!previewData ? (
             <Card className="h-full flex items-center justify-center border-dashed min-h-[400px]">
                <div className="text-center text-muted-foreground opacity-50">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-4" />
                  <p>อัปโหลดไฟล์เพื่อดูตัวอย่างข้อมูล</p>
                </div>
             </Card>
          ) : (
            <>
              <Card className="glow-card border-emerald-500/20 bg-emerald-500/[0.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      พร้อมสำหรับการแปลงแล้ว!
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {previewData.fileName}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={reset}>
                    <FileX className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </CardHeader>
                <CardContent className="pt-4">
                  <Button 
                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:scale-[1.02] transition-transform"
                    onClick={convertAndDownload}
                    disabled={isProcessing}
                  >
                    <Download className="w-6 h-6 mr-3" />
                    {isProcessing ? 'กำลังดำเนินการ...' : 'Convert to Excel (.xlsx)'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-primary/10">
                <CardHeader className="bg-secondary/20 pb-4 border-b">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TableIcon className="w-4 h-4" />
                    ตัวอย่างข้อมูล (5 แถวแรก)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-auto max-h-[400px]">
                  <Table>
                    <TableHeader className="bg-secondary/30 sticky top-0 z-10">
                      <TableRow>
                        {previewData.headers.map((h, i) => (
                          <TableHead key={i} className="text-xs uppercase font-bold min-w-[120px]">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.rows.map((row, i) => (
                        <TableRow key={i}>
                          {previewData.headers.map((h, j) => (
                            <TableCell key={j} className="text-xs whitespace-pre-wrap min-w-[120px]">
                              {String(row[h] ?? '')}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
