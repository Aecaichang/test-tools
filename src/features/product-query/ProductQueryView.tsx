import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Textarea';
import { Input } from '@/components/common/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/common/Table';
import { Badge } from '@/components/common/Badge';
import { Copy, Trash2, Play, Database, RefreshCw, FileCode, Save, History, Clock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

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
  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator');

  const products = useMemo<ProductItem[]>(() => {
    if (!input.trim()) return [];
    
    return input.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Split by tabs or multiple spaces (usual DB client copy output)
        const parts = line.split(/\t| {2,}/).map(p => p.trim().replace(/['",]/g, ''));
        
        // Use user-defined indices (convert to 0-based)
        // If line has only one part, fallback to index 0 (common for list of SKUs)
        const kIndex = parts.length === 1 ? 0 : Math.max(0, keyColIndex - 1);
        const vIndex = parts.length === 1 ? -1 : Math.max(0, valColIndex - 1);
        
        const sku = parts[kIndex] || parts[0] || '';
        const qtyStr = vIndex >= 0 ? (parts[vIndex] || '0') : '0';
        
        // Handle cases where the value might not be a simple number (e.g. from the user's example)
        let qty = 0;
        if (qtyStr.toLowerCase() === 'true') qty = 1;
        else if (qtyStr.toLowerCase() === 'false') qty = 0;
        else qty = parseInt(qtyStr, 10);
        
        return {
          sku,
          originalQty: isNaN(qty) ? 0 : qty
        };
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
    // Note: We don't restore the raw input text easily without storing it, 
    // but the queries are preserved which is usually what's needed for re-check.
    toast.info('โหลดข้อมูลจากประวัติแล้ว (เฉพาะ Configuration และ Queries)');
    setActiveTab('generator');
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product SQL Generator</h1>
          <p className="text-muted-foreground">เครื่องมือสร้างและจัดเก็บ SQL สำหรับจัดการข้อมูลสินค้า</p>
        </div>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button 
            variant={activeTab === 'generator' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('generator')}
            className="h-8"
          >
            <Database className="w-4 h-4 mr-2" />
            Generator
          </Button>
          <Button 
            variant={activeTab === 'history' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('history')}
            className="h-8 relative"
          >
            <History className="w-4 h-4 mr-2" />
            History
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-[10px] text-white rounded-full flex items-center justify-center">
                {history.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {activeTab === 'generator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <Card className="lg:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              กำหนดข้อมูลเบื้องต้น
            </CardTitle>
            <CardDescription>
              ป้อนรายการ SKU และจำนวน QuantityPerBox เดิม
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ชื่อตาราง (Target Table)</label>
              <Input 
                value={targetTable}
                onChange={(e) => setTargetTable(e.target.value)}
                placeholder="เช่น TblMasterProduct"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Column ใน WHERE</label>
                <div className="flex gap-2">
                  <Input 
                    value={whereColumn}
                    onChange={(e) => setWhereColumn(e.target.value)}
                    placeholder="เช่น SkuCode"
                  />
                  <div className="w-20">
                    <Input 
                      type="number"
                      value={keyColIndex}
                      onChange={(e) => setKeyColIndex(parseInt(e.target.value) || 1)}
                      title="ลำดับคอลัมน์ที่เป็น Key (เริ่มจาก 1)"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Column ที่ต้องการ SET</label>
                <div className="flex gap-2">
                  <Input 
                    value={updateColumn}
                    onChange={(e) => setUpdateColumn(e.target.value)}
                    placeholder="เช่น QuantityPerBox"
                  />
                  <div className="w-20">
                    <Input 
                      type="number"
                      value={valColIndex}
                      onChange={(e) => setValColIndex(parseInt(e.target.value) || 1)}
                      title="ลำดับคอลัมน์ที่เป็นค่าเดิม (เริ่มจาก 1)"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between">
                รายการข้อมูล (Format: SKU Qty)
                <button 
                  onClick={() => setInput('')}
                  className="text-destructive hover:underline text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> ล้างข้อมูล
                </button>
              </label>
              <Textarea 
                placeholder="FKDRP003Y034 48&#10;FSLT-160G210 24"
                rows={15}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="font-mono text-sm leading-relaxed"
              />
              <p className="text-[10px] text-muted-foreground">
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
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-lg flex items-center justify-between">
                  รายการสินค้าที่ตรวจพบ
                  <Badge className="bg-primary">{products.length} รายการ</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[250px] overflow-auto border-t">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">No.</TableHead>
                        <TableHead>{whereColumn}</TableHead>
                        <TableHead className="text-right">Original Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-mono font-medium">{p.sku}</TableCell>
                          <TableCell className="text-right">{p.originalQty}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SQL Output Tabs */}
          <div className="space-y-6">
            {/* Select Query */}
            <SQLBlock 
              title="1. คำสั่งดึงข้อมูลเพื่อตรวจสอบ (Select Query)"
              description="ใช้รันเพื่อดูข้อมูลปัจจุบันก่อนทำการแก้ไข"
              sql={selectQuery}
              icon={<Play className="w-4 h-4 text-blue-500" />}
              onCopy={() => copyToClipboard(selectQuery, 'Select Query')}
            />

            {/* Update Query */}
            <SQLBlock 
              title="2. คำสั่งแก้ไขข้อมูล (Update Query)"
              description={`ปรับปรุง ${updateColumn} ให้เป็น 1 สำหรับทุกรายการ`}
              sql={updateQuery}
              icon={<RefreshCw className="w-4 h-4 text-orange-500" />}
              onCopy={() => copyToClipboard(updateQuery, 'Update Query')}
              variant="warning"
            />

            {/* Step 3: DB Data Paste Area */}
            <Card className="border-blue-200 bg-blue-50/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-base">3. วางผลลัพธ์จาก DB (คัดลอกมาจาก SELECT ในข้อ 1)</CardTitle>
                </div>
                <CardDescription>วางข้อมูลดิบที่คัดลอกมาจาก Database Client เพื่อนำค่าเดิมมาทำ Rollback</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder="วางผลลัพธ์ที่ Copy มาจาก DB ตรงนี้..."
                  rows={6}
                  value={dbInput}
                  onChange={(e) => setDbInput(e.target.value)}
                  className="font-mono text-xs"
                />
                {dbProducts.length > 0 && (
                  <Badge variant="outline" className="bg-white">
                    ตรวจพบข้อมูลพร้อม Rollback {dbProducts.length} รายการ
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Rollback Query (Now step 4) */}
            <SQLBlock 
              title="4. คำสั่งคืนค่าเดิม (Rollback / Revert Query)"
              description="ใช้ข้อมูลจากข้อ 3 มาสร้างคำสั่ง CASE WHEN เพื่อคืนค่าดั้งเดิม"
              sql={rollbackQuery}
              icon={<FileCode className="w-4 h-4 text-emerald-500" />}
              onCopy={() => copyToClipboard(rollbackQuery, 'Rollback Query')}
            />

            {/* Step 5: Verification Area */}
            <Card className={verificationResults ? (verificationResults.isAllMatched ? 'border-emerald-200 bg-emerald-50/20' : 'border-rose-200 bg-rose-50/20') : 'border-zinc-200'}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">5. ตรวจสอบความถูกต้อง (Final Verification)</CardTitle>
                </div>
                <CardDescription>วางผลลัพธ์จาก SELECT อีกครั้ง "หลังทำ Rollback" เพื่อเทียบค่า ก่อน-หลัง</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Textarea 
                  placeholder="วางผลลัพธ์หลัง Rollback ตรงนี้..."
                  rows={4}
                  value={finalInput}
                  onChange={(e) => setFinalInput(e.target.value)}
                  className="font-mono text-xs"
                />

                {verificationResults && (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-white rounded-lg border shadow-sm">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">สถานะ</p>
                        <div className="flex items-center gap-2 mt-1">
                          {verificationResults.isAllMatched ? (
                            <Badge className="bg-emerald-500">Matched ✅</Badge>
                          ) : (
                            <Badge variant="destructive">Mismatch ❌</Badge>
                          )}
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-lg border shadow-sm">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">ตรงกัน</p>
                        <p className="text-lg font-bold mt-1 text-primary">
                          {verificationResults.matchedCount} / {verificationResults.totalCount}
                        </p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border shadow-sm">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Sum {updateColumn} (ก่อน)</p>
                        <p className="text-lg font-bold mt-1">{verificationResults.sumBefore}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border shadow-sm">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Sum {updateColumn} (หลัง)</p>
                        <p className="text-lg font-bold mt-1 {verificationResults.sumBefore === verificationResults.sumAfter ? 'text-emerald-600' : 'text-rose-600'}">
                          {verificationResults.sumAfter}
                        </p>
                      </div>
                    </div>

                    {!verificationResults.isAllMatched && (
                      <div className="max-h-[200px] overflow-auto border rounded-lg">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead className="py-2">{whereColumn}</TableHead>
                              <TableHead className="text-right py-2">เดิม</TableHead>
                              <TableHead className="text-right py-2">ล่าสุด</TableHead>
                              <TableHead className="w-10 py-2"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {verificationResults.details.map((d, i) => (
                              <TableRow key={i} className={!d.isMatched ? 'bg-rose-50/50' : ''}>
                                <TableCell className="py-2 text-xs font-mono">{d.sku}</TableCell>
                                <TableCell className="text-right py-2 text-xs">{d.before ?? '-'}</TableCell>
                                <TableCell className="text-right py-2 text-xs font-bold">{d.after ?? '-'}</TableCell>
                                <TableCell className="py-2">
                                  {d.isMatched ? '✅' : '❌'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {verificationResults.isAllMatched && (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-center text-emerald-800 text-sm font-medium">
                        🎉 ข้อมูลทั้งหมดได้รับคืนค่ากลับเป็นจำนวนเดิมอย่างถูกต้องครบถ้วน
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Action Buttons */}
            {products.length > 0 && (
              <div className="flex justify-end pt-4">
                <Button onClick={saveToHistory} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-4 h-4 mr-2" />
                  บันทึกลง History (ชั่วคราว)
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      ) : (
        /* History View */
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          {history.length === 0 ? (
            <Card className="border-dashed py-24 flex flex-col items-center justify-center text-muted-foreground">
              <History className="w-12 h-12 mb-4 opacity-20" />
              <p>ยังไม่มีประวัติการบันทึก</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {history.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="py-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{item.tableName}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            {item.timestamp} • {item.itemCount} รายการ
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => loadFromHistory(item)}>
                          <ChevronRight className="w-4 h-4 mr-1" /> รายละเอียด
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteHistory(item.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">WHERE Column</p>
                      <p className="text-sm font-mono">{item.whereColumn}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">SET Column</p>
                      <p className="text-sm font-mono">{item.updateColumn}</p>
                    </div>
                    <div className="flex items-end justify-end gap-2">
                      <Button variant="secondary" size="sm" className="text-[10px] h-7" onClick={() => copyToClipboard(item.queries.select, 'Select Query')}>SELECT</Button>
                      <Button variant="secondary" size="sm" className="text-[10px] h-7" onClick={() => copyToClipboard(item.queries.update, 'Update Query')}>UPDATE</Button>
                      <Button variant="secondary" size="sm" className="text-[10px] h-7" onClick={() => copyToClipboard(item.queries.rollback, 'Rollback Query')}>ROLLBACK</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
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
    <Card className={variant === 'warning' ? 'border-orange-200 bg-orange-50/30' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onCopy} className="h-8 gap-1.5">
            <Copy className="w-3.5 h-3.5" />
            คัดลอก
          </Button>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative group">
          <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-50 font-mono text-xs overflow-x-auto leading-relaxed border border-zinc-800">
            <code>{sql}</code>
          </pre>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-zinc-800/80 backdrop-blur-sm rounded px-2 py-1 text-[10px] text-zinc-400">
              PostgreSQL / SQL
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
