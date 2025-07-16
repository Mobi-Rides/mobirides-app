import React from "react";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

interface ActionButtonProps extends React.ComponentProps<typeof Button> {
  icon?: React.ReactNode;
  label?: string;
  tooltip?: string;
  iconOnly?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  tooltip,
  iconOnly = false,
  children,
  ...props
}) => {
  const content = (
    <Button {...props}>
      <span className="flex items-center gap-1">
        {icon}
        {!iconOnly && (label || children)}
      </span>
    </Button>
  );

  return tooltip ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : content;
};
