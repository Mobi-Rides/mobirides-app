import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface PaginatedTableProps<T> {
  data: T[];
  itemsPerPage?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  className?: string;
  showLoadMore?: boolean;
}

export function PaginatedTable<T>({
  data,
  itemsPerPage = 10,
  renderItem,
  renderHeader,
  className = "",
  showLoadMore = false,
}: PaginatedTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [loadMoreCount, setLoadMoreCount] = useState(itemsPerPage);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    if (showLoadMore) {
      return data.slice(0, loadMoreCount);
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  }, [data, currentPage, itemsPerPage, showLoadMore, loadMoreCount]);

  const handleLoadMore = () => {
    setLoadMoreCount(prev => Math.min(prev + itemsPerPage, data.length));
  };

  const hasMoreItems = showLoadMore && loadMoreCount < data.length;

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className={className}>
      {renderHeader && renderHeader()}
      
      <div className="space-y-2">
        {paginatedData.map((item, index) => renderItem(item, index))}
      </div>

      {showLoadMore ? (
        hasMoreItems && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              size="sm"
            >
              Load More ({Math.min(itemsPerPage, data.length - loadMoreCount)} more)
            </Button>
          </div>
        )
      ) : (
        totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )
      )}
    </div>
  );
}