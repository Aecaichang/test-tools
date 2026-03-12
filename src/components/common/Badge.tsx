import * as React from "react";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.ComponentProps<typeof ShadcnBadge> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <ShadcnBadge 
      variant={variant as any} 
      className={cn(className)} 
      {...props} 
    />
  );
}

export { Badge };
