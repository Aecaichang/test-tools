import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Textarea';
import { Input } from '@/components/common/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/common/Table';
import { Badge } from '@/components/common/Badge';
import { Copy, Trash2, Play, Database, RefreshCw, FileCode, Save, History, Clock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ProductItem {
  sku: string;
  originalQty: number;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  tableName: string;
  whereColumn: string;
  updateColumn: string;
  itemCount: number;
  queries: {
    select: string;
    update: string;
    rollback: string;
  };
}

export const ProductQueryView: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const [dbInput, setDbInput] = useState<string>('');
  const [finalInput, setFinalInput] = useState<string>('');
  const [targetTable, setTargetTable] = useState<string>('TblMasterProduct');
  const [whereColumn, setWhereColumn] = useState<string>('SkuCode');
  const [updateColumn, setUpdateColumn] = useState<string>('QuantityPerBox');
  const [keyColIndex, setKeyColIndex] = useState<number>(6);
  const [valColIndex, setValColIndex] = useState<number>(8);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('product_sql_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState('generator');

  const products = useMemo<ProductItem[]>(() => {
    if (!input.trim()) return [];
    
    return input.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const parts = line.split(/\t| {2,}/).map(p => p.trim().replace(/['",]/g, ''));
        const kIndex = parts.length === 1 ? 0 : Math.max(0, keyColIndex - 1);
        const vIndex = parts.length === 1 ? -1 : Math.max(0, valColIndex - 1);
        
        const sku = parts[kIndex] || parts[0] || '';
        const qtyStr = vIndex >= 0 ? (parts[vIndex] || '0') : '0';
        
        let qty = 0;
        if (qtyStr.toLowerCase() === 'true') qty = 1;
        else if (qtyStr.toLowerCase() === 'false') qty = 0;
        else qty = parseInt(qtyStr, 10);
        
        return { sku, originalQty: isNaN(qty) ? 0 : qty };
      })
      .filter(item => item.sku.length > 0);
  }, [input, keyColIndex, valColIndex]);

  const skuListString = useMemo(() => {
    return products.map(p => `'${p.sku}'`).join(',\n    ');
  }, [products]);

  const dbProducts = useMemo<ProductItem[]>(() => {
    if (!dbInput.trim()) return [];
    
    return dbInput.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const parts = line.split(/\t| {2,}/).map(p => p.trim().replace(/['",]/g, ''));
        const kIndex = parts.length === 1 ? 0 : Math.max(0, keyColIndex - 1);
        const vIndex = parts.length === 1 ? -1 : Math.max(0, valColIndex - 1);
        
        const sku = parts[kIndex] || parts[0] || '';
        const qtyStr = vIndex >= 0 ? (parts[vIndex] || '0') : '0';
        
        let qty = 0;
        if (qtyStr.toLowerCase() === 'true') qty = 1;
        else if (qtyStr.toLowerCase() === 'false') qty = 0;
        else qty = parseInt(qtyStr, 10);
        
        return { sku, originalQty: isNaN(qty) ? 0 : qty };
      })
      .filter(item => item.sku.length > 0);
  }, [dbInput, keyColIndex, valColIndex]);

  const finalProducts = useMemo<ProductItem[]>(() => {
    if (!finalInput.trim()) return [];
    
    return finalInput.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const parts = line.split(/\t| {2,}/).map(p => p.trim().replace(/['",]/g, ''));
        const kIndex = parts.length === 1 ? 0 : Math.max(0, keyColIndex - 1);
        const vIndex = parts.length === 1 ? -1 : Math.max(0, valColIndex - 1);
        
        const sku = parts[kIndex] || parts[0] || '';
        const qtyStr = vIndex >= 0 ? (parts[vIndex] || '0') : '0';
        
        let qty = 0;
        if (qtyStr.toLowerCase() === 'true') qty = 1;
        else if (qtyStr.toLowerCase() === 'false') qty = 0;
        else qty = parseInt(qtyStr, 10);
        
        return { sku, originalQty: isNaN(qty) ? 0 : qty };
      })
      .filter(item => item.sku.length > 0);
  }, [finalInput, keyColIndex, valColIndex]);

  const verificationResults = useMemo(() => {
    if (dbProducts.length === 0 || finalProducts.length === 0) return null;

    const dbMap = new Map(dbProducts.map(p => [p.sku, p.originalQty]));
    const finalMap = new Map(finalProducts.map(p => [p.sku, p.originalQty]));

    const allSkus = Array.from(new Set([...dbMap.keys(), ...finalMap.keys()]));
    
    let matchedCount = 0;
    const details = allSkus.map(sku => {
      const before = dbMap.get(sku);
      const after = finalMap.get(sku);
      const isMatched = before === after && before !== undefined && after !== undefined;
      if (isMatched) matchedCount++;
      
      return { sku, before, after, isMatched };
    });

    const sumBefore = dbProducts.reduce((sum, p) => sum + p.originalQty, 0);
    const sumAfter = finalProducts.reduce((sum, p) => sum + p.originalQty, 0);

    return {
      details,
      matchedCount,
      totalCount: allSkus.length,
      sumBefore,
      sumAfter,
      isAllMatched: matchedCount === allSkus.length && sumBefore === sumAfter
    };
  }, [dbProducts, finalProducts]);

  const selectQuery = useMemo(() => {
    if (products.length === 0) return '-- กรุณาป้อนข้อมูลสินค้า';
    return `SELECT * FROM "${targetTable}" WHERE "${whereColumn}" IN (
    ${skuListString}
);`;
  }, [skuListString, targetTable, whereColumn, products]);

  const updateQuery = useMemo(() => {
    if (products.length === 0) return '-- กรุณาป้อนข้อมูลสินค้า';
    return `UPDATE "${targetTable}"
SET "${updateColumn}" = 1
WHERE "${whereColumn}" IN (
    ${skuListString}
);`;
  }, [skuListString, targetTable, updateColumn, whereColumn, products]);

  const rollbackQuery = useMemo(() => {
    const dataSource = dbProducts.length > 0 ? dbProducts : products;
    if (dataSource.length === 0) return '-- กรุณาป้อนข้อมูลสินค้าหรือผลลัพธ์จาก DB';
    
    const caseWhen = dataSource
      .map(p => `    WHEN '${p.sku}' THEN ${p.originalQty}`)
      .join('\n');

    const targetSkus = dbProducts.length > 0 
      ? dbProducts.map(p => `'${p.sku}'`).join(',\n    ')
      : skuListString;

    return `UPDATE "${targetTable}"
SET "${updateColumn}" = CASE "${whereColumn}"
${caseWhen}
    ELSE "${updateColumn}"
END
WHERE "${whereColumn}" IN (
    ${targetSkus}
);`;
  }, [products, dbProducts, skuListString, targetTable, updateColumn, whereColumn]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`คัดลอก ${label} เรียบร้อยแล้ว`);
  };

  const saveToHistory = () => {
    if (products.length === 0) {
      toast.error('ไม่มีข้อมูลสำหรับบันทึก');
      return;
    }

    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleString('th-TH'),
      tableName: targetTable,
      whereColumn,
      updateColumn,
      itemCount: products.length,
      queries: {
        select: selectQuery,
        update: updateQuery,
        rollback: rollbackQuery
      }
    };

    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('product_sql_history', JSON.stringify(updatedHistory));
    toast.success('บันทึกประวัติเรียบร้อยแล้ว');
  };

  const deleteHistory = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('product_sql_history', JSON.stringify(updatedHistory));
    toast.success('ลบประวัติเรียบร้อยแล้ว');
  };

  const loadFromHistory = (item: HistoryItem) => {
    setTargetTable(item.tableName);
    setWhereColumn(item.whereColumn);
    setUpdateColumn(item.updateColumn);
    toast.info('โหลดข้อมูลจากประวัติแล้ว (เฉพาะ Configuration และ Queries)');
    setActiveTab('generator');
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Product SQL Generator</h1>
          <p className="text-muted-foreground font-medium text-lg">เครื่องมือสร้างและจัดเก็บ SQL สำหรับจัดการข้อมูลสินค้า</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="bg-secondary/30 p-1 rounded-xl h-auto self-start border border-border/50">
          <TabsTrigger value="generator" className="gap-2 px-6 py-2.5 rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Database className="w-4 h-4" />
            Generator
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 px-6 py-2.5 rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm relative">
            <History className="w-4 h-4" />
            History
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-[10px] text-white rounded-full flex items-center justify-center font-bold shadow-sm">
                {history.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="mt-0 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Section */}
            <Card className="lg:col-span-1 border-primary/20 bg-primary/5 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  กำหนดข้อมูลเบื้องต้น
                </CardTitle>
                <CardDescription>
                  ป้อนรายการ SKU และจำนวน QuantityPerBox เดิม
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">ชื่อตาราง (Target Table)</label>
                  <Input 
                    value={targetTable}
                    onChange={(e) => setTargetTable(e.target.value)}
                    placeholder="เช่น TblMasterProduct"
                    className="bg-background/50"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground/80">Column ใน WHERE</label>
                    <div className="flex gap-2">
                      <Input 
                        value={whereColumn}
                        onChange={(e) => setWhereColumn(e.target.value)}
                        placeholder="เช่น SkuCode"
                        className="bg-background/50"
                      />
                      <div className="w-16 shrink-0">
                        <Input 
                          type="number"
                          value={keyColIndex}
                          onChange={(e) => setKeyColIndex(parseInt(e.target.value) || 1)}
                          title="ลำดับคอลัมน์ที่เป็น Key (เริ่มจาก 1)"
                          className="bg-background/50 text-center"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground/80">Column ที่ต้องการ SET</label>
                    <div className="flex gap-2">
                      <Input 
                        value={updateColumn}
                        onChange={(e) => setUpdateColumn(e.target.value)}
                        placeholder="เช่น QuantityPerBox"
                        className="bg-background/50"
                      />
                      <div className="w-16 shrink-0">
                        <Input 
                          type="number"
                          value={valColIndex}
                          onChange={(e) => setValColIndex(parseInt(e.target.value) || 1)}
                          title="ลำดับคอลัมน์ที่เป็นค่าเดิม (เริ่มจาก 1)"
                          className="bg-background/50 text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground/80 flex justify-between items-center">
                    รายการข้อมูล (Format: SKU Qty)
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setInput('')}
                      className="text-destructive h-7 px-2 hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> ล้างข้อมูล
                    </Button>
                  </label>
                  <Textarea 
                    placeholder="FKDRP003Y034 48&#10;FSLT-160G210 24"
                    rows={12}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="font-mono text-xs leading-relaxed bg-background/50"
                  />
                  <p className="text-[11px] text-muted-foreground bg-secondary/30 p-2 rounded-lg border border-border/50">
                    * รองรับการวางผล Select จาก DB Client (Tab Separated) 
                    ระบุลำดับคอลัมน์ของ {whereColumn} และ {updateColumn} ด้านบน
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Table */}
              {products.length > 0 && (
                <Card className="shadow-sm border-border/50">
                  <CardHeader className="py-4 border-b border-border/30 bg-secondary/5">
                    <CardTitle className="text-lg flex items-center justify-between">
                      รายการสินค้าที่ตรวจพบ
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">{products.length} รายการ</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[300px] overflow-auto custom-scrollbar">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px] text-center">No.</TableHead>
                            <TableHead className="py-3">{whereColumn}</TableHead>
                            <TableHead className="text-right py-3 pr-6">Original Qty</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.map((p, i) => (
                            <TableRow key={i} className="group hover:bg-muted/30">
                              <TableCell className="text-center text-muted-foreground font-medium text-xs">{i + 1}</TableCell>
                              <TableCell className="font-mono font-bold text-xs">{p.sku}</TableCell>
                              <TableCell className="text-right font-semibold pr-6 text-xs">{p.originalQty}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* SQL Output blocks */}
              <div className="space-y-6">
                <SQLBlock 
                  title="1. คำสั่งดึงข้อมูลเพื่อตรวจสอบ (Select Query)"
                  description="ใช้รันเพื่อดูข้อมูลปัจจุบันก่อนทำการแก้ไข"
                  sql={selectQuery}
                  icon={<Play className="w-4 h-4 text-blue-500" />}
                  onCopy={() => copyToClipboard(selectQuery, 'Select Query')}
                />

                <SQLBlock 
                  title="2. คำสั่งแก้ไขข้อมูล (Update Query)"
                  description={`ปรับปรุง ${updateColumn} ให้เป็น 1 สำหรับทุกรายการ`}
                  sql={updateQuery}
                  icon={<RefreshCw className="w-4 h-4 text-orange-500" />}
                  onCopy={() => copyToClipboard(updateQuery, 'Update Query')}
                  variant="warning"
                />

                <Card className="border-blue-200 bg-blue-50/10 shadow-sm overflow-hidden">
                  <CardHeader className="pb-3 bg-blue-50/30 border-b border-blue-100/50">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                        <Database className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-base text-blue-900">3. วางผลลัพธ์จาก DB (คัดลอกมาจาก SELECT ในข้อ 1)</CardTitle>
                    </div>
                    <CardDescription className="text-blue-700/70">วางข้อมูลดิบที่คัดลอกมาจาก Database Client เพื่อนำค่าเดิมมาทำ Rollback</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <Textarea 
                      placeholder="วางผลลัพธ์ที่ Copy มาจาก DB ตรงนี้..."
                      rows={6}
                      value={dbInput}
                      onChange={(e) => setDbInput(e.target.value)}
                      className="font-mono text-[11px] bg-white border-blue-100 focus:border-blue-300 focus:ring-blue-100"
                    />
                    {dbProducts.length > 0 && (
                      <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        ตรวจพบข้อมูลพร้อม Rollback {dbProducts.length} รายการ
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                <SQLBlock 
                  title="4. คำสั่งคืนค่าเดิม (Rollback / Revert Query)"
                  description="ใช้ข้อมูลจากข้อ 3 มาสร้างคำสั่ง CASE WHEN เพื่อคืนค่าดั้งเดิม"
                  sql={rollbackQuery}
                  icon={<FileCode className="w-4 h-4 text-emerald-500" />}
                  onCopy={() => copyToClipboard(rollbackQuery, 'Rollback Query')}
                />

                <Card className={cn(
                  "shadow-sm overflow-hidden border-2 transition-colors duration-300",
                  verificationResults 
                    ? (verificationResults.isAllMatched ? 'border-emerald-200 bg-emerald-50/5' : 'border-rose-200 bg-rose-50/5') 
                    : 'border-border/50'
                )}>
                  <CardHeader className={cn(
                    "pb-3 border-b border-border/30",
                    verificationResults 
                    ? (verificationResults.isAllMatched ? 'bg-emerald-50/30' : 'bg-rose-50/30') 
                    : 'bg-secondary/5'
                  )}>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        verificationResults 
                        ? (verificationResults.isAllMatched ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600') 
                        : 'bg-primary/10 text-primary'
                      )}>
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-base">5. ตรวจสอบความถูกต้อง (Final Verification)</CardTitle>
                    </div>
                    <CardDescription>วางผลลัพธ์จาก SELECT อีกครั้ง "หลังทำ Rollback" เพื่อเทียบค่า ก่อน-หลัง</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-6">
                    <Textarea 
                      placeholder="วางผลลัพธ์หลัง Rollback ตรงนี้..."
                      rows={4}
                      value={finalInput}
                      onChange={(e) => setFinalInput(e.target.value)}
                      className="font-mono text-[11px] bg-background/50"
                    />

                    {verificationResults && (
                      <div className="space-y-4 animate-in fade-in duration-500">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-background rounded-2xl border shadow-sm space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">สถานะ</p>
                            <div className="pt-1">
                              {verificationResults.isAllMatched ? (
                                <Badge variant="success" className="px-3 py-1 text-[11px] font-bold">MATCHED ✅</Badge>
                              ) : (
                                <Badge variant="destructive" className="px-3 py-1 text-[11px] font-bold">MISMATCH ❌</Badge>
                              )}
                            </div>
                          </div>
                          <div className="p-4 bg-background rounded-2xl border shadow-sm space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">ตรงกัน</p>
                            <p className="text-xl font-bold pt-1 text-primary">
                              {verificationResults.matchedCount} <span className="text-sm font-medium text-muted-foreground">/ {verificationResults.totalCount}</span>
                            </p>
                          </div>
                          <div className="p-4 bg-background rounded-2xl border shadow-sm space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Sum เดิม</p>
                            <p className="text-xl font-bold pt-1">{verificationResults.sumBefore}</p>
                          </div>
                          <div className="p-4 bg-background rounded-2xl border shadow-sm space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Sum ล่าสุด</p>
                            <p className={cn(
                              "text-xl font-bold pt-1",
                              verificationResults.sumBefore === verificationResults.sumAfter ? 'text-emerald-600' : 'text-rose-600'
                            )}>
                              {verificationResults.sumAfter}
                            </p>
                          </div>
                        </div>

                        {!verificationResults.isAllMatched && (
                          <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                            <Table>
                              <TableHeader className="bg-muted/50">
                                <TableRow>
                                  <TableHead className="py-2.5 text-[10px]">{whereColumn}</TableHead>
                                  <TableHead className="text-right py-2.5 text-[10px]">เดิม</TableHead>
                                  <TableHead className="text-right py-2.5 text-[10px]">ล่าสุด</TableHead>
                                  <TableHead className="w-12 py-2.5 text-center text-[10px]">สถานะ</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {verificationResults.details.map((d, i) => (
                                  <TableRow key={i} className={cn(!d.isMatched ? 'bg-rose-500/[0.03]' : 'bg-transparent')}>
                                    <TableCell className="py-2 text-[11px] font-mono">{d.sku}</TableCell>
                                    <TableCell className="text-right py-2 text-[11px] font-medium text-muted-foreground">{d.before ?? '-'}</TableCell>
                                    <TableCell className="text-right py-2 text-[11px] font-bold">{d.after ?? '-'}</TableCell>
                                    <TableCell className="py-2 text-center text-sm">
                                      {d.isMatched ? '✅' : '❌'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}

                        {verificationResults.isAllMatched && (
                          <div className="p-6 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-2xl text-center flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white mb-2 shadow-lg shadow-emerald-500/20">
                              <RefreshCw className="w-5 h-5" />
                            </div>
                            <h4 className="text-emerald-700 font-bold text-lg">Verification Successful!</h4>
                            <p className="text-emerald-600/80 text-sm font-medium">
                              ข้อมูลทั้งหมดได้รับคืนค่ากลับเป็นจำนวนเดิมอย่างถูกต้องครบถ้วน
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Action Buttons */}
                {products.length > 0 && (
                  <div className="flex justify-end items-center gap-4 pt-4">
                    <p className="text-xs text-muted-foreground font-medium italic">* บันทึกความคืบหน้าเพื่อเรียกดูภายหลังได้ในแท็บ History</p>
                    <Button onClick={saveToHistory} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 rounded-xl px-6">
                      <Save className="w-4 h-4 mr-2" />
                      บันทึกลง History
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                   <h2 className="text-2xl font-bold tracking-tight">Recent History</h2>
                   <p className="text-sm text-muted-foreground">รายการบันทึกล่าสุดที่ถูกจัดเก็บไว้</p>
                </div>
              </div>
              {history.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประวัติทั้งหมด?')) {
                      setHistory([]);
                      localStorage.removeItem('product_sql_history');
                      toast.success('ลบประวัติทั้งหมดเรียบร้อยแล้ว');
                    }
                  }}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All History
                </Button>
              )}
            </div>

            {history.length === 0 ? (
              <Card className="border-dashed py-32 flex flex-col items-center justify-center text-muted-foreground bg-transparent">
                <div className="w-24 h-24 rounded-full bg-secondary/30 flex items-center justify-center mb-6">
                  <History className="w-12 h-12 opacity-20" />
                </div>
                <p className="font-bold text-lg opacity-40">ยังไม่มีประวัติการบันทึก</p>
                <p className="text-sm opacity-30">เริ่มสร้าง SQL และกดบันทึกเพื่อเก็บประวัติที่นี่</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {history.map((item) => (
                  <Card key={item.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50">
                    <CardHeader className="py-5 bg-secondary/10 border-b border-border/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-border shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                            <Database className="w-6 h-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-black">{item.tableName}</CardTitle>
                            <CardDescription className="flex items-center gap-2 font-medium mt-1">
                              <Clock className="w-3.5 h-3.5" /> {item.timestamp}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="font-bold bg-white">{item.itemCount} Items</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6 bg-white/50">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5 p-3 rounded-xl bg-secondary/20 border border-border/30">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">WHERE Column</p>
                          <p className="text-sm font-mono font-bold text-primary">{item.whereColumn}</p>
                        </div>
                        <div className="space-y-1.5 p-3 rounded-xl bg-secondary/20 border border-border/30">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">SET Column</p>
                          <p className="text-sm font-mono font-bold text-emerald-600">{item.updateColumn}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          className="flex-1 rounded-xl font-bold gap-2 shadow-sm"
                          onClick={() => loadFromHistory(item)}
                        >
                          <ChevronRight className="w-4 h-4" /> Load Configuration
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteHistory(item.id)} 
                          className="text-destructive hover:bg-destructive/10 h-11 w-11 rounded-xl"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" className="text-[10px] h-9 font-bold rounded-lg" onClick={() => copyToClipboard(item.queries.select, 'Select Query')}>SELECT</Button>
                        <Button variant="outline" size="sm" className="text-[10px] h-9 font-bold rounded-lg" onClick={() => copyToClipboard(item.queries.update, 'Update Query')}>UPDATE</Button>
                        <Button variant="outline" size="sm" className="text-[10px] h-9 font-bold rounded-lg" onClick={() => copyToClipboard(item.queries.rollback, 'Rollback Query')}>ROLLBACK</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface SQLBlockProps {
  title: string;
  description: string;
  sql: string;
  icon: React.ReactNode;
  onCopy: () => void;
  variant?: 'default' | 'warning';
}

const SQLBlock: React.FC<SQLBlockProps> = ({ title, description, sql, icon, onCopy, variant = 'default' }) => {
  return (
    <Card className={cn(
      "overflow-hidden shadow-sm transition-all duration-300 group",
      variant === 'warning' ? 'border-orange-200 bg-orange-50/10' : 'border-border/50 bg-background/50'
    )}>
      <CardHeader className={cn(
        "pb-3 border-b border-border/30",
        variant === 'warning' ? 'bg-orange-50/30' : 'bg-secondary/5'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-1.5 rounded-lg",
              variant === 'warning' ? 'bg-orange-500/10 text-orange-600' : 'bg-primary/10 text-primary'
            )}>
              {icon}
            </div>
            <CardTitle className="text-base font-bold">{title}</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCopy} 
            className="h-8 gap-2 hover:bg-background/80 shadow-sm border border-border/30"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="font-bold text-xs uppercase tracking-tight">คัดลอก</span>
          </Button>
        </div>
        <CardDescription className={variant === 'warning' ? 'text-orange-700/60' : ''}>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <pre className="p-6 text-zinc-50 font-mono text-[11px] overflow-x-auto leading-relaxed custom-scrollbar bg-[#0f1117] min-h-[100px] max-h-[400px]">
            <code>{sql}</code>
          </pre>
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-zinc-800/80 backdrop-blur-sm rounded-lg px-3 py-1 text-[10px] text-zinc-400 font-bold tracking-widest uppercase border border-white/10">
              PostgreSQL / SQL
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
