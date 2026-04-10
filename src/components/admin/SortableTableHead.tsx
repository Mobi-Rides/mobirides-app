import React from "react";
import { TableHead } from "@/components/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

interface SortableTableHeadProps {
  sortKey: string;
  currentSortKey: string | null;
  currentDirection: "desc" | "asc";
  onSort: (key: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const SortableTableHead: React.FC<SortableTableHeadProps> = ({
  sortKey,
  currentSortKey,
  currentDirection,
  onSort,
  children,
  className = "",
}) => {
  const isActive = currentSortKey === sortKey;

  return (
    <TableHead
      className={`cursor-pointer select-none hover:bg-muted/50 ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {children}
        {isActive ? (
          currentDirection === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5 text-foreground" />
          ) : (
            <ArrowUp className="h-3.5 w-3.5 text-foreground" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
        )}
      </div>
    </TableHead>
  );
};
