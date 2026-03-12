import * as React from "react";
import { 
  Table as ShadcnTable, 
  TableHeader as ShadcnTableHeader, 
  TableBody as ShadcnTableBody, 
  TableFooter as ShadcnTableFooter, 
  TableHead as ShadcnTableHead, 
  TableRow as ShadcnTableRow, 
  TableCell as ShadcnTableCell, 
  TableCaption as ShadcnTableCaption 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Table = React.forwardRef<HTMLTableElement, React.ComponentProps<typeof ShadcnTable>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto custom-scrollbar rounded-xl border border-border/40">
      <ShadcnTable ref={ref} className={className} {...props} />
    </div>
  )
);
Table.displayName = "Table";

export const TableHeader = ShadcnTableHeader;
export const TableBody = ShadcnTableBody;
export const TableFooter = ShadcnTableFooter;
export const TableRow = ShadcnTableRow;
export const TableHead = ShadcnTableHead;
export const TableCell = ShadcnTableCell;
export const TableCaption = ShadcnTableCaption;
