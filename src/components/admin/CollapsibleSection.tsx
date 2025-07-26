import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  previewContent?: React.ReactNode;
  itemCount?: number;
  onViewAll?: () => void;
  defaultOpen?: boolean;
  showViewAllButton?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  previewContent,
  itemCount,
  onViewAll,
  defaultOpen = false,
  showViewAllButton = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {itemCount !== undefined && (
              <span className="text-sm text-muted-foreground">
                {itemCount} items
              </span>
            )}
            {showViewAllButton && onViewAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewAll}
                className="gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                View All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {previewContent && !isOpen && (
          <div className="space-y-3">
            {previewContent}
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full gap-2">
                  Show More
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        )}
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent>
            {children}
            {previewContent && (
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full gap-2 mt-3">
                  Show Less
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};