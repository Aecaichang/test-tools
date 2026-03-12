import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { Button as ShadcnButton, buttonVariants } from "@/components/ui/button";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, ...props }, ref) => {
    // Map 'primary' to shadcn's 'default' for backward compatibility
    // if variant is a string and equals 'primary'
    const finalVariant = (variant as string) === 'primary' ? 'default' : variant;
    
    return (
      <ShadcnButton
        ref={ref}
        variant={finalVariant as VariantProps<typeof buttonVariants>['variant']}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
